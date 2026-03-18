import { knexInstance, dbClient } from "../db/knexClient";
import { loadEnv } from "../config/loadEnv";

loadEnv();

async function run() {
  if (!knexInstance || dbClient !== "mysql2") {
    throw new Error("This migration is for MySQL only. Set DB_CLIENT=mysql2.");
  }

  const hasCol = await knexInstance("information_schema.COLUMNS")
    .where({
      TABLE_SCHEMA: process.env.DB_NAME,
      TABLE_NAME: "tables",
      COLUMN_NAME: "assigned_waiter_id"
    })
    .first();

  if (!hasCol) {
    await knexInstance.raw("ALTER TABLE tables ADD COLUMN assigned_waiter_id CHAR(36) NULL;");
  }

  // Best-effort FK add (may fail if table already has incompatible collation/engine)
  try {
    await knexInstance.raw(
      "ALTER TABLE tables ADD CONSTRAINT fk_tables_assigned_waiter FOREIGN KEY (assigned_waiter_id) REFERENCES users(id);"
    );
  } catch {}
}

run()
  .then(() => {
    console.log("MySQL migration complete: tables.assigned_waiter_id");
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

