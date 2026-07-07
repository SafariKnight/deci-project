import { PrismaClient } from "#prisma/client.ts"
import { PrismaPg } from "@prisma/adapter-pg"

const connectionString = process.env.POSTGRES_URL

if (!connectionString) {
  throw new Error('"POSTGRES_URL" environtment variable isn\'t provided.')
}

const adapter = new PrismaPg({ connectionString })

export const postgres = new PrismaClient({ adapter })
