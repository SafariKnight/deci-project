import { User } from '#prisma/client.js';

declare global {
  namespace Express {
    interface Request {
      user: Omit<User, "password">;
    }
  }
}

interface FileMetadata {
  filename: string;
  gridfsId: string;
  size: number;
  uploadedAt: number;
  owner: number;
}

interface Product {
  name: string;
  price: number;
  description: string;
  owner: number;
  details: Record<string, string | number>;
  imageFilename: string;
  uploadedAt: number;
}

interface Review {
  productId: string;
  userId: number;
  username: string;
  rating: number;
  comment: string;
  createdAt: number;
}

interface CartItem {
  productId: string;
  quantity: number;
  addedAt: number;
}

interface Cart {
  userId: number;
  products: CartItem[];
}

type LoginAPIError = "email_missing" | "wrong_password";
