using APIHandler.Constants.Orders;
using APIHandler.Constants;
using APIHandler.Entities;
using APIHandler.Exceptions;
using APIHandler.Repositories.Dishes;
using APIHandler.Repositories.GroupReservations;
using APIHandler.Repositories.GuestSessions;
using APIHandler.Repositories.Orders;
using APIHandler.Repositories.Reservations;
using APIHandler.Repositories.Auth;
using APIHandler.Repositories.Tables;
using APIHandler.Services.GuestSessions;
using Moq;

namespace APIHandler.Tests.Services;

public class OwnerGroupPreOrderServiceTests
{
    private const string ReservationId = "reservation-1";
    private const string GroupReservationId = "group-1";
    private const string OwnerId = "owner-1";

    private readonly Mock<IGroupReservationRepository> _groups = new();
    private readonly Mock<IGuestSessionRepository> _sessions = new();
    private readonly Mock<IOrderRepository> _orders = new();
    private readonly Mock<IReservationRepository> _reservations = new();
    private readonly GuestSessionService _service;

    public OwnerGroupPreOrderServiceTests()
    {
        _service = new GuestSessionService(
            _groups.Object,
            _sessions.Object,
            Mock.Of<IDishRepository>(),
            _reservations.Object,
            Mock.Of<IUserRepository>(),
            Mock.Of<ITableRepository>(),
            _orders.Object);
    }

    [Fact]
    public async Task GetOwnerGuestSessionIdAsync_ReturnsOwnerSessionForReservationOwner()
    {
        ConfigureReservationOwner();
        _groups
            .Setup(repository => repository.GetByReservationIdAsync(ReservationId))
            .ReturnsAsync(CreateGroupReservation());
        _sessions
            .Setup(repository => repository.GetAllByGroupReservationIdAsync(GroupReservationId))
            .ReturnsAsync(
            [
                CreateSession("guest-session", isOwner: false, ownerUserId: null),
                CreateSession("owner-session", isOwner: true, ownerUserId: OwnerId)
            ]);

        string sessionId = await _service.GetOwnerGuestSessionIdAsync(ReservationId, OwnerId);

        Assert.Equal("owner-session", sessionId);
    }

    [Fact]
    public async Task GetOwnerGuestSessionIdAsync_MissingReservation_ThrowsNotFound()
    {
        _reservations
            .Setup(repository => repository.GetReservationByIdAsync(ReservationId))
            .ReturnsAsync((Reservation?)null);

        await Assert.ThrowsAsync<ReservationNotFoundException>(
            () => _service.GetOwnerGuestSessionIdAsync(ReservationId, OwnerId));
    }

    [Fact]
    public async Task GetOwnerGuestSessionIdAsync_NonOwner_ThrowsForbidden()
    {
        ConfigureReservationOwner(customerId: "different-owner");

        await Assert.ThrowsAsync<ActionForbiddenException>(
            () => _service.GetOwnerGuestSessionIdAsync(ReservationId, OwnerId));
        _groups.Verify(repository => repository.GetByReservationIdAsync(It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task GetOwnerGuestSessionIdAsync_MissingGroup_ThrowsNotFound()
    {
        ConfigureReservationOwner();
        _groups
            .Setup(repository => repository.GetByReservationIdAsync(ReservationId))
            .ReturnsAsync((GroupReservation?)null);

        await Assert.ThrowsAsync<GroupReservationNotFoundException>(
            () => _service.GetOwnerGuestSessionIdAsync(ReservationId, OwnerId));
    }

    [Fact]
    public async Task GetOwnerGuestSessionIdAsync_MissingOwnerSession_ThrowsNotFound()
    {
        ConfigureReservationOwner();
        _groups
            .Setup(repository => repository.GetByReservationIdAsync(ReservationId))
            .ReturnsAsync(CreateGroupReservation());
        _sessions
            .Setup(repository => repository.GetAllByGroupReservationIdAsync(GroupReservationId))
            .ReturnsAsync([CreateSession("guest-session", isOwner: false, ownerUserId: null)]);

        await Assert.ThrowsAsync<GuestSessionNotFoundException>(
            () => _service.GetOwnerGuestSessionIdAsync(ReservationId, OwnerId));
    }

    [Fact]
    public async Task SubmitGroupPreOrderAsync_AggregatesSubmittedSessionsAndSavesSubmittedOrderAndGroup()
    {
        var group = CreateGroupReservation();
        var order = CreateOrder();
        ConfigureSubmitEntities(group, order);
        _sessions
            .Setup(repository => repository.GetAllByGroupReservationIdAsync(GroupReservationId))
            .ReturnsAsync(
            [
                CreateSession("submitted-1", isOwner: false, ownerUserId: null, true,
                    new OrderItem { DishId = "dish-1", Quantity = 2, State = OrderItemState.Pending },
                    new OrderItem { DishId = "dish-2", Quantity = 1, State = OrderItemState.Pending }),
                CreateSession("submitted-2", isOwner: false, ownerUserId: null, true,
                    new OrderItem { DishId = "dish-1", Quantity = 3, State = OrderItemState.Confirmed }),
                CreateSession("not-submitted", isOwner: false, ownerUserId: null, false,
                    new OrderItem { DishId = "dish-1", Quantity = 100, State = OrderItemState.Pending })
            ]);

        var result = await _service.SubmitGroupPreOrderAsync(GroupReservationId, ReservationId, OwnerId);

        Assert.Equal(
            [new("dish-1", 5), new("dish-2", 1)],
            result);
        Assert.Equal(OrderStatus.SubmittedByCustomer, order.Status);
        Assert.Equal(
            [("dish-1", 5, OrderItemState.Pending), ("dish-2", 1, OrderItemState.Pending)],
            order.Dishes.Select(dish => (dish.DishId, dish.Quantity, dish.State)));
        Assert.Equal(GroupReservationStatus.Submitted, group.Status);
        _orders.Verify(repository => repository.SaveOrderAsync(order), Times.Once);
        _groups.Verify(repository => repository.SaveGroupReservationAsync(group), Times.Once);
    }

    [Fact]
    public async Task SubmitGroupPreOrderAsync_MissingGroup_ThrowsNotFound()
    {
        _groups
            .Setup(repository => repository.GetGroupReservationByIdAsync(GroupReservationId))
            .ReturnsAsync((GroupReservation?)null);

        await Assert.ThrowsAsync<GroupReservationNotFoundException>(
            () => _service.SubmitGroupPreOrderAsync(GroupReservationId, ReservationId, OwnerId));
    }

    [Fact]
    public async Task SubmitGroupPreOrderAsync_MissingReservation_ThrowsNotFound()
    {
        var group = CreateGroupReservation();
        _groups
            .Setup(repository => repository.GetGroupReservationByIdAsync(GroupReservationId))
            .ReturnsAsync(group);
        _reservations
            .Setup(repository => repository.GetReservationByIdAsync(ReservationId))
            .ReturnsAsync((Reservation?)null);

        await Assert.ThrowsAsync<ReservationNotFoundException>(
            () => _service.SubmitGroupPreOrderAsync(GroupReservationId, ReservationId, OwnerId));
    }

    [Fact]
    public async Task SubmitGroupPreOrderAsync_NonOwner_ThrowsForbidden()
    {
        ConfigureSubmitEntities(CreateGroupReservation(), CreateOrder(), customerId: "other-owner");

        await Assert.ThrowsAsync<ActionForbiddenException>(
            () => _service.SubmitGroupPreOrderAsync(GroupReservationId, ReservationId, OwnerId));
        _sessions.Verify(repository => repository.GetAllByGroupReservationIdAsync(It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task SubmitGroupPreOrderAsync_ReservationDoesNotMatchGroup_ThrowsValidation()
    {
        ConfigureSubmitEntities(CreateGroupReservation(), CreateOrder());

        await Assert.ThrowsAsync<ValidationException>(
            () => _service.SubmitGroupPreOrderAsync(GroupReservationId, "different-reservation", OwnerId));
        _sessions.Verify(repository => repository.GetAllByGroupReservationIdAsync(It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task SubmitGroupPreOrderAsync_ClosedGroup_ThrowsExpiredBeforeMutatingOrSavingEntities()
    {
        var group = CreateGroupReservation();
        group.Status = GroupReservationStatus.Closed;
        var order = CreateOrder();
        var originalDishes = order.Dishes
            .Select(dish => (dish.DishId, dish.Quantity, dish.State))
            .ToArray();
        var originalStatus = order.Status;
        ConfigureSubmitEntities(group, order);

        await Assert.ThrowsAsync<GroupReservationExpiredException>(
            () => _service.SubmitGroupPreOrderAsync(GroupReservationId, ReservationId, OwnerId));

        Assert.Equal(GroupReservationStatus.Closed, group.Status);
        Assert.Equal(originalStatus, order.Status);
        Assert.Equal(originalDishes, order.Dishes.Select(dish => (dish.DishId, dish.Quantity, dish.State)));
        _sessions.Verify(repository => repository.GetAllByGroupReservationIdAsync(It.IsAny<string>()), Times.Never);
        _orders.Verify(repository => repository.SaveOrderAsync(It.IsAny<Order>()), Times.Never);
        _groups.Verify(repository => repository.SaveGroupReservationAsync(It.IsAny<GroupReservation>()), Times.Never);
    }

    [Fact]
    public async Task SubmitGroupPreOrderAsync_SubmittedGroup_ThrowsSubmittedBeforeMutatingOrSavingEntities()
    {
        var group = CreateGroupReservation();
        group.Status = GroupReservationStatus.Submitted;
        var order = CreateOrder();
        var originalDishes = order.Dishes
            .Select(dish => (dish.DishId, dish.Quantity, dish.State))
            .ToArray();
        var originalStatus = order.Status;
        ConfigureSubmitEntities(group, order);

        await Assert.ThrowsAsync<GroupReservationSubmittedException>(
            () => _service.SubmitGroupPreOrderAsync(GroupReservationId, ReservationId, OwnerId));

        Assert.Equal(GroupReservationStatus.Submitted, group.Status);
        Assert.Equal(originalStatus, order.Status);
        Assert.Equal(originalDishes, order.Dishes.Select(dish => (dish.DishId, dish.Quantity, dish.State)));
        _sessions.Verify(repository => repository.GetAllByGroupReservationIdAsync(It.IsAny<string>()), Times.Never);
        _orders.Verify(repository => repository.SaveOrderAsync(It.IsAny<Order>()), Times.Never);
        _groups.Verify(repository => repository.SaveGroupReservationAsync(It.IsAny<GroupReservation>()), Times.Never);
    }

    [Theory]
    [InlineData(ReservationStatus.Cancelled)]
    [InlineData(ReservationStatus.InProgress)]
    [InlineData(ReservationStatus.Completed)]
    public async Task SubmitGroupPreOrderAsync_NonReservedParentReservation_ThrowsExpiredBeforeMutatingOrSavingEntities(
        ReservationStatus reservationStatus)
    {
        var group = CreateGroupReservation();
        var order = CreateOrder();
        var originalDishes = order.Dishes
            .Select(dish => (dish.DishId, dish.Quantity, dish.State))
            .ToArray();
        var originalStatus = order.Status;
        ConfigureSubmitEntities(group, order);
        var reservation = CreateReservation(OwnerId);
        reservation.Status = reservationStatus;
        _reservations
            .Setup(repository => repository.GetReservationByIdAsync(ReservationId))
            .ReturnsAsync(reservation);

        await Assert.ThrowsAsync<GroupReservationExpiredException>(
            () => _service.SubmitGroupPreOrderAsync(GroupReservationId, ReservationId, OwnerId));

        Assert.Equal(GroupReservationStatus.Open, group.Status);
        Assert.Equal(originalStatus, order.Status);
        Assert.Equal(originalDishes, order.Dishes.Select(dish => (dish.DishId, dish.Quantity, dish.State)));
        _sessions.Verify(repository => repository.GetAllByGroupReservationIdAsync(It.IsAny<string>()), Times.Never);
        _orders.Verify(repository => repository.SaveOrderAsync(It.IsAny<Order>()), Times.Never);
        _groups.Verify(repository => repository.SaveGroupReservationAsync(It.IsAny<GroupReservation>()), Times.Never);
    }

    [Fact]
    public async Task SubmitGroupPreOrderAsync_NoSubmittedSessions_ThrowsValidation()
    {
        ConfigureSubmitEntities(CreateGroupReservation(), CreateOrder());
        _sessions
            .Setup(repository => repository.GetAllByGroupReservationIdAsync(GroupReservationId))
            .ReturnsAsync([CreateSession("not-submitted", false, null, false)]);

        await Assert.ThrowsAsync<ValidationException>(
            () => _service.SubmitGroupPreOrderAsync(GroupReservationId, ReservationId, OwnerId));
        _orders.Verify(repository => repository.GetOrderByReservationIdAsync(It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task SubmitGroupPreOrderAsync_NoSubmittedDishes_ThrowsValidation()
    {
        ConfigureSubmitEntities(CreateGroupReservation(), CreateOrder());
        _sessions
            .Setup(repository => repository.GetAllByGroupReservationIdAsync(GroupReservationId))
            .ReturnsAsync([CreateSession("empty-submission", false, null, true)]);

        await Assert.ThrowsAsync<ValidationException>(
            () => _service.SubmitGroupPreOrderAsync(GroupReservationId, ReservationId, OwnerId));
        _orders.Verify(repository => repository.GetOrderByReservationIdAsync(It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task SubmitGroupPreOrderAsync_MissingOrder_ThrowsValidation()
    {
        ConfigureSubmitEntities(CreateGroupReservation(), order: null);
        _sessions
            .Setup(repository => repository.GetAllByGroupReservationIdAsync(GroupReservationId))
            .ReturnsAsync(
            [
                CreateSession("submitted", false, null, true,
                    new OrderItem { DishId = "dish-1", Quantity = 1, State = OrderItemState.Pending })
            ]);
        _orders
            .Setup(repository => repository.GetOrderByReservationIdAsync(ReservationId))
            .ReturnsAsync((Order?)null);

        await Assert.ThrowsAsync<ValidationException>(
            () => _service.SubmitGroupPreOrderAsync(GroupReservationId, ReservationId, OwnerId));
        _orders.Verify(repository => repository.SaveOrderAsync(It.IsAny<Order>()), Times.Never);
    }

    private void ConfigureReservationOwner(string customerId = OwnerId)
    {
        _reservations
            .Setup(repository => repository.GetReservationByIdAsync(ReservationId))
            .ReturnsAsync(CreateReservation(customerId));
    }

    private void ConfigureSubmitEntities(
        GroupReservation group,
        Order? order,
        string customerId = OwnerId)
    {
        _groups
            .Setup(repository => repository.GetGroupReservationByIdAsync(GroupReservationId))
            .ReturnsAsync(group);
        _reservations
            .Setup(repository => repository.GetReservationByIdAsync(ReservationId))
            .ReturnsAsync(CreateReservation(customerId));
        if (order is not null)
        {
            _orders
                .Setup(repository => repository.GetOrderByReservationIdAsync(ReservationId))
                .ReturnsAsync(order);
        }
    }

    private static Reservation CreateReservation(string customerId) => new()
    {
        Id = ReservationId,
        TableId = "table-1",
        CustomerId = customerId,
        WaiterId = "waiter-1"
    };

    private static GroupReservation CreateGroupReservation() => new()
    {
        GroupReservationId = GroupReservationId,
        ReservationId = ReservationId,
        ReservationToken = "reservation-token",
        Status = GroupReservationStatus.Open
    };

    private static GuestSession CreateSession(
        string id,
        bool isOwner,
        string? ownerUserId,
        bool isSubmitted = false,
        params OrderItem[] dishes) => new()
    {
        Id = id,
        GroupReservationId = GroupReservationId,
        GuestName = id,
        Dishes = [.. dishes],
        IsOwnerSession = isOwner,
        OwnerUserId = ownerUserId,
        IsSubmitted = isSubmitted
    };

    private static Order CreateOrder() => new()
    {
        OrderId = "order-1",
        CustomerId = OwnerId,
        ReservationId = ReservationId,
        ReservationAddress = "Restaurant",
        ReservationTime = "Today",
        Dishes =
        [
            new OrderItem { DishId = "old-dish", Quantity = 20, State = OrderItemState.Confirmed }
        ],
        Status = OrderStatus.Created
    };
}
