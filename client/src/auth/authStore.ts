export type Role = "WAITER" | "CHEF" | "MANAGER";

export interface StoredUser {
  id: string;
  name: string;
  role: Role;
  email: string;
  username?: string;
}

export function getStoredUser(): StoredUser | null {
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

export function isAuthed() {
  return Boolean(localStorage.getItem("token"));
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

