import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import {
  StockMovement,
  StockMovementType,
} from '../stock-movements/entities/stock-movement.entity';
import { Repository } from 'typeorm';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,

    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,

    @InjectRepository(StockMovement)
    private readonly stockMovementsRepository: Repository<StockMovement>,
  ) { }

  async getDashboard(userId: string) {
    const [user, products, movements] = await Promise.all([
      this.usersRepository.findOne({
        where: { id: userId },
        select: ['id', 'alertDaysBefore'],
      }),
      this.productsRepository.find({
        where: { userId },
        order: { name: 'ASC' },
        relations: ['category'],
      }),

      this.stockMovementsRepository.find({
        where: { userId },
        order: { createdAt: 'DESC' },
      }),
    ]);

    const recentMovements = movements.slice(0, 9);

    const outMovements = movements.filter(
      (movement) => movement.type === StockMovementType.OUT,
    );

    const salesMap = new Map<
      string,
      {
        soldQuantity: number;
        recentSoldQuantity: number;
      }
    >();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    for (const movement of outMovements) {
      const current = salesMap.get(movement.productId) || {
        soldQuantity: 0,
        recentSoldQuantity: 0,
      };

      current.soldQuantity += movement.quantity;

      if (movement.createdAt >= sevenDaysAgo) {
        current.recentSoldQuantity += movement.quantity;
      }

      salesMap.set(movement.productId, current);
    }

    const topSellingProducts = products
      .map((product) => {
        const sales = salesMap.get(product.id);

        return {
          productId: product.id,
          productName: product.name,
          currentQuantity: product.quantity,
          soldQuantity: sales?.soldQuantity || 0,
        };
      })
      .sort((a, b) => b.soldQuantity - a.soldQuantity)
      .slice(0, 5);


    const forecastedProducts = products
      .map((product) => {
        const sales = salesMap.get(product.id);

        if (!sales || sales.recentSoldQuantity <= 0) {
          return null;
        }

        const averageDailySales = sales.recentSoldQuantity / 7;

        if (averageDailySales <= 0) {
          return null;
        }

        const estimatedDaysLeft =
          product.quantity / averageDailySales;

        return {
          productId: product.id,
          productName: product.name,
          currentQuantity: product.quantity,
          recentSoldQuantity: sales.recentSoldQuantity,
          averageDailySales,
          estimatedDaysLeft,
        };
      })
      .filter(Boolean)
      .sort(
        (a, b) =>
          a!.estimatedDaysLeft - b!.estimatedDaysLeft,
      )
      .slice(0, 5);

    const lowStockProducts = forecastedProducts
      .filter(
        (product) =>
          product &&
          product.estimatedDaysLeft <= (user?.alertDaysBefore ?? 7),
      )
      .map((product) => ({
        productId: product!.productId,
        productName: product!.productName,
        currentQuantity: product!.currentQuantity,
        status: product!.estimatedDaysLeft <= 0 ? 'critical' : 'warning',
        estimatedDaysLeft: product!.estimatedDaysLeft,
        averageDailySales: product!.averageDailySales,
      }))
      .sort((a, b) => a.estimatedDaysLeft - b.estimatedDaysLeft);

    const alertDaysBefore = user?.alertDaysBefore ?? 7;

    const alerts = forecastedProducts.filter((product) =>
      product!.estimatedDaysLeft <= alertDaysBefore,
    );

    const totalStock = products.reduce((acc, p) => acc + p.quantity, 0);
    const catalogAvailability = products.length > 0
      ? (products.filter((p) => p.quantity > 0).length / products.length) * 100
      : 0;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const dailyBalance = movements
      .filter((m) => m.createdAt >= startOfToday)
      .reduce((acc, m) => {
        return (
          acc + (m.type === StockMovementType.IN ? m.quantity : -m.quantity)
        );
      }, 0);

    return {
      topSellingProducts,
      lowStockProducts,
      recentMovements,
      forecastedProducts,
      alerts,
      topCategories: this.calculateTopCategories(products, movements),
      weeklySales: this.calculateWeeklySales(movements),
      totalStock,
      catalogAvailability,
      dailyBalance,
    };
  }

  async getAlerts(userId: string) {
    const dashboard = await this.getDashboard(userId);

    return dashboard.alerts;
  }

  private calculateTopCategories(products: Product[], movements: StockMovement[]) {
    const productById = new Map(products.map((product) => [product.id, product]));
    const salesByCategory = new Map<string, number>();

    for (const movement of movements) {
      if (movement.type !== StockMovementType.OUT) {
        continue;
      }

      const product = productById.get(movement.productId);
      const categoryName = product?.category?.name?.trim();
      if (!categoryName) {
        continue;
      }

      const current = salesByCategory.get(categoryName) ?? 0;
      salesByCategory.set(categoryName, current + movement.quantity);
    }

    const totalSold = Array.from(salesByCategory.values()).reduce((total, quantity) => total + quantity, 0);

    return Array.from(salesByCategory.entries())
      .map(([categoryName, soldQuantity], index) => ({
        categoryName,
        percentage: totalSold > 0 ? (soldQuantity / totalSold) * 100 : 0,
        rank: index + 1,
        soldQuantity,
      }))
      .sort((a, b) => b.soldQuantity - a.soldQuantity || a.categoryName.localeCompare(b.categoryName))
      .slice(0, 3)
      .map((item, index) => ({
        ...item,
        rank: index + 1,
      }));
  }

  private calculateWeeklySales(movements: StockMovement[]) {
    const now = new Date();

    // Definindo o início de "hoje" para evitar problemas de fuso
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(currentWeekStart.getDate() - 7);

    const previousWeekStart = new Date(now);
    previousWeekStart.setDate(previousWeekStart.getDate() - 14);

    const outMovements = movements.filter((movement) => movement.type === StockMovementType.OUT);

    const currentWeekSales = this.countMovementsInRange(outMovements, currentWeekStart, now);
    const previousWeekSales = this.countMovementsInRange(outMovements, previousWeekStart, currentWeekStart);

    const variationPercentage = this.calculateVariationPercentage(currentWeekSales, previousWeekSales);

    return {
      comparisonLabel: `${this.formatSignedPercentage(variationPercentage)} vs. semana anterior`,
      currentWeekSales,
      direction: variationPercentage > 0 ? 'up' : variationPercentage < 0 ? 'down' : 'flat',
      previousWeekSales,
      valueLabel: currentWeekSales.toString(),
      variationPercentage,
    };
  }

  private countMovementsInRange(
    movements: StockMovement[],
    startDate: Date,
    endDate: Date,
  ) {
    return movements.filter((movement) => {
      const movementDate = new Date(movement.createdAt);
      return movementDate >= startDate && movementDate < endDate;
    }).length;
  }

  private calculateVariationPercentage(currentValue: number, previousValue: number) {
    if (previousValue <= 0) {
      if (currentValue <= 0) {
        return 0;
      }

      return 100;
    }

    return ((currentValue - previousValue) / previousValue) * 100;
  }

  private formatSignedPercentage(value: number) {
    const rounded = Math.round(value);

    if (rounded > 0) {
      return `+${rounded}%`;
    }

    if (rounded < 0) {
      return `${rounded}%`;
    }

    return '0%';
  }
}