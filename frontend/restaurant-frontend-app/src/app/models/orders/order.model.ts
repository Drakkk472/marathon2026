import { OrderItem } from '../dishes/order-item.model';

<<<<<<< HEAD
=======
export enum OrderStatus {
  Created = 0,
  Submitted = 1,
  Cancelled = 2,
  SubmittedByCustomer = 3,
}

>>>>>>> bc0f637 (first commit)
export interface Order {
  orderId: string;
  reservationAddress: string;
  reservationTime: string;
  reservationId: string;
  orderItems: OrderItem[];
  status: number;
}

export interface WaiterPreOrderState {
  reservationId: string;
  createdByName: string;
  createdByRole: string;
  tableName: string;
}
