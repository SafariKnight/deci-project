import { PrismaClient } from "#prisma/client.ts"
import { PrismaPg } from "@prisma/adapter-pg"
import "dotenv/config"

export const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! })
})
