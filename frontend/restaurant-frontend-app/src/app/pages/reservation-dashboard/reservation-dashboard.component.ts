import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
<<<<<<< HEAD
import {
  catchError,
  finalize,
  forkJoin,
  map,
  of,
  switchMap,
} from 'rxjs';
=======
import { catchError, finalize, forkJoin, map, of, switchMap } from 'rxjs';
>>>>>>> bc0f637 (first commit)

import { AuthenticationService } from '@app/auth/services/authentication.service';
import { CardReservationComponent } from '@app/components/reservations/card-reservation/card-reservation.component';
import { FeedbackWindowComponent } from '@app/components/reservations/feedback-window/feedback-window.component';
import { ReservationConfirmedComponent } from '@app/components/reservations/reservation-confirmed/reservation-confirmed.component';
import { MakeReservationComponent } from '@app/components/tables/make-reservation/make-reservation.component';
import { FeedbackUpdatedEvent } from '@app/models/feedbacks/feedback.model';
import {
  Reservation,
  ReservationCustomer,
  ReservationStatus,
  ReservationStatusCustomer,
} from '@app/models/reservations/reservation.model';
import { Table } from '@app/models/tables/table.model';
<<<<<<< HEAD
=======
import { OrderStatus } from '@app/models/orders/order.model';
>>>>>>> bc0f637 (first commit)
import { TimeRange } from '@app/models/tables/time-range.model';
import { LocationsService } from '@app/services/locations/locations.service';
import { PreOrdersService } from '@app/services/pre-orders/pre-orders.service';
import { ReservationService } from '@app/services/reservation/reservation.service';
import { TableService } from '@app/services/table/table.service';
import { Roles } from '@app/shared/constants/roles';
import { HeaderComponent } from '@app/shared/custom-components/header/header.component';
<<<<<<< HEAD
import {
  formatTime,
  revertFormatDate,
} from '@app/shared/helpers/date-helpers';
=======
import { formatTime, revertFormatDate } from '@app/shared/helpers/date-helpers';
>>>>>>> bc0f637 (first commit)

interface ReservationStatusView {
  class: string;
  label: string;
}

@Component({
  selector: 'app-reservation-dashboard',
  standalone: true,
  imports: [
    HeaderComponent,
    RouterLink,
    CardReservationComponent,
    MakeReservationComponent,
    ReservationConfirmedComponent,
    FeedbackWindowComponent,
  ],
  templateUrl: './reservation-dashboard.component.html',
  styleUrl: './reservation-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReservationDashboardComponent implements OnInit {
<<<<<<< HEAD
  private readonly authenticationService =
    inject(AuthenticationService);

  private readonly reservationService =
    inject(ReservationService);
=======
  private readonly authenticationService = inject(AuthenticationService);

  private readonly reservationService = inject(ReservationService);
>>>>>>> bc0f637 (first commit)

  private readonly tableService = inject(TableService);
  private readonly locationsService = inject(LocationsService);
  private readonly ordersService = inject(PreOrdersService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly Roles = Roles;

  readonly firstName = signal('');
  readonly lastName = signal('');
  readonly role = signal<string>(Roles.CUSTOMER);
  readonly customerId = signal('');

  readonly reservations = signal<ReservationCustomer[]>([]);
  readonly reservationsLoaded = signal(false);

<<<<<<< HEAD
  readonly selectedReservation =
    signal<ReservationCustomer | null>(null);
=======
  readonly selectedReservation = signal<ReservationCustomer | null>(null);
>>>>>>> bc0f637 (first commit)

  readonly selectedTable = signal<Table | null>(null);
  readonly selectedTimeRange = signal<TimeRange | null>(null);

  readonly showEditReservationModal = signal(false);
  readonly showEditReservationConfirmed = signal(false);
  readonly showFeedbackModal = signal(false);

  readonly statusEnum: Record<number, ReservationStatusView> = {
    [ReservationStatusCustomer.Reserved]: {
      class: 'reserved',
      label: 'Reserved',
    },
    [ReservationStatusCustomer.Cancelled]: {
      class: 'canceled',
      label: 'Cancelled',
    },
    [ReservationStatusCustomer.InProgress]: {
      class: 'in-progress',
      label: 'In Progress',
    },
    [ReservationStatusCustomer.Finished]: {
      class: 'finished',
      label: 'Finished',
    },
  };

<<<<<<< HEAD
  readonly selectedReservationAsReservation =
    computed<Reservation | null>(() => {
      const reservation = this.selectedReservation();

      if (!reservation) {
        return null;
      }

      return {
        id: reservation.id,
        tableId: reservation.tableId,
        startTime: reservation.startTime,
        endTime: reservation.endTime,
        guestCount: reservation.guestCount,
        status:
          reservation.status as unknown as ReservationStatus,
        waiterId: reservation.waiterId ?? '',
        customerId:
          reservation.customerId ?? this.customerId(),
        locationAddress: reservation.locationAddress,
        restaurantName: reservation.restaurantName,
        tableCapacity:
          this.selectedTable()?.capacity ??
          reservation.guestCount,
        hasSubmittedPreOrder:
        reservation.hasSubmittedPreOrder,
        preOrder: reservation.preOrder,
        preOrders: reservation.preOrders,
      };
    });
=======
  readonly selectedReservationAsReservation = computed<Reservation | null>(() => {
    const reservation = this.selectedReservation();

    if (!reservation) {
      return null;
    }

    return {
      id: reservation.id,
      tableId: reservation.tableId,
      startTime: reservation.startTime,
      endTime: reservation.endTime,
      guestCount: reservation.guestCount,
      status: reservation.status as unknown as ReservationStatus,
      waiterId: reservation.waiterId ?? '',
      customerId: reservation.customerId ?? this.customerId(),
      locationAddress: reservation.locationAddress,
      restaurantName: reservation.restaurantName,
      tableCapacity: this.selectedTable()?.capacity ?? reservation.guestCount,
      hasSubmittedPreOrder: reservation.hasSubmittedPreOrder,
      preOrder: reservation.preOrder,
      preOrders: reservation.preOrders,
    };
  });
>>>>>>> bc0f637 (first commit)

  ngOnInit(): void {
    const token = this.authenticationService.getToken();
    const user = this.authenticationService.getUser();

    if (!token || !user) {
      this.reservationsLoaded.set(true);
      void this.router.navigate(['/login']);
      return;
    }

    if (user.role === Roles.WAITER) {
      void this.router.navigate(['/waiter-reservations']);
      return;
    }

    if (user.role !== Roles.CUSTOMER) {
      void this.router.navigate(['/main']);
      return;
    }

    this.firstName.set(user.firstName ?? '');
    this.lastName.set(user.lastName ?? '');
    this.role.set(user.role);
    this.customerId.set(user.id);

    this.loadReservations();
  }

  cancelReservation(id: string): void {
    this.reservationService
      .cancelReservation$(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.error) {
<<<<<<< HEAD
            console.error(
              'Failed to cancel reservation:',
              response.error,
            );
=======
            console.error('Failed to cancel reservation:', response.error);
>>>>>>> bc0f637 (first commit)
            return;
          }

          this.reservations.update((reservations) =>
            reservations.map((reservation) =>
              reservation.id === id
                ? {
<<<<<<< HEAD
                  ...reservation,
                  status:
                  ReservationStatusCustomer.Cancelled,
                }
                : reservation,
            ),
=======
                    ...reservation,
                    status: ReservationStatusCustomer.Cancelled,
                  }
                : reservation
            )
>>>>>>> bc0f637 (first commit)
          );

          const selected = this.selectedReservation();

          if (selected?.id === id) {
            this.selectedReservation.set({
              ...selected,
              status: ReservationStatusCustomer.Cancelled,
            });
          }
        },
        error: (error) => {
<<<<<<< HEAD
          console.error(
            'Failed to cancel reservation:',
            error,
          );
=======
          console.error('Failed to cancel reservation:', error);
>>>>>>> bc0f637 (first commit)
        },
      });
  }

  openEditModal(reservation: ReservationCustomer): void {
    this.selectedReservation.set(reservation);

    const startTime = new Date(reservation.startTime);
    const date = revertFormatDate(startTime.toISOString());
    const time = formatTime(startTime.toISOString());

    this.locationsService
      .getLocations()
      .pipe(
        map((locations) =>
          locations.find(
            (location) =>
              location.address.trim().toLowerCase() ===
<<<<<<< HEAD
              reservation.locationAddress
                .trim()
                .toLowerCase(),
          ),
        ),
        switchMap((location) => {
          if (!location) {
            console.error(
              'Location not found:',
              reservation.locationAddress,
            );
=======
              reservation.locationAddress.trim().toLowerCase()
          )
        ),
        switchMap((location) => {
          if (!location) {
            console.error('Location not found:', reservation.locationAddress);
>>>>>>> bc0f637 (first commit)

            return of(null);
          }

          return forkJoin({
<<<<<<< HEAD
            timeRanges: this.tableService.getTableTimeSlots(
              reservation.tableId,
              date,
              time,
            ),
            tables:
              this.tableService.getAvailableTablesWithoutStartTime$(
                {
                  location: location.id,
                  date: null,
                  time: null,
                  guests: reservation.guestCount,
                },
              ),
=======
            timeRanges: this.tableService.getTableTimeSlots(reservation.tableId, date, time),
            tables: this.tableService.getAvailableTablesWithoutStartTime$({
              location: location.id,
              date: null,
              time: null,
              guests: reservation.guestCount,
            }),
>>>>>>> bc0f637 (first commit)
          }).pipe(
            map(({ timeRanges, tables }) => ({
              locationId: location.id,
              timeRanges,
              tables,
<<<<<<< HEAD
            })),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
=======
            }))
          );
        }),
        takeUntilDestroyed(this.destroyRef)
>>>>>>> bc0f637 (first commit)
      )
      .subscribe({
        next: (result) => {
          if (!result) {
            return;
          }

<<<<<<< HEAD
          const matchingTable = result.tables.find(
            (table) => table.id === reservation.tableId,
          );
=======
          const matchingTable = result.tables.find((table) => table.id === reservation.tableId);
>>>>>>> bc0f637 (first commit)

          this.selectedTable.set({
            id: reservation.tableId,
            tableNumber:
<<<<<<< HEAD
              matchingTable?.tableNumber ??
              this.extractTableNumber(
                reservation.tableName,
              ),
            capacity:
              matchingTable?.capacity ??
              reservation.guestCount,
            locationId:
              matchingTable?.locationId ??
              result.locationId,
=======
              matchingTable?.tableNumber ?? this.extractTableNumber(reservation.tableName),
            capacity: matchingTable?.capacity ?? reservation.guestCount,
            locationId: matchingTable?.locationId ?? result.locationId,
>>>>>>> bc0f637 (first commit)
            timeRanges: result.timeRanges ?? [],
          });

          this.selectedTimeRange.set({
<<<<<<< HEAD
            start: new Date(
              reservation.startTime,
            ).toISOString(),
=======
            start: new Date(reservation.startTime).toISOString(),
>>>>>>> bc0f637 (first commit)
            end: new Date(reservation.endTime).toISOString(),
          });

          this.showEditReservationModal.set(true);
        },
        error: (error) => {
<<<<<<< HEAD
          console.error(
            'Failed to load reservation editing data:',
            error,
          );
=======
          console.error('Failed to load reservation editing data:', error);
>>>>>>> bc0f637 (first commit)
        },
      });
  }

  closeEditReservationModal(): void {
    this.showEditReservationModal.set(false);
  }

<<<<<<< HEAD
  onSubmitEditReservation(
    timeRange: TimeRange,
    guests: number,
  ): void {
=======
  onSubmitEditReservation(timeRange: TimeRange, guests: number): void {
>>>>>>> bc0f637 (first commit)
    const currentReservation = this.selectedReservation();

    if (!currentReservation) {
      return;
    }

    this.reservationService
<<<<<<< HEAD
      .editReservation$(
        currentReservation.id,
        timeRange,
        guests,
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updatedReservation) => {
          const updatedCustomerReservation: ReservationCustomer =
            {
              ...currentReservation,
              ...updatedReservation,
              status:
                updatedReservation.status as unknown as ReservationStatusCustomer,
              restaurantName:
                updatedReservation.restaurantName ??
                currentReservation.restaurantName ??
                '',
              feedback: currentReservation.feedback,
              preOrder: currentReservation.preOrder,
              preOrders: currentReservation.preOrders,
              createdByName:
              currentReservation.createdByName,
              createdByRole:
              currentReservation.createdByRole,
            };

          this.reservations.update((reservations) =>
            reservations.map((reservation) =>
              reservation.id ===
              updatedCustomerReservation.id
                ? updatedCustomerReservation
                : reservation,
            ),
          );

          this.selectedReservation.set(
            updatedCustomerReservation,
          );

          this.selectedTimeRange.set({
            start: new Date(
              updatedCustomerReservation.startTime,
            ).toISOString(),
            end: new Date(
              updatedCustomerReservation.endTime,
            ).toISOString(),
=======
      .editReservation$(currentReservation.id, timeRange, guests)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updatedReservation) => {
          const updatedCustomerReservation: ReservationCustomer = {
            ...currentReservation,
            ...updatedReservation,
            status: updatedReservation.status as unknown as ReservationStatusCustomer,
            restaurantName:
              updatedReservation.restaurantName ?? currentReservation.restaurantName ?? '',
            feedback: currentReservation.feedback,
            preOrder: currentReservation.preOrder,
            preOrders: currentReservation.preOrders,
            createdByName: currentReservation.createdByName,
            createdByRole: currentReservation.createdByRole,
          };

          this.reservations.update((reservations) =>
            reservations.map((reservation) =>
              reservation.id === updatedCustomerReservation.id
                ? updatedCustomerReservation
                : reservation
            )
          );

          this.selectedReservation.set(updatedCustomerReservation);

          this.selectedTimeRange.set({
            start: new Date(updatedCustomerReservation.startTime).toISOString(),
            end: new Date(updatedCustomerReservation.endTime).toISOString(),
>>>>>>> bc0f637 (first commit)
          });

          this.showEditReservationModal.set(false);
          this.showEditReservationConfirmed.set(true);
        },
        error: (error) => {
<<<<<<< HEAD
          console.error(
            'Failed to update reservation:',
            error,
          );
=======
          console.error('Failed to update reservation:', error);
>>>>>>> bc0f637 (first commit)
        },
      });
  }

  closeReservationConfirmed(): void {
    this.showEditReservationConfirmed.set(false);
  }

  editConfirmedReservation(): void {
    const reservation = this.selectedReservation();

    if (!reservation) {
      return;
    }

    this.showEditReservationConfirmed.set(false);
    this.openEditModal(reservation);
  }

  cancelConfirmedReservation(): void {
    const reservation = this.selectedReservation();

    if (!reservation) {
      return;
    }

    this.cancelReservation(reservation.id);
    this.showEditReservationConfirmed.set(false);
  }

  openFeedback(reservation: ReservationCustomer): void {
    this.selectedReservation.set(reservation);
    this.showFeedbackModal.set(true);
  }

  closeFeedback(): void {
    this.showFeedbackModal.set(false);
  }

  onFeedbackUpdated(event: FeedbackUpdatedEvent): void {
    this.reservationService
      .getReservationFeedback(event.reservationId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (feedback) => {
          this.reservations.update((reservations) =>
            reservations.map((reservation) =>
              reservation.id === event.reservationId
                ? {
<<<<<<< HEAD
                  ...reservation,
                  feedback: feedback ?? undefined,
                }
                : reservation,
            ),
=======
                    ...reservation,
                    feedback: feedback ?? undefined,
                  }
                : reservation
            )
>>>>>>> bc0f637 (first commit)
          );

          const selected = this.selectedReservation();

          if (selected?.id === event.reservationId) {
            this.selectedReservation.set({
              ...selected,
              feedback: feedback ?? undefined,
            });
          }
        },
        error: (error) => {
<<<<<<< HEAD
          console.error(
            'Failed to refresh reservation feedback:',
            error,
          );
=======
          console.error('Failed to refresh reservation feedback:', error);
>>>>>>> bc0f637 (first commit)
        },
      });
  }

  private loadReservations(): void {
    this.reservationsLoaded.set(false);

    forkJoin({
<<<<<<< HEAD
      reservations:
        this.reservationService.getReservationsForUser$(),
=======
      reservations: this.reservationService.getReservationsForUser$(),
>>>>>>> bc0f637 (first commit)
      orders: this.ordersService.getPreOrders().pipe(
        catchError((error) => {
          console.error('Failed to load pre-orders:', error);
          return of([]);
<<<<<<< HEAD
        }),
=======
        })
>>>>>>> bc0f637 (first commit)
      ),
    })
      .pipe(
        switchMap(({ reservations, orders }) => {
          if (reservations.length === 0) {
            return of<ReservationCustomer[]>([]);
          }

          return forkJoin(
            reservations.map((reservation) =>
<<<<<<< HEAD
              this.reservationService
                .getReservationFeedback(reservation.id)
                .pipe(
                  catchError((error: HttpErrorResponse) => {
                    if (error.status !== 404) {
                      console.error(
                        `Failed to load feedback for reservation ${reservation.id}:`,
                        error,
                      );
                    }

                    return of(null);
                  }),
                  map(
                    (
                      feedback,
                    ): ReservationCustomer => {
                      const preOrder = orders.find(
                        (order) =>
                          order.reservationId ===
                          reservation.id,
                      );

                      const hasFeedback =
                        feedback?.service != null ||
                        feedback?.cuisineExperience != null;

                      return {
                        ...reservation,
                        status:
                          reservation.status as unknown as ReservationStatusCustomer,
                        restaurantName:
                          reservation.restaurantName ?? '',
                        feedback: hasFeedback
                          ? feedback ?? undefined
                          : undefined,
                        preOrder,
                        hasSubmittedPreOrder:
                          preOrder != null &&
                          (preOrder.status === 1 ||
                            preOrder.status === 3),
                      };
                    },
                  ),
                ),
            ),
=======
              this.reservationService.getReservationFeedback(reservation.id).pipe(
                catchError((error: HttpErrorResponse) => {
                  if (error.status !== 404) {
                    console.error(
                      `Failed to load feedback for reservation ${reservation.id}:`,
                      error
                    );
                  }

                  return of(null);
                }),
                map((feedback): ReservationCustomer => {
                  const preOrder = orders.find((order) => order.reservationId === reservation.id);

                  const hasFeedback =
                    feedback?.service != null || feedback?.cuisineExperience != null;

                  return {
                    ...reservation,
                    status: reservation.status as unknown as ReservationStatusCustomer,
                    restaurantName: reservation.restaurantName ?? '',
                    feedback: hasFeedback ? (feedback ?? undefined) : undefined,
                    preOrder,
                    hasSubmittedPreOrder: preOrder?.status === OrderStatus.SubmittedByCustomer,
                  };
                })
              )
            )
>>>>>>> bc0f637 (first commit)
          );
        }),
        finalize(() => {
          this.reservationsLoaded.set(true);
        }),
<<<<<<< HEAD
        takeUntilDestroyed(this.destroyRef),
=======
        takeUntilDestroyed(this.destroyRef)
>>>>>>> bc0f637 (first commit)
      )
      .subscribe({
        next: (reservations) => {
          this.reservations.set(reservations);
        },
        error: (error) => {
<<<<<<< HEAD
          console.error(
            'Failed to load reservations:',
            error,
          );
=======
          console.error('Failed to load reservations:', error);
>>>>>>> bc0f637 (first commit)
          this.reservations.set([]);
        },
      });
  }

<<<<<<< HEAD
  private extractTableNumber(
    tableName: string | undefined,
  ): number {
=======
  private extractTableNumber(tableName: string | undefined): number {
>>>>>>> bc0f637 (first commit)
    const match = tableName?.match(/\d+/);
    return match ? Number(match[0]) : 0;
  }
}
