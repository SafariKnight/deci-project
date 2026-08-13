export interface Review {
  _id?: string;
  productId: string;
  userId: number;
  username: string;
  rating: number;
  comment: string;
  createdAt: number;
}
