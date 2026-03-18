import { http } from "./http";

export type Role = "WAITER" | "CHEF" | "MANAGER";

export interface UserDto {
  id: string;
  name: string;
  username: string;
  email: string;
  role: Role;
  is_active: number | boolean;
  created_at: string;
}

export async function fetchUsers(role?: Role): Promise<UserDto[]> {
  const res = await http.get<UserDto[]>("/users", { params: role ? { role } : undefined });
  return res.data;
}

