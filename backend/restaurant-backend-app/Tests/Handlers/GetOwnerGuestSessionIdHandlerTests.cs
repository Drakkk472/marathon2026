using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;
using APIHandler.Exceptions;
using APIHandler.Handlers.Reservations;
using APIHandler.Services.GuestSessions;
using Moq;
using System.Text.Json;

namespace APIHandler.Tests.Handlers;

public class GetOwnerGuestSessionIdHandlerTests
{
    private const string ReservationId = "reservation-1";
    private const string UserId = "owner-1";

    [Fact]
    public async Task HandleRequest_AuthenticatedOwner_ReturnsGuestSessionIdJson()
    {
        var service = new Mock<IGuestSessionService>();
        service
            .Setup(item => item.GetOwnerGuestSessionIdAsync(ReservationId, UserId))
            .ReturnsAsync("session-1");

        var response = await CreateHandler(service).HandleRequest(CreateRequest(authenticated: true), CreateContext());

        Assert.Equal(200, response.StatusCode);
        using var document = JsonDocument.Parse(response.Body);
        Assert.Equal("session-1", document.RootElement.GetProperty("guestSessionId").GetString());
        Assert.Equal(1, document.RootElement.EnumerateObject().Count());
        service.Verify(item => item.GetOwnerGuestSessionIdAsync(ReservationId, UserId), Times.Once);
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
            .Setup(item => item.GetOwnerGuestSessionIdAsync(ReservationId, UserId))
            .ThrowsAsync(new ActionForbiddenException("Forbidden."));

        var response = await CreateHandler(service).HandleRequest(CreateRequest(authenticated: true), CreateContext());

        Assert.Equal(403, response.StatusCode);
    }

    [Theory]
    [InlineData("reservation")]
    [InlineData("group")]
    [InlineData("session")]
    public async Task HandleRequest_MissingReservationGroupOrOwnerSession_ReturnsNotFound(string missingEntity)
    {
        var service = new Mock<IGuestSessionService>();
        Exception exception = missingEntity switch
        {
            "reservation" => new ReservationNotFoundException("Missing reservation."),
            "group" => new GroupReservationNotFoundException(),
            _ => new GuestSessionNotFoundException("Missing owner session.")
        };
        service
            .Setup(item => item.GetOwnerGuestSessionIdAsync(ReservationId, UserId))
            .ThrowsAsync(exception);

        var response = await CreateHandler(service).HandleRequest(CreateRequest(authenticated: true), CreateContext());

        Assert.Equal(404, response.StatusCode);
    }

    private static GetOwnerGuestSessionIdHandler CreateHandler(Mock<IGuestSessionService> service) =>
        new(service.Object);

    private static APIGatewayProxyRequest CreateRequest(bool authenticated) => new()
    {
        PathParameters = new Dictionary<string, string> { ["reservationId"] = ReservationId },
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
