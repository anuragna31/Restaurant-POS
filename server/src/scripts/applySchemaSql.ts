import fs from "fs";
import path from "path";
import { knexInstance, dbClient } from "../db/knexClient";
import { loadEnv } from "../config/loadEnv";

loadEnv();

function schemaPathForClient(client: string) {
  if (client === "mysql2") return path.resolve(__dirname, "../../../db/mysql/schema.sql");
  if (client === "pg") return path.resolve(__dirname, "../../../db/postgres/schema.sql");
  if (client === "mssql") return path.resolve(__dirname, "../../../db/sqlserver/schema.sql");
  throw new Error(`Unsupported DB_CLIENT for schema apply: ${client}`);
}

async function applySchema() {
  if (!knexInstance || dbClient === "mongodb") {
    throw new Error("SQL database not configured. Set DB_CLIENT to pg/mysql2/mssql.");
  }

  const schemaPath = schemaPathForClient(dbClient);
  const sql = fs.readFileSync(schemaPath, "utf8");

  if (dbClient === "mysql2") {
    // Apply statement-by-statement so we can skip already-existing tables
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    for (const stmt of statements) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await knexInstance.raw(`${stmt};`);
      } catch (e: any) {
        if (e?.code === "ER_TABLE_EXISTS_ERROR") continue;
        throw e;
      }
    }
    return;
  }

  // For other DBs: apply as a whole for now.
  await knexInstance.raw(sql);
}

applySchema()
  .then(() => {
    console.log(`Schema applied for DB_CLIENT=${dbClient}`);
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

