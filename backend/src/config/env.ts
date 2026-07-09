import path from "node:path";
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

const env = process.env.NODE_ENV || "dev";

if (env !== "production") {
  const envFile = {
    dev: ".env.dev" as const,
    test: ".env.test" as const,
  }[env];

  if (!envFile) {
    throw new Error(`Unsupported Environment: ${env}`);
  }

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const envPath = path.resolve(__dirname, "../..", envFile);

  dotenv.config({ path: envPath, quiet: true });
}
