import { knexInstance, dbClient } from "../db/knexClient";
import { loadEnv } from "../config/loadEnv";

loadEnv();

async function ensureUsernameColumn() {
  if (!knexInstance || dbClient !== "mysql2") {
    throw new Error("This migration is for MySQL only. Set DB_CLIENT=mysql2.");
  }

  const hasUsername = await knexInstance("information_schema.COLUMNS")
    .where({
      TABLE_SCHEMA: process.env.DB_NAME,
      TABLE_NAME: "users",
      COLUMN_NAME: "username"
    })
    .first();

  if (!hasUsername) {
    await knexInstance.raw("ALTER TABLE users ADD COLUMN username VARCHAR(64) NULL;");
  }

  // Backfill existing users with username from email prefix if null
  await knexInstance.raw(
    "UPDATE users SET username = SUBSTRING_INDEX(email, '@', 1) WHERE username IS NULL OR username = '';"
  );

  // Make unique + not null (MySQL requires all existing rows have values first)
  const nullCount = await knexInstance("users").whereNull("username").count<{ c: string }>("id as c").first();
  if (nullCount && Number(nullCount.c) === 0) {
    try {
      await knexInstance.raw("ALTER TABLE users MODIFY username VARCHAR(64) NOT NULL;");
    } catch {}
    try {
      await knexInstance.raw("CREATE UNIQUE INDEX uniq_users_username ON users(username);");
    } catch {}
  }
}

ensureUsernameColumn()
  .then(() => {
    console.log("MySQL migration complete: users.username");
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

