export type UserProfile = {
  id: string;
  name: string;
  email: string;
  role?: string;
};

export type Product = {
  id: string;
  remoteId?: string | null;
  name: string;
  description: string;
  categoryId?: string | null;
  category: string;
  quantity: number;
  lowStockLimit: number;
  image: string;
  syncStatus: 'synced' | 'pending' | 'error';
  updatedAt: string;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
};

export type CreateProductInput = {
  name: string;
  description: string;
  categoryId?: string | null;
  category: string;
  quantity: number;
  lowStockLimit: number;
  image: string;
};

export type UpdateProductInput = CreateProductInput;

export type StockMovement = {
  id: string;
  productId: string;
  productName: string;
  type: 'in' | 'out';
  quantity: number;
  createdAt: string;
};

export type RemoteProduct = {
  id: string;
  name: string;
  description: string;
  categoryId?: string | null;
  category?: Category | string;
  categoryName?: string;
  quantity: number;
  lowStockLimit?: number;
  image: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Category = {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
};
