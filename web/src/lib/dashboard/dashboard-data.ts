import type {
  DashboardAlertProduct,
  DashboardForecastProduct,
  DashboardLowStockProduct,
  DashboardSummary,
  DashboardCategorySale,
  DashboardWeeklySales,
  StockHistoryItem,
} from '@/lib/types';
import type { TimelinePoint, CategoryStockPoint } from '@/lib/api/dashboard';

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
  timelinePoints: TimelinePoint[];
  categoryStockPoints: CategoryStockPoint[];
};

export function buildDashboardOverviewData({
  dashboard,
  timeline = [],
  categoryStock = [],
}: {
  dashboard: DashboardSummary;
  timeline?: TimelinePoint[];
  categoryStock?: CategoryStockPoint[];
}): DashboardOverviewData {
  const topSellingProducts = dashboard.topSellingProducts;
  const lowStockProducts = dashboard.lowStockProducts;
  const recentMovements = dashboard.recentMovements.slice(0, 5);
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
    timelinePoints: timeline,
    categoryStockPoints: categoryStock,
  };
}
