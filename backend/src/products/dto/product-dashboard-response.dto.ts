import { StockMovementType } from '../../stock-movements/entities/stock-movement.entity';

export class ProductDashboardProductDto {
  alertDaysBefore: number;
  currentStock: number;
  id: string;
  image: string;
  name: string;
}

export class ProductDashboardSummaryDto {
  totalEntries: number;
  totalOutputs: number;
}

export class ProductDashboardForecastDto {
  averageDailySales: number;
  estimatedDaysLeft: number | null;
}

export class ProductDashboardMovementDto {
  createdAt: Date | string;
  id: string;
  quantity: number;
  type: StockMovementType;
}

export class ProductDashboardResponseDto {
  forecast: ProductDashboardForecastDto;
  product: ProductDashboardProductDto;
  recentMovements: ProductDashboardMovementDto[];
  summary: ProductDashboardSummaryDto;
}
