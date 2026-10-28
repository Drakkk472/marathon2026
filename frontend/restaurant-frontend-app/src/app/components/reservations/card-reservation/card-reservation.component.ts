import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { Params, Router } from '@angular/router';

import { CreateOrderRequest } from '@app/models/cart/create-order-request.model';
import {
  ReservationCustomer,
  ReservationStatusCustomer,
} from '@app/models/reservations/reservation.model';
import { PlaceOrderWaiterComponent } from '@app/components/place-order-waiter/place-order-waiter.component';
import { Roles } from '@app/shared/constants/roles';
import { CustomSelectComponent } from '@app/shared/custom-components/custom-select/custom-select.component';

interface ReservationStatusView {
  class: string;
  label: string;
}

interface WaiterPreOrderNavigationData {
  reservationId: string;
  createdByName: string;
  createdByRole: string;
  tableName: string;
}

@Component({
  selector: 'app-card-reservation',
  standalone: true,
<<<<<<< HEAD
  imports: [
    DatePipe,
    CustomSelectComponent,
    PlaceOrderWaiterComponent,
  ],
=======
  imports: [DatePipe, CustomSelectComponent, PlaceOrderWaiterComponent],
>>>>>>> bc0f637 (first commit)
  templateUrl: './card-reservation.component.html',
  styleUrl: './card-reservation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardReservationComponent {
  private readonly router = inject(Router);
  readonly Roles = Roles;
  readonly ReservationStatusCustomer = ReservationStatusCustomer;

  readonly r = input.required<ReservationCustomer>();
  readonly role = input<string>(Roles.CUSTOMER);
<<<<<<< HEAD
  readonly statusEnum =
    input<Record<number, ReservationStatusView>>({});

  readonly availableTableOptions = input<string[]>([]);

  readonly availableTableOptionsMap =
    input<Map<string, string>>(new Map<string, string>());
=======
  readonly statusEnum = input<Record<number, ReservationStatusView>>({});

  readonly availableTableOptions = input<string[]>([]);

  readonly availableTableOptionsMap = input<Map<string, string>>(new Map<string, string>());
>>>>>>> bc0f637 (first commit)

  readonly selectedTableLabel = input('');

  readonly createdByName = input<string | undefined>();

<<<<<<< HEAD
  readonly createdByRole =
    input<ReservationCustomer['createdByRole']>();
=======
  readonly createdByRole = input<ReservationCustomer['createdByRole']>();
>>>>>>> bc0f637 (first commit)
  readonly tableChanged = output<{
    reservationId: string;
    newTableId: string;
  }>();

  readonly cancelReservation = output<string>();

<<<<<<< HEAD
  readonly editReservation =
    output<ReservationCustomer>();

  readonly postponeReservation =
    output<ReservationCustomer>();

  readonly leaveFeedbackReservation =
    output<ReservationCustomer>();

  readonly updateFeedbackReservation =
    output<ReservationCustomer>();

  readonly sendAnonymousFeedback =
    output<ReservationCustomer>();
=======
  readonly editReservation = output<ReservationCustomer>();

  readonly postponeReservation = output<ReservationCustomer>();

  readonly leaveFeedbackReservation = output<ReservationCustomer>();

  readonly updateFeedbackReservation = output<ReservationCustomer>();

  readonly sendAnonymousFeedback = output<ReservationCustomer>();
>>>>>>> bc0f637 (first commit)

  readonly statusChanged = output<{
    id: string;
    newStatus: ReservationStatusCustomer;
  }>();

  readonly preOrder = output<CreateOrderRequest>();
  readonly showWaiterOrderModal = signal(false);

  readonly statusView = computed<ReservationStatusView>(() => {
    const reservation = this.r();

<<<<<<< HEAD
=======
    if (
      reservation.status === ReservationStatusCustomer.Reserved &&
      reservation.hasSubmittedPreOrder
    ) {
      return { class: 'submitted', label: 'Submitted' };
    }

>>>>>>> bc0f637 (first commit)
    return (
      this.statusEnum()[reservation.status] ?? {
        class: '',
        label: 'Unknown',
      }
    );
  });

  readonly displayedTableLabel = computed(() => {
    return this.selectedTableLabel() || 'Table (Unknown)';
  });

  readonly creatorName = computed(() => {
<<<<<<< HEAD
    return (
      this.createdByName() ||
      this.r().createdByName ||
      'Unknown'
    );
  });

  readonly creatorRole = computed(() => {
    return (
      this.createdByRole() ||
      this.r().createdByRole ||
      Roles.CUSTOMER
    );
=======
    return this.createdByName() || this.r().createdByName || 'Unknown';
  });

  readonly creatorRole = computed(() => {
    return this.createdByRole() || this.r().createdByRole || Roles.CUSTOMER;
>>>>>>> bc0f637 (first commit)
  });

  readonly preOrderItemCount = computed(() => {
    return this.r().preOrder?.orderItems?.length ?? 0;
  });

  readonly canOpenWaiterPreOrder = computed(() => {
<<<<<<< HEAD
    return (
      this.preOrderItemCount() > 0 ||
      this.creatorRole() === Roles.WAITER
    );
=======
    return this.preOrderItemCount() > 0 || this.creatorRole() === Roles.WAITER;
>>>>>>> bc0f637 (first commit)
  });

  readonly isAnonymous = computed(() => {
    return !this.r().customerId;
  });

  readonly hasFullFeedback = computed(() => {
    const feedback = this.r().feedback;

<<<<<<< HEAD
    return (
      feedback?.cuisineExperience != null &&
      feedback?.service != null
    );
=======
    return feedback?.cuisineExperience != null && feedback?.service != null;
>>>>>>> bc0f637 (first commit)
  });

  onPreOrder(): void {
    const reservation = this.r();
    const startTime = new Date(reservation.startTime);
    const endTime = new Date(reservation.endTime);

<<<<<<< HEAD
    const tableLabel =
      reservation.tableName ||
      `Table ${reservation.tableId}`;
=======
    const tableLabel = reservation.tableName || `Table ${reservation.tableId}`;
>>>>>>> bc0f637 (first commit)

    const queryParams: Params = {
      preOrder: 'true',
      reservationId: reservation.id,
      reservationLabel: [
        reservation.locationAddress,
        tableLabel,
        startTime.toDateString(),
        `${startTime.toLocaleTimeString()} - ${endTime.toLocaleTimeString()}`,
      ].join(', '),
    };

    void this.router.navigate(['/menu'], {
      queryParams,
    });
  }

  onViewReservation(): void {
    if (this.role() !== Roles.CUSTOMER) {
      return;
    }

    void this.router.navigate(['/reservations', this.r().id, 'group-order']);
  }

  onPreOrderWaiter(): void {
    if (this.preOrderItemCount() > 0) {
      this.navigateToWaiterPreOrder();
      return;
    }

    if (this.creatorRole() === Roles.WAITER) {
      this.showWaiterOrderModal.set(true);
    }
  }

  closeWaiterOrderModal(): void {
    this.showWaiterOrderModal.set(false);
  }

  onWaiterOrderCreated(order: CreateOrderRequest): void {
    this.showWaiterOrderModal.set(false);
    this.preOrder.emit(order);
  }

  onTableChange(label: string): void {
    const reservation = this.r();
<<<<<<< HEAD
    const newTableId =
      this.availableTableOptionsMap().get(label);
=======
    const newTableId = this.availableTableOptionsMap().get(label);
>>>>>>> bc0f637 (first commit)

    if (!newTableId || newTableId === reservation.tableId) {
      return;
    }

    this.tableChanged.emit({
      reservationId: reservation.id,
      newTableId,
    });
  }

<<<<<<< HEAD
  onStatusChange(
    newStatus: ReservationStatusCustomer,
  ): void {
=======
  onStatusChange(newStatus: ReservationStatusCustomer): void {
>>>>>>> bc0f637 (first commit)
    this.statusChanged.emit({
      id: this.r().id,
      newStatus,
    });
  }

  private navigateToWaiterPreOrder(): void {
    const reservation = this.r();

    const navigationData: WaiterPreOrderNavigationData = {
      reservationId: reservation.id,
      createdByName: this.creatorName(),
      createdByRole: this.creatorRole(),
      tableName: reservation.tableName || 'Unknown table',
    };

<<<<<<< HEAD
    sessionStorage.setItem(
      'waiterPreOrderData',
      JSON.stringify(navigationData),
    );
=======
    sessionStorage.setItem('waiterPreOrderData', JSON.stringify(navigationData));
>>>>>>> bc0f637 (first commit)

    void this.router.navigate(['/waiter-pre-order'], {
      state: navigationData,
    });
  }
}
