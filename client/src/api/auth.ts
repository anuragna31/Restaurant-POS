import { http } from "./http";

export type Role = "WAITER" | "CHEF" | "MANAGER";

export interface LoginResponse {
  token: string;
  user: { id: string; name: string; role: Role; email: string; username?: string };
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const res = await http.post<LoginResponse>("/auth/login", { username, password });
  return res.data;
}

