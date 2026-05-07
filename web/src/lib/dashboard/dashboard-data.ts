import type {
  DashboardLowStockProduct,
  DashboardSummary,
  DashboardCategorySale,
  DashboardWeeklySales,
  StockHistoryItem,
} from '@/lib/types';

export type DashboardOverviewData = {
  lowStockProducts: DashboardLowStockProduct[];
  recentMovements: StockHistoryItem[];
  topCategories: DashboardCategorySale[];
  topSellingProducts: DashboardSummary['topSellingProducts'];
  weeklySales: DashboardWeeklySales;
  totalStock: number;
  catalogAvailability: number;
  dailyBalance: number;
};

export function buildDashboardOverviewData({
  dashboard,
}: {
  dashboard: DashboardSummary;
}): DashboardOverviewData {
  const topSellingProducts = dashboard.topSellingProducts;
  const lowStockProducts = dashboard.lowStockProducts;
  const recentMovements = dashboard.recentMovements.slice(0, 9); // Limit to 9 items as requested
  const topCategories = dashboard.topCategories;
  const weeklySales = dashboard.weeklySales;
  const { totalStock, catalogAvailability, dailyBalance } = dashboard;

  return {
    lowStockProducts,
    recentMovements,
    topCategories,
    topSellingProducts,
    weeklySales,
    totalStock,
    catalogAvailability,
    dailyBalance,
  };
}
