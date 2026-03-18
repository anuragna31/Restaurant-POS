import bcrypt from "bcryptjs";
import { knexInstance, dbClient } from "../db/knexClient";
import { newId } from "../utils/uuid";
import { loadEnv } from "../config/loadEnv";

loadEnv();

async function seed() {
  if (!knexInstance || dbClient === "mongodb") {
    throw new Error("SQL database not configured. Set DB_CLIENT to pg/mysql2/mssql.");
  }

  const usersToEnsure = [
    { username: "waiter1", name: "Waiter One", role: "WAITER", password: "waiter123", email: "waiter1@restro.local" },
    { username: "chef", name: "Kitchen Chef", role: "CHEF", password: "chef123", email: "chef@restro.local" },
    { username: "manager", name: "Demo Manager", role: "MANAGER", password: "manager123", email: "manager@restro.local" }
  ] as const;

  for (const u of usersToEnsure) {
    // eslint-disable-next-line no-await-in-loop
    const passwordHash = await bcrypt.hash(u.password, 10);
    // eslint-disable-next-line no-await-in-loop
    const existing = await knexInstance("users").where({ username: u.username }).first();
    if (!existing) {
      // eslint-disable-next-line no-await-in-loop
      await knexInstance("users").insert({
        id: newId(),
        name: u.name,
        username: u.username,
        email: u.email,
        password_hash: passwordHash,
        role: u.role,
        is_active: true
      });
    } else {
      // Keep dev seed deterministic: ensure demo credentials always work
      // eslint-disable-next-line no-await-in-loop
      await knexInstance("users").where({ id: existing.id }).update({
        name: u.name,
        email: u.email,
        password_hash: passwordHash,
        role: u.role,
        is_active: true
      });
    }
  }

  const tableCount = await knexInstance("tables").count<{ count: string }>("id as count").first();
  if (!tableCount || Number(tableCount.count) === 0) {
    const tables = Array.from({ length: 16 }).map((_, i) => ({
      id: newId(),
      number: i + 1,
      name: null,
      seating_capacity: i % 4 === 0 ? 6 : 4,
      status: "FREE"
    }));
    await knexInstance("tables").insert(tables);
  }

  const categories = await knexInstance("menu_categories").select("*");
  if (categories.length === 0) {
    const appId = newId();
    const mainId = newId();
    const dessertId = newId();
    await knexInstance("menu_categories").insert([
      { id: appId, name: "Appetizers", sort_order: 1 },
      { id: mainId, name: "Main Course", sort_order: 2 },
      { id: dessertId, name: "Desserts", sort_order: 3 }
    ]);

    await knexInstance("menu_items").insert([
      {
        id: newId(),
        category_id: appId,
        name: "Garlic Bread",
        description: "Toasted baguette with garlic butter",
        price: 4.5,
        image_url: null,
        is_available: true
      },
      {
        id: newId(),
        category_id: mainId,
        name: "Margherita Pizza",
        description: "Tomato, mozzarella, basil",
        price: 10.99,
        image_url: null,
        is_available: true
      },
      {
        id: newId(),
        category_id: mainId,
        name: "Grilled Chicken Bowl",
        description: "Rice, veggies, grilled chicken, house sauce",
        price: 12.5,
        image_url: null,
        is_available: true
      },
      {
        id: newId(),
        category_id: dessertId,
        name: "Chocolate Brownie",
        description: "Warm brownie with chocolate drizzle",
        price: 5.25,
        image_url: null,
        is_available: true
      }
    ]);
  }
}

seed()
  .then(() => {
    console.log("Seed complete. Demo credentials:");
    console.log("Waiter: waiter1 / waiter123");
    console.log("Chef: chef / chef123");
    console.log("Manager: manager / manager123");
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

