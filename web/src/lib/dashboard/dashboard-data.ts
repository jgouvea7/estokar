import type {
  DashboardAlertProduct,
  DashboardForecastProduct,
  DashboardLowStockProduct,
  DashboardSummary,
  DashboardCategorySale,
  DashboardWeeklySales,
  StockHistoryItem,
} from '@/lib/types';

export type DashboardOverviewData = {
  alerts: DashboardAlertProduct[];
  forecastedProducts: DashboardForecastProduct[];
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
  const recentMovements = dashboard.recentMovements.slice(0, 9);
  const topCategories = dashboard.topCategories;
  const weeklySales = dashboard.weeklySales;
  const { totalStock, catalogAvailability, dailyBalance } = dashboard;
  const alerts = dashboard.alerts;
  const forecastedProducts = dashboard.forecastedProducts;

  return {
    alerts,
    forecastedProducts,
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
