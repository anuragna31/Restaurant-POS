import { http } from "./http";

export interface MenuItemDto {
  id: string;
  name: string;
  description: string | null;
  price: number | string;
  image_url: string | null;
  is_available: number | boolean;
  category: string | null;
}

export interface MenuCategoryDto {
  id: string;
  name: string;
  sort_order: number;
}

export async function fetchMenuItems(): Promise<MenuItemDto[]> {
  const res = await http.get<MenuItemDto[]>("/menu/items");
  return res.data;
}

export async function fetchMenuCategories(): Promise<MenuCategoryDto[]> {
  const res = await http.get<MenuCategoryDto[]>("/menu/categories");
  return res.data;
}

export async function createMenuItem(input: {
  name: string;
  category: string;
  price: number;
  description?: string;
  image_url?: string;
  is_available: boolean;
}) {
  const res = await http.post("/menu/items", input);
  return res.data;
}

export async function updateMenuItem(
  id: string,
  input: {
    name: string;
    category: string;
    price: number;
    description?: string;
    image_url?: string;
    is_available: boolean;
  }
) {
  const res = await http.patch(`/menu/items/${id}`, input);
  return res.data;
}

export async function deleteMenuItem(id: string) {
  const res = await http.delete(`/menu/items/${id}`);
  return res.data;
}

