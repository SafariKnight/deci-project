import dotenv from "dotenv";
import path from "node:path";

const env = process.env.NODE_ENV || "dev";

const envFiles = {
  dev: ".env.dev",
  test: ".env.test",
  production: ".env.production",
} as const;

const envFile = envFiles[env as keyof typeof envFiles];

if (envFile) {
  const envPath = path.resolve(process.cwd(), "..", envFile);
  dotenv.config({ path: envPath, quiet: true });
}
