import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { CardReservationComponent } from './card-reservation.component';
import { API_BASE_URL } from '@app/shared/config/api-base-url.token';
<<<<<<< HEAD
import { ReservationCustomer, ReservationStatusCustomer } from '@app/models/reservations/reservation.model';
=======
import {
  ReservationCustomer,
  ReservationStatusCustomer,
} from '@app/models/reservations/reservation.model';
>>>>>>> bc0f637 (first commit)
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
<<<<<<< HEAD
=======
    fixture.componentRef.setInput('statusEnum', {
      [ReservationStatusCustomer.Reserved]: { class: 'reserved', label: 'Reserved' },
    });
>>>>>>> bc0f637 (first commit)
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders a View Reservation button for customer reservations', () => {
<<<<<<< HEAD
    const button = (
      fixture.nativeElement as HTMLElement
    ).querySelector<HTMLButtonElement>('.view-reservation-button');
=======
    const button = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '.view-reservation-button'
    );
>>>>>>> bc0f637 (first commit)

    expect(button?.textContent.trim()).toBe('View Reservation');
  });

<<<<<<< HEAD
=======
  it('shows Submitted instead of Reserved in green when the group pre-order was submitted', () => {
    fixture.componentRef.setInput('r', {
      ...RESERVATION,
      hasSubmittedPreOrder: true,
    });
    fixture.detectChanges();

    const status = (fixture.nativeElement as HTMLElement).querySelector('.status-badge');
    expect(status?.textContent?.trim()).toBe('Submitted');
    expect(status?.classList).toContain('submitted');
    expect(status?.classList).not.toContain('reserved');
  });

  it('keeps the normal reservation status when no group pre-order was submitted', () => {
    fixture.componentRef.setInput('r', {
      ...RESERVATION,
      hasSubmittedPreOrder: false,
    });
    fixture.detectChanges();
    const status = (fixture.nativeElement as HTMLElement).querySelector('.status-badge');
    expect(status?.textContent?.trim()).toBe('Reserved');
    expect(status?.classList).toContain('reserved');
  });

  it('does not render customer status badge for waiters', () => {
    fixture.componentRef.setInput('role', Roles.WAITER);
    fixture.componentRef.setInput('r', {
      ...RESERVATION,
      hasSubmittedPreOrder: true,
    });
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('.status-badge')).toBeNull();
  });

>>>>>>> bc0f637 (first commit)
  it('opens the selected reservation group pre-order review from View Reservation', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = spyOn(router, 'navigate');
    fixture.componentRef.setInput('r', { ...RESERVATION, id: 'reservation-42' });
    fixture.detectChanges();
<<<<<<< HEAD
    const button = (
      fixture.nativeElement as HTMLElement
    ).querySelector<HTMLButtonElement>('.view-reservation-button');

    button?.click();

    expect(navigateSpy).toHaveBeenCalledWith([
      '/reservations',
      'reservation-42',
      'group-order',
    ]);
=======
    const button = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '.view-reservation-button'
    );

    button?.click();

    expect(navigateSpy).toHaveBeenCalledWith(['/reservations', 'reservation-42', 'group-order']);
>>>>>>> bc0f637 (first commit)
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
