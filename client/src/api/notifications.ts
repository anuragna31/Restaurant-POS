import { http } from "./http";

export interface NotificationDto {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export async function fetchNotifications(): Promise<NotificationDto[]> {
  const res = await http.get<NotificationDto[]>("/notifications");
  return res.data;
}

export async function markNotificationRead(id: string) {
  const res = await http.patch(`/notifications/${id}/read`);
  return res.data;
}

export async function markAllNotificationsRead() {
  const res = await http.patch("/notifications/read-all");
  return res.data;
}

export async function createKitchenAlert(input: {
  order_id: string;
  type: "ITEM_UNAVAILABLE" | "DELAY" | "OTHER";
  message: string;
}) {
  const res = await http.post("/kitchen-alerts", input);
  return res.data;
}
