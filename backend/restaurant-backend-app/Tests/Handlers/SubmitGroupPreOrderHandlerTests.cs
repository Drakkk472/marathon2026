using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;
using APIHandler.Exceptions;
using APIHandler.Handlers.GroupReservations;
using APIHandler.Models.GuestSessions;
using APIHandler.Services.GuestSessions;
using Moq;
using System.Text.Json;

namespace APIHandler.Tests.Handlers;

public class SubmitGroupPreOrderHandlerTests
{
    private const string GroupReservationId = "group-1";
    private const string ReservationId = "reservation-1";
    private const string UserId = "owner-1";

    [Fact]
    public async Task HandleRequest_AuthenticatedOwner_ReturnsAggregatedDishesAsJsonArray()
    {
        List<SubmittedDishQuantityResponse> dishes =
        [
            new("dish-1", 5),
            new("dish-2", 1)
        ];
        var service = new Mock<IGuestSessionService>();
        service
            .Setup(item => item.SubmitGroupPreOrderAsync(GroupReservationId, ReservationId, UserId))
            .ReturnsAsync(dishes);

        var response = await CreateHandler(service).HandleRequest(CreateRequest(authenticated: true), CreateContext());

        Assert.Equal(200, response.StatusCode);
        using var document = JsonDocument.Parse(response.Body);
        Assert.Equal(JsonValueKind.Array, document.RootElement.ValueKind);
        var actual = document.RootElement.EnumerateArray().ToArray();
        Assert.Equal(2, actual.Length);
        Assert.Equal("dish-1", actual[0].GetProperty("dishId").GetString());
        Assert.Equal(5, actual[0].GetProperty("quantity").GetInt32());
        Assert.Equal("dish-2", actual[1].GetProperty("dishId").GetString());
        Assert.Equal(1, actual[1].GetProperty("quantity").GetInt32());
        service.Verify(item => item.SubmitGroupPreOrderAsync(GroupReservationId, ReservationId, UserId), Times.Once);
    }

    [Fact]
    public async Task HandleRequest_UnauthenticatedCaller_ReturnsUnauthorized()
    {
        var service = new Mock<IGuestSessionService>();

        var response = await CreateHandler(service).HandleRequest(CreateRequest(authenticated: false), CreateContext());

        Assert.Equal(401, response.StatusCode);
        service.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task HandleRequest_NonOwner_ReturnsForbidden()
    {
        var service = new Mock<IGuestSessionService>();
        service
            .Setup(item => item.SubmitGroupPreOrderAsync(GroupReservationId, ReservationId, UserId))
            .ThrowsAsync(new ActionForbiddenException("Forbidden."));

        var response = await CreateHandler(service).HandleRequest(CreateRequest(authenticated: true), CreateContext());

        Assert.Equal(403, response.StatusCode);
    }

    [Theory]
    [InlineData("group")]
    [InlineData("reservation")]
    public async Task HandleRequest_MissingGroupOrReservation_ReturnsNotFound(string missingEntity)
    {
        var service = new Mock<IGuestSessionService>();
        Exception exception = missingEntity == "group"
            ? new GroupReservationNotFoundException()
            : new ReservationNotFoundException("Missing reservation.");
        service
            .Setup(item => item.SubmitGroupPreOrderAsync(GroupReservationId, ReservationId, UserId))
            .ThrowsAsync(exception);

        var response = await CreateHandler(service).HandleRequest(CreateRequest(authenticated: true), CreateContext());

        Assert.Equal(404, response.StatusCode);
    }

    [Theory]
    [InlineData("The reservationId must match the group reservation's linked reservation.")]
    [InlineData("There are no submitted guest sessions.")]
    [InlineData("Submitted guest sessions contain no dishes.")]
    [InlineData("No order exists for the reservation.")]
    public async Task HandleRequest_InvalidSubmission_ReturnsBadRequest(string validationMessage)
    {
        var service = new Mock<IGuestSessionService>();
        service
            .Setup(item => item.SubmitGroupPreOrderAsync(GroupReservationId, ReservationId, UserId))
            .ThrowsAsync(new ValidationException(validationMessage));

        var response = await CreateHandler(service).HandleRequest(CreateRequest(authenticated: true), CreateContext());

        Assert.Equal(400, response.StatusCode);
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task HandleRequest_GroupLifecycleConflict_ReturnsConflict(bool groupAlreadySubmitted)
    {
        var service = new Mock<IGuestSessionService>();
        Exception exception = groupAlreadySubmitted
            ? new GroupReservationSubmittedException()
            : new GroupReservationExpiredException();
        service
            .Setup(item => item.SubmitGroupPreOrderAsync(GroupReservationId, ReservationId, UserId))
            .ThrowsAsync(exception);

        var response = await CreateHandler(service).HandleRequest(CreateRequest(authenticated: true), CreateContext());

        Assert.Equal(409, response.StatusCode);
    }

    private static SubmitGroupPreOrderHandler CreateHandler(Mock<IGuestSessionService> service) =>
        new(service.Object);

    private static APIGatewayProxyRequest CreateRequest(bool authenticated) => new()
    {
        PathParameters = new Dictionary<string, string> { ["groupReservationId"] = GroupReservationId },
        Body = JsonSerializer.Serialize(new { reservationId = ReservationId }),
        RequestContext = new APIGatewayProxyRequest.ProxyRequestContext
        {
            Authorizer = new APIGatewayCustomAuthorizerContext
            {
                Claims = authenticated
                    ? new Dictionary<string, string> { ["sub"] = UserId }
                    : new Dictionary<string, string>()
            }
        }
    };

    private static ILambdaContext CreateContext()
    {
        var logger = new Mock<ILambdaLogger>();
        var context = new Mock<ILambdaContext>();
        context.SetupGet(item => item.Logger).Returns(logger.Object);
        return context.Object;
    }
}
