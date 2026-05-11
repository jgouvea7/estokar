export type UserRole = 'FREE' | 'ADMIN';

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  alertDaysBefore?: number;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
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
  alertDaysBefore?: number;
  estimatedDaysLeft?: number | null;
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
  context?: string;
};

export type ProductDashboardMovement = {
  createdAt: string;
  id: string;
  quantity: number;
  type: 'in' | 'out';
};

export type ProductDashboardResponse = {
  forecast: {
    averageDailySales: number;
    estimatedDaysLeft: number | null;
  };
  product: {
    alertDaysBefore: number;
    currentStock: number;
    id: string;
    image: string;
    name: string;
  };
  recentMovements: ProductDashboardMovement[];
  summary: {
    totalEntries: number;
    totalOutputs: number;
  };
};

export type ProductDetailsResponse = {
  product: {
    id: string;
    name: string;
    description: string;
    image: string;
    categoryId?: string | null;
    category?: Category | null;
  };
  dashboard: {
    alertDaysBefore: number;
    currentStock: number;
    averageDailySales: number;
    estimatedDaysLeft: number | null;
    recentMovements: ProductDashboardMovement[];
    summary: {
      totalEntries: number;
      totalOutputs: number;
    };
  };
};

export type DashboardTopSellingProduct = {
  currentQuantity: number;
  productId: string;
  productName: string;
  soldQuantity: number;
};

export type DashboardCategorySale = {
  categoryName: string;
  percentage: number;
  rank: number;
  soldQuantity: number;
};

export type DashboardWeeklySales = {
  comparisonLabel: string;
  currentWeekSales: number;
  direction: 'up' | 'down' | 'flat';
  previousWeekSales: number;
  valueLabel: string;
  variationPercentage: number;
};

export type DashboardLowStockProduct = {
  currentQuantity: number;
  productId: string;
  productName: string;
  status: 'critical' | 'low';
  suggestedRestock: number;
  threshold: number;
};

export type DashboardForecastProduct = {
  averageDailySales: number;
  currentQuantity: number;
  estimatedDaysLeft: number;
  productId: string;
  productName: string;
  recentSoldQuantity: number;
};

export type DashboardAlertProduct = {
  alertDaysBefore: number;
  averageDailySales: number;
  currentQuantity: number;
  estimatedDaysLeft: number;
  productId: string;
  productName: string;
  recentSoldQuantity: number;
};

export type DashboardRecentMovement = StockHistoryItem;

export type DashboardSummary = {
  alerts: DashboardAlertProduct[];
  forecastedProducts: DashboardForecastProduct[];
  lowStockProducts: DashboardLowStockProduct[];
  recentMovements: DashboardRecentMovement[];
  topCategories: DashboardCategorySale[];
  topSellingProducts: DashboardTopSellingProduct[];
  weeklySales: DashboardWeeklySales;
  totalStock: number;
  catalogAvailability: number;
  dailyBalance: number;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
};

export type AdminStats = {
  totalUsers: number;
  totalProducts: number;
};

export type AdminStatsPeriod = 'total' | 'monthly';

export type PaginatedResponse<T> = {
  data: T[];
  meta: {
    total: number;
    page: number;
    lastPage: number;
    perPage: number;
  };
};
