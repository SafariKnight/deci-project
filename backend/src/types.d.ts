import { User } from "#prisma/client.ts";

declare global {
  namespace Express {
    interface Request {
      user: Omit<User, 'password'>
    }
  }
}
