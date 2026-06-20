import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import {
  StockMovement,
  StockMovementType,
} from '../stock-movements/entities/stock-movement.entity';
import { Repository } from 'typeorm';
import { calculateForecast, toNumber } from '../common/utils/forecast.util';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,

    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,

    @InjectRepository(StockMovement)
    private readonly stockMovementsRepository: Repository<StockMovement>,
  ) {}

  async getDashboard(userId: string) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const now = new Date();
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(currentWeekStart.getDate() - 7);

    const previousWeekStart = new Date(now);
    previousWeekStart.setDate(previousWeekStart.getDate() - 14);

    const [
      user,
      products,
      recentMovements,
      salesData,
      weeklySalesData,
      dailyBalanceData,
      topCategoriesData,
    ] = await Promise.all([
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
        select: [
          'id',
          'productId',
          'productName',
          'type',
          'quantity',
          'context',
          'createdAt',
        ],
        order: { createdAt: 'DESC' },
        take: 9,
      }),
      this.stockMovementsRepository
        .createQueryBuilder('m')
        .select('m.productId', 'productId')
        .addSelect('COALESCE(SUM(m.quantity), 0)', 'soldQuantity')
        .addSelect(
          `COALESCE(SUM(CASE WHEN m.createdAt >= :sevenDaysAgo THEN m.quantity ELSE 0 END), 0)`,
          'recentSoldQuantity',
        )
        .where('m.userId = :userId', { userId })
        .andWhere('m.type = :outType', { outType: StockMovementType.OUT })
        .setParameter('sevenDaysAgo', sevenDaysAgo)
        .groupBy('m.productId')
        .getRawMany<{
          productId: string;
          soldQuantity: string;
          recentSoldQuantity: string;
        }>(),
      this.stockMovementsRepository
        .createQueryBuilder('m')
        .select(
          `COALESCE(COUNT(CASE WHEN m.createdAt >= :currentWeekStart AND m.createdAt < :now THEN 1 END), 0)`,
          'currentWeekSales',
        )
        .addSelect(
          `COALESCE(COUNT(CASE WHEN m.createdAt >= :previousWeekStart AND m.createdAt < :currentWeekStart THEN 1 END), 0)`,
          'previousWeekSales',
        )
        .where('m.userId = :userId', { userId })
        .andWhere('m.type = :outType', { outType: StockMovementType.OUT })
        .setParameters({
          currentWeekStart,
          previousWeekStart,
          now,
        })
        .getRawOne<{
          currentWeekSales: string;
          previousWeekSales: string;
        }>(),
      this.stockMovementsRepository
        .createQueryBuilder('m')
        .select(
          `COALESCE(SUM(CASE WHEN m.type = :inType THEN m.quantity ELSE -m.quantity END), 0)`,
          'balance',
        )
        .where('m.userId = :userId', { userId })
        .andWhere('m.createdAt >= :startOfToday', { startOfToday })
        .setParameter('inType', StockMovementType.IN)
        .getRawOne<{ balance: string }>(),
      this.stockMovementsRepository
        .createQueryBuilder('m')
        .select('c.name', 'categoryName')
        .addSelect('COALESCE(SUM(m.quantity), 0)', 'soldQuantity')
        .innerJoin('product', 'p', 'p.id = m.productId')
        .leftJoin('category', 'c', 'c.id = p.categoryId')
        .where('m.userId = :userId', { userId })
        .andWhere('m.type = :outType', { outType: StockMovementType.OUT })
        .andWhere('c.name IS NOT NULL')
        .groupBy('c.name')
        .orderBy('"soldQuantity"', 'DESC')
        .limit(3)
        .getRawMany<{
          categoryName: string;
          soldQuantity: string;
        }>(),
    ]);

    const salesMap = new Map(
      salesData.map((row) => [
        row.productId,
        {
          soldQuantity: toNumber(row.soldQuantity),
          recentSoldQuantity: toNumber(row.recentSoldQuantity),
        },
      ]),
    );

    const alertDaysBefore = user?.alertDaysBefore ?? 7;

    const topSellingProducts = products
      .map((product) => {
        const sales = salesMap.get(product.id);
        return {
          productId: product.id,
          productName: product.name,
          currentQuantity: product.quantity,
          soldQuantity: sales?.soldQuantity ?? 0,
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
        const forecast = calculateForecast(
          product.quantity,
          sales.recentSoldQuantity,
          7,
        );
        if (forecast.averageDailySales <= 0) {
          return null;
        }
        return {
          productId: product.id,
          productName: product.name,
          currentQuantity: product.quantity,
          recentSoldQuantity: sales.recentSoldQuantity,
          averageDailySales: forecast.averageDailySales,
          estimatedDaysLeft: forecast.estimatedDaysLeft!,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a!.estimatedDaysLeft - b!.estimatedDaysLeft)
      .slice(0, 5);

    const lowStockProducts = forecastedProducts
      .filter((product) => product!.estimatedDaysLeft <= alertDaysBefore)
      .map((product) => ({
        productId: product!.productId,
        productName: product!.productName,
        currentQuantity: product!.currentQuantity,
        status: product!.estimatedDaysLeft <= 0 ? 'critical' : 'warning',
        estimatedDaysLeft: product!.estimatedDaysLeft,
        averageDailySales: product!.averageDailySales,
      }))
      .sort((a, b) => a.estimatedDaysLeft - b.estimatedDaysLeft);

    const alerts = forecastedProducts.filter(
      (product) => product!.estimatedDaysLeft <= alertDaysBefore,
    );

    const totalStock = products.reduce((acc, p) => acc + p.quantity, 0);
    const catalogAvailability =
      products.length > 0
        ? (products.filter((p) => p.quantity > 0).length / products.length) *
          100
        : 0;

    const dailyBalance = toNumber(dailyBalanceData?.balance);

    const weeklySales = this.formatWeeklySales(weeklySalesData ?? null);

    const topCategories = this.formatTopCategories(topCategoriesData);

    return {
      topSellingProducts,
      lowStockProducts,
      recentMovements,
      forecastedProducts,
      alerts,
      topCategories,
      weeklySales,
      totalStock,
      catalogAvailability,
      dailyBalance,
    };
  }

  async getAlerts(userId: string) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [user, products, salesData] = await Promise.all([
      this.usersRepository.findOne({
        where: { id: userId },
        select: ['id', 'alertDaysBefore'],
      }),
      this.productsRepository.find({
        where: { userId },
        order: { name: 'ASC' },
        select: ['id', 'name', 'quantity'],
      }),
      this.stockMovementsRepository
        .createQueryBuilder('m')
        .select('m.productId', 'productId')
        .addSelect(
          `COALESCE(SUM(CASE WHEN m.createdAt >= :sevenDaysAgo THEN m.quantity ELSE 0 END), 0)`,
          'recentSoldQuantity',
        )
        .where('m.userId = :userId', { userId })
        .andWhere('m.type = :outType', { outType: StockMovementType.OUT })
        .setParameter('sevenDaysAgo', sevenDaysAgo)
        .groupBy('m.productId')
        .getRawMany<{
          productId: string;
          recentSoldQuantity: string;
        }>(),
    ]);

    const alertDaysBefore = user?.alertDaysBefore ?? 7;

    const salesMap = new Map(
      salesData.map((row) => [
        row.productId,
        { recentSoldQuantity: toNumber(row.recentSoldQuantity) },
      ]),
    );

    return products
      .map((product) => {
        const sales = salesMap.get(product.id);
        if (!sales || sales.recentSoldQuantity <= 0) return null;

        const forecast = calculateForecast(
          product.quantity,
          sales.recentSoldQuantity,
          7,
        );
        if (
          forecast.averageDailySales <= 0 ||
          forecast.estimatedDaysLeft == null
        )
          return null;
        if (forecast.estimatedDaysLeft > alertDaysBefore) return null;

        return {
          productId: product.id,
          productName: product.name,
          currentQuantity: product.quantity,
          status: forecast.estimatedDaysLeft <= 0 ? 'critical' : 'warning',
          estimatedDaysLeft: forecast.estimatedDaysLeft,
          averageDailySales: forecast.averageDailySales,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a!.estimatedDaysLeft - b!.estimatedDaysLeft);
  }

  private formatWeeklySales(
    data: { currentWeekSales: string; previousWeekSales: string } | null,
  ) {
    const currentWeekSales = toNumber(data?.currentWeekSales);
    const previousWeekSales = toNumber(data?.previousWeekSales);
    const variationPercentage = this.calculateVariationPercentage(
      currentWeekSales,
      previousWeekSales,
    );

    return {
      comparisonLabel: `${this.formatSignedPercentage(variationPercentage)} vs. semana anterior`,
      currentWeekSales,
      direction:
        variationPercentage > 0
          ? ('up' as const)
          : variationPercentage < 0
            ? ('down' as const)
            : ('flat' as const),
      previousWeekSales,
      valueLabel: currentWeekSales.toString(),
      variationPercentage,
    };
  }

  private formatTopCategories(
    data: { categoryName: string; soldQuantity: string }[],
  ) {
    const totalSold = data.reduce(
      (sum, row) => sum + toNumber(row.soldQuantity),
      0,
    );

    return data.map((row, index) => ({
      categoryName: row.categoryName,
      percentage:
        totalSold > 0 ? (toNumber(row.soldQuantity) / totalSold) * 100 : 0,
      rank: index + 1,
      soldQuantity: toNumber(row.soldQuantity),
    }));
  }

  private calculateVariationPercentage(
    currentValue: number,
    previousValue: number,
  ) {
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
