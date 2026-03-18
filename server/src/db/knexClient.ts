import knex, { Knex } from "knex";
import { loadEnv } from "../config/loadEnv";

loadEnv();

const rawClient = (process.env.DB_CLIENT || "pg").toLowerCase();
const dbClient =
  rawClient === "mysql" ? "mysql2" : rawClient; // pg | mysql2 | mssql | mongodb

let knexInstance: Knex | null = null;

if (dbClient !== "mongodb") {
  knexInstance = knex({
    client: dbClient,
    connection: {
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT) || undefined,
      user: process.env.DB_USER || "restaurant",
      password: process.env.DB_PASSWORD || "password",
      database: process.env.DB_NAME || "restaurant_db",
      ...(dbClient === "mysql2" ? { multipleStatements: true } : {})
    },
    pool: { min: 2, max: 10 }
  });
}

export { knexInstance, dbClient };
