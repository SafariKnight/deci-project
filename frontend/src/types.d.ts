type Role = "USER" | "ADMIN" | "OWNER";
type User = {
  id: number;
  username: string;
  email: string;
  role: Role;
};

type Product = {
  id: string;
  name: string;
  price: number;
  description: string;
  imageFilename: string;
  owner: number;
  details: Record<string, string | number>;
  uploadedAt: string;
};

type CreateProductRequest = {
  productName: string;
  price: number;
  imageFilename: string;
  details?: Record<string, string | number>;
};

type LoginResponse = {
  accessToken: string;
  user: User;
};

type RefreshResponse = {
  accessToken: string;
};

type Review = {
  productId: string;
  userId: number;
  username: string;
  rating: number;
  comment: string;
  createdAt: number;
};

type CartItem = {
  productId: string;
  quantity: number;
  addedAt: number;
};

type Cart = {
  userId: number;
  products: CartItem[];
};

type LoginAPIError = "email_missing" | "wrong_password";
