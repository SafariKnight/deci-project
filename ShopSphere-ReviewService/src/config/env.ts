import dotenv from "dotenv";

const env = process.env.NODE_ENV || "dev";

const envFiles: Record<string, string> = {
  dev: ".env.dev",
  test: ".env.test",
  production: ".env.production",
};

const envFile = envFiles[env];

if (envFile) {
  dotenv.config({ path: envFile, quiet: true });
}
