import path from "path";
import dotenv from "dotenv";

let loaded = false;

export function loadEnv() {
  if (loaded) return;
  const envPath = path.resolve(__dirname, "../../../.env");
  dotenv.config({ path: envPath });
  if (!process.env.JWT_SECRET) {
    throw new Error("Missing required environment variable: JWT_SECRET");
  }
  loaded = true;
}

