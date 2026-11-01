import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Reservation, ReservationStatus } from '@app/models/reservations/reservation.model';
import { FeedbackReservationResponseItem } from '@app/models/feedbacks/feedback-reservation-response-item.model';
import { Order } from '@app/models/orders/order.model';
import { AuthenticationService } from '@app/auth/services/authentication.service';
import { CardReservationComponent } from '@app/components/reservations/card-reservation/card-reservation.component';
import { LocationsService } from '@app/services/locations/locations.service';
import { PreOrdersService } from '@app/services/pre-orders/pre-orders.service';
import { ReservationService } from '@app/services/reservation/reservation.service';
import { TableService } from '@app/services/table/table.service';
import { Roles } from '@app/shared/constants/roles';
import { Subject } from 'rxjs';
import { ReservationDashboardComponent } from './reservation-dashboard.component';

const RESERVATIONS: Reservation[] = [
  {
    id: 'reservation-1',
    tableId: 'table-1',
    customerId: 'customer-1',
    startTime: new Date('2026-11-02T18:00:00Z'),
    endTime: new Date('2026-11-02T19:00:00Z'),
    guestCount: 2,
    status: ReservationStatus.Reserved,
    locationAddress: '10 Main Street',
    tableCapacity: 2,
    waiterId: 'waiter-1',
  },
  {
    id: 'reservation-2',
    tableId: 'table-2',
    customerId: 'customer-1',
    startTime: new Date('2026-11-03T18:00:00Z'),
    endTime: new Date('2026-11-03T19:00:00Z'),
    guestCount: 3,
    status: ReservationStatus.Reserved,
    locationAddress: '20 Main Street',
    tableCapacity: 4,
    waiterId: 'waiter-1',
  },
];

@Component({
  selector: 'app-reservation-dashboard-test-host',
  standalone: true,
  imports: [ReservationDashboardComponent],
  template: '<app-reservation-dashboard />',
})
class ReservationDashboardTestHostComponent {}

describe('ReservationDashboardComponent reservation loading', () => {
  let fixture: ComponentFixture<ReservationDashboardTestHostComponent>;
  let primaryReservations: Subject<Reservation[]>;
  let orders: Subject<Order[]>;
  let feedbackByReservation: Map<
    string,
    Subject<FeedbackReservationResponseItem | null>
  >;
  let reservationService: jasmine.SpyObj<ReservationService>;
  let preOrdersService: jasmine.SpyObj<PreOrdersService>;

  beforeEach(async () => {
    primaryReservations = new Subject<Reservation[]>();
    orders = new Subject<Order[]>();
    feedbackByReservation = new Map(
      RESERVATIONS.map((reservation) => [
        reservation.id,
        new Subject<FeedbackReservationResponseItem | null>(),
      ]),
    );

    reservationService = jasmine.createSpyObj<ReservationService>(
      'ReservationService',
      ['getReservationsForUser$', 'getReservationFeedback'],
    );
    reservationService.getReservationsForUser$.and.returnValue(primaryReservations);
    reservationService.getReservationFeedback.and.callFake(
      (reservationId: string) => feedbackByReservation.get(reservationId)!,
    );
    preOrdersService = jasmine.createSpyObj<PreOrdersService>(
      'PreOrdersService',
      ['getPreOrders'],
    );
    preOrdersService.getPreOrders.and.returnValue(orders);

    const authenticationService = jasmine.createSpyObj<AuthenticationService>(
      'AuthenticationService',
      ['getToken', 'getUser'],
    );
    authenticationService.getToken.and.returnValue('test-token');
    authenticationService.getUser.and.returnValue({
      id: 'customer-1',
      firstName: 'Test',
      lastName: 'Customer',
      email: 'test@example.com',
      role: Roles.CUSTOMER,
    });

    await TestBed.configureTestingModule({
      imports: [ReservationDashboardTestHostComponent],
      providers: [
        { provide: AuthenticationService, useValue: authenticationService },
        { provide: ReservationService, useValue: reservationService },
        { provide: PreOrdersService, useValue: preOrdersService },
        { provide: LocationsService, useValue: {} },
        { provide: TableService, useValue: {} },
      ],
    })
      .overrideComponent(ReservationDashboardComponent, {
        set: {
          imports: [CardReservationComponent],
          template: `
            @if (!reservationsLoaded()) {
              <p class="loading">Please wait while we load your reservations.</p>
            } @else if (reservations().length > 0) {
              @for (reservation of reservations(); track reservation.id) {
                <app-card-reservation [r]="reservation" [role]="role()" />
              }
            }
          `,
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ReservationDashboardTestHostComponent);
    fixture.detectChanges();
  });

  it('renders the reservation cards without waiting for parallel secondary requests', () => {
    const dashboard = fixture.debugElement.children[0].componentInstance as ReservationDashboardComponent;
    expect(fixture.nativeElement.querySelector('.loading')).not.toBeNull();
    expect(dashboard.reservationsLoaded()).toBeFalse();

    primaryReservations.next(RESERVATIONS);
    fixture.detectChanges();

    expect(dashboard.reservationsLoaded()).toBeTrue();
    expect(fixture.nativeElement.querySelector('.loading')).toBeNull();
    expect(fixture.nativeElement.querySelectorAll('app-card-reservation').length).toBe(2);
    expect(preOrdersService.getPreOrders).toHaveBeenCalledTimes(1);
    expect(reservationService.getReservationFeedback).toHaveBeenCalledTimes(2);
    expect(reservationService.getReservationFeedback).toHaveBeenCalledWith('reservation-1');
    expect(reservationService.getReservationFeedback).toHaveBeenCalledWith('reservation-2');

    // Keep every enrichment request pending: cards remain displayed while the APIs respond.
    expect(fixture.nativeElement.querySelectorAll('app-card-reservation').length).toBe(2);

    orders.next([]);
    orders.complete();
    for (const feedback of feedbackByReservation.values()) {
      feedback.next(null);
      feedback.complete();
    }
    fixture.detectChanges();
    expect(dashboard.reservations().length).toBe(2);
  });
});
