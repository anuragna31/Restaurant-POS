import { http } from "./http";

export type TableStatus = "FREE" | "OCCUPIED" | "ORDER_IN_PROGRESS";

export interface TableDto {
  id: string;
  number: number;
  name: string | null;
  seating_capacity: number;
  status: TableStatus;
  assigned_waiter_id?: string | null;
  assigned_waiter_name?: string | null;
  assigned_waiter_username?: string | null;
}

export async function fetchTables(): Promise<TableDto[]> {
  const res = await http.get<TableDto[]>("/tables");
  return res.data;
}

export async function createTable(input: { number: number; seating_capacity: number }) {
  const res = await http.post("/tables", input);
  return res.data;
}

export async function updateTable(
  id: string,
  input: Partial<{ seating_capacity: number; status: TableStatus; assigned_waiter_id: string | null }>
) {
  const res = await http.patch(`/tables/${id}`, input);
  return res.data;
}

export async function deleteTable(id: string) {
  const res = await http.delete(`/tables/${id}`);
  return res.data;
}

