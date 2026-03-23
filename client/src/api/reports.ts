import { http } from "./http";

export type ReportRange = "day" | "week" | "month";

export interface SummaryReport {
  range: ReportRange;
  from: string;
  total_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  revenue: number;
}

export interface WaiterPerformanceRow {
  waiter_id: string;
  waiter_name: string | null;
  waiter_username: string | null;
  total_orders: number | string;
  completed_orders: number | string;
  revenue: number | string;
}

export interface PopularItemRow {
  menu_item_id: string;
  item_name: string | null;
  quantity_sold: number | string;
  revenue: number | string;
}

export interface SalesRow {
  period: string;
  orders_count: number | string;
  revenue: number | string;
}

export async function fetchSummaryReport(range: ReportRange): Promise<SummaryReport> {
  const res = await http.get<SummaryReport>("/reports/summary", { params: { range } });
  return res.data;
}

export async function fetchWaiterPerformance(range: ReportRange): Promise<WaiterPerformanceRow[]> {
  const res = await http.get<{ rows: WaiterPerformanceRow[] }>("/reports/waiter-performance", { params: { range } });
  return res.data.rows;
}

export async function fetchPopularItems(range: ReportRange): Promise<PopularItemRow[]> {
  const res = await http.get<{ rows: PopularItemRow[] }>("/reports/popular-items", { params: { range } });
  return res.data.rows;
}

export async function fetchSales(range: ReportRange): Promise<SalesRow[]> {
  const res = await http.get<{ rows: SalesRow[] }>("/reports/sales", { params: { range } });
  return res.data.rows;
}

export async function downloadReportsCsv(range: ReportRange): Promise<string> {
  const res = await http.get("/reports/export.csv", { params: { range }, responseType: "blob" });
  return URL.createObjectURL(res.data);
}
