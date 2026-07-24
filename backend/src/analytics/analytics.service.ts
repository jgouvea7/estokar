import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import {
  StockMovement,
  StockMovementType,
} from '../stock-movements/entities/stock-movement.entity';
import { calculateForecast, toNumber } from '../common/utils/forecast.util';
import { resolvePeriod, getStartDate } from '../common/utils/period.util';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(StockMovement)
    private readonly stockMovementsRepository: Repository<StockMovement>,
  ) {}

  async getAnalytics(userId: string, period?: string) {
    const resolvedPeriod = resolvePeriod(period);
    const startDate = getStartDate(resolvedPeriod);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      products,
      periodMovements,
      timelineMovements,
      dailyBalanceData,
      topSellingData,
      lowestSellingData,
      categorySalesData,
      weekDayData,
      stockRangesData,
      salesData,
      stockDistributionData,
    ] = await Promise.all([
      this.productsRepository.find({
        where: { userId },
        select: ['id', 'name', 'quantity'],
        order: { quantity: 'DESC' },
      }),
      this.stockMovementsRepository
        .createQueryBuilder('m')
        .select(['m.type', 'm.quantity'])
        .where('m.userId = :userId', { userId })
        .andWhere('m."createdAt" >= :startDate', { startDate })
        .getMany(),
      this.getTimelineMovements(userId, startDate),
      this.getDailyBalance(userId, startDate),
      this.getTopSelling(userId, startDate),
      this.getLowestSelling(userId, startDate),
      this.getCategorySales(userId, startDate),
      this.getWeekDayDistribution(userId, startDate),
      this.getStockRanges(userId),
      this.getSalesData(userId, sevenDaysAgo, fourteenDaysAgo, thirtyDaysAgo),
      this.getStockDistribution(userId),
    ]);

    const totalProducts = products.length;
    const totalStock = products.reduce((acc, p) => acc + p.quantity, 0);
    const catalogAvailability =
      totalProducts > 0
        ? (products.filter((p) => p.quantity > 0).length / totalProducts) * 100
        : 0;

    const totalEntries = periodMovements
      .filter((m) => m.type === StockMovementType.IN)
      .reduce((acc, m) => acc + m.quantity, 0);
    const totalOutputs = periodMovements
      .filter((m) => m.type === StockMovementType.OUT)
      .reduce((acc, m) => acc + m.quantity, 0);
    const avgOutputPerMovement =
      periodMovements.length > 0 ? totalOutputs / periodMovements.length : 0;

    const timeline = this.buildTimeline(timelineMovements);

    const dailyBalance = dailyBalanceData.map((row) => ({
      date: row.date,
      entries: toNumber(row.entries),
      outputs: toNumber(row.outputs),
      balance: toNumber(row.entries) - toNumber(row.outputs),
    }));

    const topSelling = topSellingData.map((row) => ({
      productId: row.productId,
      productName: row.productName,
      quantity: toNumber(row.quantity),
    }));

    const categoryStockData = await this.getCategoryStock(userId);

    const salesMap = new Map(
      salesData.map((row) => [
        row.productId,
        {
          recentSoldQuantity7: toNumber(row.recentSoldQuantity7),
          recentSoldQuantity14: toNumber(row.recentSoldQuantity14),
          recentSoldQuantity30: toNumber(row.recentSoldQuantity30),
        },
      ]),
    );

    const forecast = products
      .map((product) => {
        const sales = salesMap.get(product.id);
        if (
          !sales ||
          (sales.recentSoldQuantity7 <= 0 &&
            sales.recentSoldQuantity14 <= 0 &&
            sales.recentSoldQuantity30 <= 0)
        ) {
          return {
            productId: product.id,
            productName: product.name,
            currentStock: product.quantity,
            averageDailySales: 0,
            estimatedDaysLeft: null,
            status: 'ok' as const,
          };
        }
        const forecast = calculateForecast({
          currentStock: product.quantity,
          soldLast7Days: sales.recentSoldQuantity7,
          soldLast14Days: sales.recentSoldQuantity14,
          soldLast30Days: sales.recentSoldQuantity30,
        });
        const status =
          forecast.estimatedDaysLeft !== null && forecast.estimatedDaysLeft <= 0
            ? ('critical' as const)
            : forecast.estimatedDaysLeft !== null &&
                forecast.estimatedDaysLeft <= 7
              ? ('warning' as const)
              : ('ok' as const);
        return {
          productId: product.id,
          productName: product.name,
          currentStock: product.quantity,
          averageDailySales: forecast.averageDailySales,
          estimatedDaysLeft: forecast.estimatedDaysLeft,
          status,
        };
      })
      .sort((a, b) => {
        const aDays = a.estimatedDaysLeft ?? Infinity;
        const bDays = b.estimatedDaysLeft ?? Infinity;
        return aDays - bDays;
      });

    const categoryStockMap = new Map(
      categoryStockData.map((row) => [row.categoryName, toNumber(row.stock)]),
    );

    const totalCategorySales = categorySalesData.reduce(
      (sum, row) => sum + toNumber(row.sales),
      0,
    );

    const categoryPerformance = categorySalesData.map((row) => ({
      categoryName: row.categoryName,
      sales: toNumber(row.sales),
      stock: categoryStockMap.get(row.categoryName) ?? 0,
      percentage:
        totalCategorySales > 0
          ? (toNumber(row.sales) / totalCategorySales) * 100
          : 0,
    }));

    const weekDayDistribution = weekDayData.map((row) => ({
      day: this.getWeekDayName(Number(row.dow)),
      entries: toNumber(row.entries),
      outputs: toNumber(row.outputs),
    }));

    const stockRanges = stockRangesData.map((row) => ({
      range: row.range,
      count: toNumber(row.count),
    }));

    const stockDistribution = stockDistributionData.map((p) => ({
      productId: p.id,
      productName: p.name,
      quantity: p.quantity,
    }));

    return {
      summary: {
        totalStock,
        totalProducts,
        totalMovements: periodMovements.length,
        totalEntries,
        totalOutputs,
        catalogAvailability,
        avgOutputPerMovement,
      },
      timeline,
      dailyBalance,
      topSelling,
      lowestSelling: lowestSellingData.map((row) => ({
        productId: row.productId,
        productName: row.productName,
        quantity: toNumber(row.quantity),
      })),
      categoryPerformance,
      weekDayDistribution,
      stockRanges,
      stockDistribution,
      forecast,
    };
  }

  private getTimelineMovements(userId: string, startDate?: Date) {
    const query = this.stockMovementsRepository
      .createQueryBuilder('m')
      .select('m."createdAt"', 'createdAt')
      .addSelect(
        `CASE WHEN m.type = :inType THEN m.quantity ELSE -m.quantity END`,
        'netChange',
      )
      .where('m.userId = :userId', { userId })
      .setParameter('inType', StockMovementType.IN)
      .orderBy('m."createdAt"', 'ASC');

    if (startDate) {
      query.andWhere('m."createdAt" >= :startDate', { startDate });
    }

    return query.getRawMany<{ createdAt: Date; netChange: string }>();
  }

  private getDailyBalance(userId: string, startDate: Date) {
    return this.stockMovementsRepository
      .createQueryBuilder('m')
      .select(`m."createdAt"::date`, 'date')
      .addSelect(
        `COALESCE(SUM(CASE WHEN m.type = 'in' THEN m.quantity ELSE 0 END), 0)`,
        'entries',
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN m.type = 'out' THEN m.quantity ELSE 0 END), 0)`,
        'outputs',
      )
      .where('m.userId = :userId', { userId })
      .andWhere('m."createdAt" >= :startDate', { startDate })
      .groupBy('m."createdAt"::date')
      .orderBy('m."createdAt"::date', 'ASC')
      .getRawMany<{ date: string; entries: string; outputs: string }>();
  }

  private getTopSelling(userId: string, startDate: Date) {
    return this.stockMovementsRepository
      .createQueryBuilder('m')
      .select('m.productId', 'productId')
      .addSelect('p.name', 'productName')
      .addSelect('COALESCE(SUM(m.quantity), 0)', 'quantity')
      .innerJoin('product', 'p', 'p.id = m.productId')
      .where('m.userId = :userId', { userId })
      .andWhere('m.type = :outType', { outType: StockMovementType.OUT })
      .andWhere('m."createdAt" >= :startDate', { startDate })
      .groupBy('m.productId')
      .addGroupBy('p.name')
      .orderBy('"quantity"', 'DESC')
      .limit(10)
      .getRawMany<{
        productId: string;
        productName: string;
        quantity: string;
      }>();
  }

  private getLowestSelling(userId: string, startDate: Date) {
    return this.stockMovementsRepository
      .createQueryBuilder('m')
      .select('m.productId', 'productId')
      .addSelect('p.name', 'productName')
      .addSelect('COALESCE(SUM(m.quantity), 0)', 'quantity')
      .innerJoin('product', 'p', 'p.id = m.productId')
      .where('m.userId = :userId', { userId })
      .andWhere('m.type = :outType', { outType: StockMovementType.OUT })
      .andWhere('m."createdAt" >= :startDate', { startDate })
      .groupBy('m.productId')
      .addGroupBy('p.name')
      .orderBy('"quantity"', 'ASC')
      .limit(5)
      .getRawMany<{
        productId: string;
        productName: string;
        quantity: string;
      }>();
  }

  private getCategorySales(userId: string, startDate: Date) {
    return this.stockMovementsRepository
      .createQueryBuilder('m')
      .select('COALESCE(c.name, :noCategory)', 'categoryName')
      .addSelect('COALESCE(SUM(m.quantity), 0)', 'sales')
      .innerJoin('product', 'p', 'p.id = m.productId')
      .leftJoin('category', 'c', 'c.id = p.categoryId')
      .where('m.userId = :userId', { userId })
      .andWhere('m.type = :outType', { outType: StockMovementType.OUT })
      .andWhere('m."createdAt" >= :startDate', { startDate })
      .setParameter('noCategory', 'Sem categoria')
      .groupBy('c.name')
      .orderBy('"sales"', 'DESC')
      .getRawMany<{ categoryName: string; sales: string }>();
  }

  private getCategoryStock(userId: string) {
    return this.productsRepository
      .createQueryBuilder('p')
      .select('COALESCE(c.name, :noCategory)', 'categoryName')
      .addSelect('COALESCE(SUM(p.quantity), 0)', 'stock')
      .leftJoin('category', 'c', 'c.id = p.categoryId')
      .where('p.userId = :userId', { userId })
      .setParameter('noCategory', 'Sem categoria')
      .groupBy('c.name')
      .orderBy('"stock"', 'DESC')
      .getRawMany<{ categoryName: string; stock: string }>();
  }

  private getWeekDayDistribution(userId: string, startDate: Date) {
    return this.stockMovementsRepository
      .createQueryBuilder('m')
      .select(`EXTRACT(DOW FROM m."createdAt")`, 'dow')
      .addSelect(
        `COALESCE(SUM(CASE WHEN m.type = :inType THEN m.quantity ELSE 0 END), 0)`,
        'entries',
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN m.type = :outType THEN m.quantity ELSE 0 END), 0)`,
        'outputs',
      )
      .where('m.userId = :userId', { userId })
      .andWhere('m."createdAt" >= :startDate', { startDate })
      .setParameters({
        inType: StockMovementType.IN,
        outType: StockMovementType.OUT,
      })
      .groupBy('EXTRACT(DOW FROM m."createdAt")')
      .orderBy('"dow"', 'ASC')
      .getRawMany<{ dow: string; entries: string; outputs: string }>();
  }

  private getStockRanges(userId: string) {
    return this.productsRepository
      .createQueryBuilder('p')
      .select(
        `CASE
          WHEN p.quantity = 0 THEN '0'
          WHEN p.quantity <= 5 THEN '1-5'
          WHEN p.quantity <= 20 THEN '6-20'
          WHEN p.quantity <= 50 THEN '21-50'
          ELSE '50+'
        END`,
        'range',
      )
      .addSelect('COUNT(p.id)', 'count')
      .where('p.userId = :userId', { userId })
      .groupBy('range')
      .orderBy('range', 'ASC')
      .getRawMany<{ range: string; count: string }>();
  }

  private getSalesData(
    userId: string,
    sevenDaysAgo: Date,
    fourteenDaysAgo: Date,
    thirtyDaysAgo: Date,
  ) {
    return this.stockMovementsRepository
      .createQueryBuilder('m')
      .select('m.productId', 'productId')
      .addSelect(
        `COALESCE(SUM(CASE WHEN m."createdAt" >= :sevenDaysAgo THEN m.quantity ELSE 0 END), 0)`,
        'recentSoldQuantity7',
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN m."createdAt" >= :fourteenDaysAgo THEN m.quantity ELSE 0 END), 0)`,
        'recentSoldQuantity14',
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN m."createdAt" >= :thirtyDaysAgo THEN m.quantity ELSE 0 END), 0)`,
        'recentSoldQuantity30',
      )
      .where('m.userId = :userId', { userId })
      .andWhere('m.type = :outType', { outType: StockMovementType.OUT })
      .setParameters({ sevenDaysAgo, fourteenDaysAgo, thirtyDaysAgo })
      .groupBy('m.productId')
      .getRawMany<{
        productId: string;
        recentSoldQuantity7: string;
        recentSoldQuantity14: string;
        recentSoldQuantity30: string;
      }>();
  }

  private buildTimeline(movements: { createdAt: Date; netChange: string }[]) {
    if (!movements.length) return [];

    const dailyMap = new Map<string, number>();
    for (const m of movements) {
      const day = m.createdAt.toISOString().slice(0, 10);
      dailyMap.set(day, (dailyMap.get(day) ?? 0) + Number(m.netChange));
    }

    const sortedDays = [...dailyMap.keys()].sort();
    let cumulative = 0;
    const points: { date: string; balance: number }[] = [];
    for (const day of sortedDays) {
      cumulative += dailyMap.get(day)!;
      points.push({ date: day, balance: cumulative });
    }

    return points;
  }

  private getStockDistribution(userId: string) {
    return this.productsRepository.find({
      where: { userId },
      select: ['id', 'name', 'quantity'],
      order: { quantity: 'DESC' },
      take: 20,
    });
  }

  private getWeekDayName(dow: number): string {
    const names = [
      'Domingo',
      'Segunda',
      'Terca',
      'Quarta',
      'Quinta',
      'Sexta',
      'Sabado',
    ];
    return names[dow] ?? 'Desconhecido';
  }
}
