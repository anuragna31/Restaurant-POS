import path from "path";
import dotenv from "dotenv";

let loaded = false;

export function loadEnv() {
  if (loaded) return;
  const envPath = path.resolve(__dirname, "../../../.env");
  dotenv.config({ path: envPath });
  loaded = true;
}

