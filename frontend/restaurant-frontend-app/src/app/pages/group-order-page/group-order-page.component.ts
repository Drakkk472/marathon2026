import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  catchError,
  EMPTY,
  exhaustMap,
  forkJoin,
  interval,
  map,
  merge,
  of,
  Subject,
  Subscription,
  switchMap,
  throwError,
} from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ParticipantCardComponent } from '@app/components/group-orders/participant-card/participant-card.component';
import { GroupOrdersService } from '@app/services/group-orders/group-orders.service';
import { ToastService } from '@app/services/toast/toast.service';
import { ModalComponent } from '@app/shared/custom-components/modal/modal.component';
import { GroupStatusResponse } from '@app/models/group-orders/group-status.model';
import { GuestInvite } from '@app/models/reservations/guest-invite.model';
import { Participant } from '@app/models/group-orders/participant.model';
import { Order } from '@app/models/orders/order.model';
import { consolidatePreOrder } from '@app/shared/helpers/consolidate-pre-order';
import { PreOrdersService } from '@app/services/pre-orders/pre-orders.service';

const SYNC_INTERVAL_MS = 15_000;

@Component({
  selector: 'app-group-order-page',
  imports: [CurrencyPipe, DatePipe, ParticipantCardComponent, ModalComponent],
  templateUrl: './group-order-page.component.html',
  styleUrl: './group-order-page.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class GroupOrderPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly groupOrdersService = inject(GroupOrdersService);
  private readonly preOrdersService = inject(PreOrdersService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly refreshRequests = new Subject<void>();
  private syncSubscription: Subscription | null = null;

  readonly invite = signal<GuestInvite | null>(null);
  readonly participants = signal<Participant[]>([]);
  readonly guestSessionId = signal('');
  private readonly ownerOrder = signal<Order | null>(null);
  readonly groupStatus = signal<GroupStatusResponse | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal('');
  readonly accessDenied = signal(false);
  readonly isSubmitting = signal(false);
  readonly isConfirmationOpen = signal(false);
<<<<<<< HEAD
=======
  readonly selectedGuest = signal<Participant | null>(null);
  readonly isRemovingGuest = signal(false);
  readonly removeGuestError = signal('');
>>>>>>> bc0f637 (first commit)
  readonly updatedAt = signal<Date | null>(null);
  readonly refreshError = signal(false);
  readonly consolidatedOrder = computed(() => consolidatePreOrder(this.participants()));
  readonly pendingParticipants = computed(
    () => this.participants().filter((person) => !person.isSubmitted).length
  );
  readonly hasAnyDishes = computed(() =>
    this.participants().some((person) => person.items.length > 0)
  );
  readonly statusLabel = computed(() => {
    const status = this.groupStatus()?.status;
    if (status === 'Submitted') {
      return 'Sent to Restaurant';
    }
    return status === 'Closed' ? 'Closed' : 'Collecting pre-orders';
  });
  readonly canSubmit = computed(
    () =>
      this.groupStatus()?.status === 'Open' &&
      this.consolidatedOrder().items.length > 0 &&
      !this.isSubmitting()
  );

  constructor() {
    this.destroyRef.onDestroy(() => this.stopSync());
    this.loadGroupOrder();
  }

  loadGroupOrder(): void {
    this.stopSync();
    const reservationId = this.route.snapshot.paramMap.get('reservationId');
    if (!reservationId) {
      this.loadError.set('Group reservation not found');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.loadError.set('');
    this.accessDenied.set(false);
    this.invite.set(null);
    this.ownerOrder.set(null);

    this.groupOrdersService
      .getGroupInvite$(reservationId)
      .pipe(
        switchMap((invite) =>
          forkJoin({
            sessions: this.groupOrdersService.getSessions$(invite.GroupReservationId),
            guestSessionId: this.groupOrdersService.getOwnerSessionId$(reservationId),
            status: this.groupOrdersService.getStatus$(invite.GroupReservationId),
            ownerOrder: this.preOrdersService
              .getByReservationId(reservationId, { silent: true })
              .pipe(
                catchError((error: unknown) => {
                  if (error instanceof HttpErrorResponse && error.status === 404) {
                    return of(null);
                  }
                  return throwError(() => error);
                })
              ),
          }).pipe(map((data) => ({ invite, ...data })))
        )
      )
      .subscribe({
        next: ({ invite, sessions, guestSessionId, status, ownerOrder }) => {
          this.invite.set(invite);
          this.ownerOrder.set(ownerOrder);
          this.participants.set(
            this.withOwnerPreOrder(sessions.participants, guestSessionId, ownerOrder)
          );
          this.guestSessionId.set(guestSessionId);
          this.groupStatus.set(status);
          this.updatedAt.set(new Date());
          this.refreshError.set(false);
          this.loading.set(false);
          if (status.status === 'Open') {
            this.startSync(invite.GroupReservationId);
          }
        },
        error: (error: unknown) => this.handleLoadError(error),
      });
  }

  private withOwnerPreOrder(
    participants: Participant[],
    ownerSessionId: string,
    ownerOrder: Order | null
  ): Participant[] {
    const ownerItems = ownerOrder?.orderItems ?? [];
    if (ownerItems.length === 0) {
      return participants;
    }

    return participants.map((participant) => {
      if (participant.type !== 'Owner' || participant.id !== ownerSessionId) {
        return participant;
      }

      const items = ownerItems.map(({ dish, quantity }) => ({
        dish: {
          id: dish.id,
          name: dish.name,
          price: dish.price,
          imageUrl: dish.imageUrl,
          weight: dish.weight,
        },
        quantity,
      }));

      // The owner's pre-order is persisted through GET /orders/{reservationId};
      // owner guest-session records do not contain those dishes.
      return {
        ...participant,
        items,
        total: items.reduce((total, item) => total + item.dish.price * item.quantity, 0),
        isSubmitted: true,
      };
    });
  }

  openConfirmation(): void {
    if (this.canSubmit()) {
      this.isConfirmationOpen.set(true);
    }
  }

  closeConfirmation(): void {
    if (!this.isSubmitting()) {
      this.isConfirmationOpen.set(false);
    }
  }

<<<<<<< HEAD
=======
  openRemoveGuest(participant: Participant): void {
    if (participant.type !== 'Guest' || this.groupStatus()?.status !== 'Open') {
      return;
    }

    this.removeGuestError.set('');
    this.selectedGuest.set(participant);
  }

  closeRemoveGuest(): void {
    if (!this.isRemovingGuest()) {
      this.selectedGuest.set(null);
      this.removeGuestError.set('');
    }
  }

  removeGuest(): void {
    const guest = this.selectedGuest();
    const invite = this.invite();
    if (
      !guest ||
      guest.type !== 'Guest' ||
      !invite ||
      this.groupStatus()?.status !== 'Open' ||
      this.isRemovingGuest()
    ) {
      return;
    }

    this.isRemovingGuest.set(true);
    this.removeGuestError.set('');
    this.groupOrdersService.removeSession$(invite.GroupReservationId, guest.id).subscribe({
      next: () => {
        const participants = this.participants().filter(
          (participant) => participant.id !== guest.id
        );
        this.participants.set(participants);
        const status = this.groupStatus();
        if (status) {
          this.groupStatus.set({ ...status, currentParticipants: participants.length });
        }
        this.updatedAt.set(new Date());
        this.refreshError.set(false);
        this.isRemovingGuest.set(false);
        this.selectedGuest.set(null);
      },
      error: () => {
        this.isRemovingGuest.set(false);
        this.removeGuestError.set("Couldn't remove guest. Please try again.");
      },
    });
  }

>>>>>>> bc0f637 (first commit)
  submitPreOrder(): void {
    const invite = this.invite();
    const reservationId = this.route.snapshot.paramMap.get('reservationId');
    if (!invite || !reservationId || !this.canSubmit()) {
      return;
    }

    this.stopSync();
    this.isSubmitting.set(true);
    this.groupOrdersService.submit$(invite.GroupReservationId, reservationId).subscribe({
      next: () => {
        const status = this.groupStatus();
        if (status) {
          this.groupStatus.set({ ...status, status: 'Submitted' });
        }
        this.isSubmitting.set(false);
        this.isConfirmationOpen.set(false);
        this.toastService.success('Pre-order sent to the restaurant');
      },
      error: () => {
        this.isSubmitting.set(false);
        if (this.groupStatus()?.status === 'Open') {
          this.startSync(invite.GroupReservationId);
        }
      },
    });
  }

  private handleLoadError(error: unknown): void {
    this.stopSync();
    this.loading.set(false);
    if (error instanceof HttpErrorResponse && error.status === 404) {
      this.loadError.set('Group reservation not found');
      return;
    }
    if (error instanceof HttpErrorResponse && error.status === 401) {
      this.accessDenied.set(true);
      this.loadError.set('Your session has expired. Please sign in again.');
      return;
    }
    if (error instanceof HttpErrorResponse && error.status === 403) {
      this.accessDenied.set(true);
      this.loadError.set("You don't have permission to view this group pre-order.");
      return;
    }
    const apiMessage = this.getApiErrorMessage(error);
    if (apiMessage) {
      this.loadError.set(apiMessage);
      return;
    }
    this.loadError.set('Something went wrong. Please try again.');
  }

  private getApiErrorMessage(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return '';
    }

    const response = error.error;
    if (typeof response === 'string') {
      return response.trim();
    }
    if (response && typeof response === 'object') {
      const message = response.message ?? response.error;
      return typeof message === 'string' ? message.trim() : '';
    }
    return '';
  }

  refresh(): void {
    this.refreshRequests.next();
  }

  private startSync(groupReservationId: string): void {
    if (this.syncSubscription) {
      return;
    }

    this.syncSubscription = merge(interval(SYNC_INTERVAL_MS), this.refreshRequests)
      .pipe(
        exhaustMap(() =>
          forkJoin({
            sessions: this.groupOrdersService.getSessions$(groupReservationId, { silent: true }),
            status: this.groupOrdersService.getStatus$(groupReservationId, { silent: true }),
          }).pipe(
            catchError(() => {
              this.refreshError.set(true);
              return EMPTY;
            })
          )
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(({ sessions, status }) => {
        this.participants.set(
          this.withOwnerPreOrder(sessions.participants, this.guestSessionId(), this.ownerOrder())
        );
        this.groupStatus.set(status);
        this.updatedAt.set(new Date());
        this.refreshError.set(false);
        if (status.status !== 'Open') {
          this.stopSync();
        }
      });
  }

  private stopSync(): void {
    this.syncSubscription?.unsubscribe();
    this.syncSubscription = null;
  }
}
