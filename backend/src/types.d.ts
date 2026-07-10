import { User } from "#prisma/client.ts";

declare global {
  namespace Express {
    interface Request {
      user: Omit<User, "password">;
    }
  }
}

interface FileMetadata {
  filename: string;
  path: string;
  size: number;
  uploadedAt: number;
  owner: number;
}

interface Product {
  name: string;
  price: number;
  owner: number;
  details: Record<string, string | number>;
  imageFilename: string;
  uploadedAt: number;
}
