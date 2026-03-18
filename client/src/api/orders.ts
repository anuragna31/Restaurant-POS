import { http } from "./http";

export type OrderStatus = "PENDING" | "IN_PROGRESS" | "READY" | "SERVED" | "CANCELLED";

export interface OrderDto {
  id: string;
  table_id: string;
  waiter_id: string;
  status: OrderStatus;
  special_instructions: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  table_number?: number;
  waiter_name?: string;
  waiter_username?: string;
  items?: Array<{
    id: string;
    order_id: string;
    quantity: number;
    price_at_order: number | string;
    status: string;
    menu_item_name?: string;
  }>;
}

export async function fetchOrders(): Promise<OrderDto[]> {
  const res = await http.get<OrderDto[]>("/orders");
  return res.data;
}

