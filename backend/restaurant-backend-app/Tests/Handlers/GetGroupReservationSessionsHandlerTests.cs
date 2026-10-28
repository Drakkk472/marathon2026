using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;
using APIHandler.Handlers.GuestSessions;
using APIHandler.Models.GuestSessions;
using APIHandler.Services.GuestSessions;
using Moq;
using System.Text.Json;

namespace APIHandler.Tests.Handlers;

public class GetGroupReservationSessionsHandlerTests
{
    [Fact]
    public async Task HandleRequest_SessionsResponse_UsesCamelCaseJsonShape()
    {
        const string userId = "owner-1";
        const string groupReservationId = "group-1";
        var sessions = new GetAllSessionsResponse(
            [
                new Participant(
                    "session-1",
                    ParticipantType.Guest,
                    "Taylor",
                    [new SessionOrderItemResponse(new SessionDishResponse("dish-1", "Soup", 4.25m), 2)],
                    8.50m,
                    true)
            ],
            8.50m);

        var guestSessionService = new Mock<IGuestSessionService>();
        guestSessionService
            .Setup(service => service.GetGroupReservationSessionsAsync(userId, groupReservationId))
            .ReturnsAsync(sessions);

        var logger = new Mock<ILambdaLogger>();
        var context = new Mock<ILambdaContext>();
        context.SetupGet(lambdaContext => lambdaContext.Logger).Returns(logger.Object);
        var request = new APIGatewayProxyRequest
        {
            PathParameters = new Dictionary<string, string>
            {
                ["groupReservationId"] = groupReservationId
            },
            RequestContext = new APIGatewayProxyRequest.ProxyRequestContext
            {
                Authorizer = new APIGatewayCustomAuthorizerContext
                {
                    Claims = new Dictionary<string, string>
                    {
                        ["sub"] = userId
                    }
                }
            }
        };
        var handler = new GetGroupReservationSessionsHandler(guestSessionService.Object);

        var response = await handler.HandleRequest(request, context.Object);

        Assert.Equal(200, response.StatusCode);
        using var document = JsonDocument.Parse(response.Body);
        var root = document.RootElement;
        AssertPropertyNames(root, "participants", "total");
        Assert.Equal(8.50m, root.GetProperty("total").GetDecimal());

        var participant = Assert.Single(root.GetProperty("participants").EnumerateArray());
        AssertPropertyNames(participant, "id", "type", "name", "items", "total", "isSubmitted");
        Assert.Equal("session-1", participant.GetProperty("id").GetString());
        Assert.Equal("Guest", participant.GetProperty("type").GetString());
        Assert.Equal("Taylor", participant.GetProperty("name").GetString());
        Assert.Equal(8.50m, participant.GetProperty("total").GetDecimal());
        Assert.True(participant.GetProperty("isSubmitted").GetBoolean());

        var item = Assert.Single(participant.GetProperty("items").EnumerateArray());
        AssertPropertyNames(item, "dish", "quantity");
        Assert.Equal(2, item.GetProperty("quantity").GetInt32());

        var dish = item.GetProperty("dish");
        AssertPropertyNames(dish, "id", "name", "price");
        Assert.Equal("dish-1", dish.GetProperty("id").GetString());
        Assert.Equal("Soup", dish.GetProperty("name").GetString());
        Assert.Equal(4.25m, dish.GetProperty("price").GetDecimal());

        guestSessionService.Verify(
            service => service.GetGroupReservationSessionsAsync(userId, groupReservationId),
            Times.Once);
    }

    private static void AssertPropertyNames(JsonElement element, params string[] expectedNames)
    {
        Assert.Equal(
            expectedNames.Order(),
            element.EnumerateObject().Select(property => property.Name).Order());
    }
}
