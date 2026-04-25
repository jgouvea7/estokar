export type UserProfile = {
  id: string;
  name: string;
  email: string;
  role?: string;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
};

export type AuthResponse = {
  access_token: string;
  refresh_token: string;
  user: UserProfile;
};

export type Category = {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  categoryId?: string | null;
  category?: Category | null;
  quantity: number;
  image: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateProductPayload = {
  name: string;
  description: string;
  categoryId?: string | null;
  quantity: number;
  image: string;
};

export type UpdateProductPayload = Partial<CreateProductPayload>;

export type StockHistoryItem = {
  id: string;
  productId: string;
  productName: string;
  type: 'in' | 'out';
  quantity: number;
  createdAt: string;
};
