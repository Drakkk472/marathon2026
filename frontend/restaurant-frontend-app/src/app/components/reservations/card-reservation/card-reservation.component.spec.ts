import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { CardReservationComponent } from './card-reservation.component';
import { API_BASE_URL } from '@app/shared/config/api-base-url.token';
import { ReservationCustomer, ReservationStatusCustomer } from '@app/models/reservations/reservation.model';
import { Roles } from '@app/shared/constants/roles';

const RESERVATION: ReservationCustomer = {
  id: 'res-1',
  tableId: 'table-1',
  startTime: new Date('2026-10-21T16:00:00Z'),
  endTime: new Date('2026-10-21T17:30:00Z'),
  guestCount: 2,
  status: ReservationStatusCustomer.Reserved,
  restaurantName: 'Green & Tasty',
  locationAddress: 'Rustaveli Avenue 48',
  waiterId: 'waiter-1',
};

describe('CardReservationComponent', () => {
  let component: CardReservationComponent;
  let fixture: ComponentFixture<CardReservationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [{ provide: API_BASE_URL, useValue: 'https://test.api' }, provideRouter([])],
      imports: [CardReservationComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CardReservationComponent);
    component = fixture.componentInstance;
    // r — обов'язковий input: без нього компонент падає з NG0950
    fixture.componentRef.setInput('r', RESERVATION);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders a View Reservation button for customer reservations', () => {
    const button = (
      fixture.nativeElement as HTMLElement
    ).querySelector<HTMLButtonElement>('.view-reservation-button');

    expect(button?.textContent.trim()).toBe('View Reservation');
  });

  it('opens the selected reservation group pre-order review from View Reservation', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = spyOn(router, 'navigate');
    fixture.componentRef.setInput('r', { ...RESERVATION, id: 'reservation-42' });
    fixture.detectChanges();
    const button = (
      fixture.nativeElement as HTMLElement
    ).querySelector<HTMLButtonElement>('.view-reservation-button');

    button?.click();

    expect(navigateSpy).toHaveBeenCalledWith([
      '/reservations',
      'reservation-42',
      'group-order',
    ]);
  });

  it('does not offer Owner-only group review to waiters', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = spyOn(router, 'navigate');
    fixture.componentRef.setInput('role', Roles.WAITER);
    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector('.view-reservation-button')
    ).toBeNull();
    component.onViewReservation();
    expect(navigateSpy).not.toHaveBeenCalled();
  });
});
