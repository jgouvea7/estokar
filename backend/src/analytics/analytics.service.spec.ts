import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { Product } from '../products/entities/product.entity';
import { StockMovement } from '../stock-movements/entities/stock-movement.entity';
import { makeProduct } from '../common/test/factories';

function createQueryBuilderMock(overrides?: {
  getRawManyReturn?: unknown;
  getManyReturn?: unknown;
}) {
  const rawMany = overrides?.getRawManyReturn ?? [];
  const manyReturn = overrides?.getManyReturn ?? [];
  return {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    setParameter: jest.fn().mockReturnThis(),
    setParameters: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue(rawMany),
    getRawOne: jest.fn().mockResolvedValue(null),
    getMany: jest.fn().mockResolvedValue(manyReturn),
  };
}

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let productsRepository: Record<string, jest.Mock>;
  let stockMovementsRepository: Record<string, jest.Mock>;

  const mockProduct = makeProduct();

  beforeEach(async () => {
    productsRepository = {
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    stockMovementsRepository = {
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: getRepositoryToken(Product), useValue: productsRepository },
        {
          provide: getRepositoryToken(StockMovement),
          useValue: stockMovementsRepository,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAnalytics', () => {
    it('should return full analytics data for monthly period', async () => {
      productsRepository.find.mockResolvedValue([mockProduct]);
      productsRepository.createQueryBuilder.mockReturnValue(
        createQueryBuilderMock(),
      );
      stockMovementsRepository.createQueryBuilder.mockReturnValue(
        createQueryBuilderMock(),
      );

      const result = await service.getAnalytics('user-1', 'monthly');

      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('timeline');
      expect(result).toHaveProperty('dailyBalance');
      expect(result).toHaveProperty('topSelling');
      expect(result).toHaveProperty('lowestSelling');
      expect(result).toHaveProperty('categoryPerformance');
      expect(result).toHaveProperty('weekDayDistribution');
      expect(result).toHaveProperty('stockRanges');
      expect(result).toHaveProperty('forecast');
    });

    it('should handle empty data', async () => {
      productsRepository.find.mockResolvedValue([]);
      productsRepository.createQueryBuilder.mockReturnValue(
        createQueryBuilderMock(),
      );
      stockMovementsRepository.createQueryBuilder.mockReturnValue(
        createQueryBuilderMock(),
      );

      const result = await service.getAnalytics('user-1', 'monthly');

      expect(result.summary.totalStock).toBe(0);
      expect(result.summary.totalProducts).toBe(0);
      expect(result.timeline).toEqual([]);
      expect(result.forecast).toEqual([]);
    });

    it('should default to monthly when period is invalid', async () => {
      productsRepository.find.mockResolvedValue([]);
      productsRepository.createQueryBuilder.mockReturnValue(
        createQueryBuilderMock(),
      );
      stockMovementsRepository.createQueryBuilder.mockReturnValue(
        createQueryBuilderMock(),
      );

      const result = await service.getAnalytics('user-1', 'invalid');

      expect(result).toBeDefined();
      expect(result.summary.totalProducts).toBe(0);
    });

    it('should work with weekly period', async () => {
      productsRepository.find.mockResolvedValue([mockProduct]);
      productsRepository.createQueryBuilder.mockReturnValue(
        createQueryBuilderMock(),
      );
      stockMovementsRepository.createQueryBuilder.mockReturnValue(
        createQueryBuilderMock(),
      );

      const result = await service.getAnalytics('user-1', 'weekly');

      expect(result).toBeDefined();
      expect(result.summary.totalProducts).toBe(1);
    });

    it('should work with annual period', async () => {
      productsRepository.find.mockResolvedValue([mockProduct]);
      productsRepository.createQueryBuilder.mockReturnValue(
        createQueryBuilderMock(),
      );
      stockMovementsRepository.createQueryBuilder.mockReturnValue(
        createQueryBuilderMock(),
      );

      const result = await service.getAnalytics('user-1', 'annual');

      expect(result).toBeDefined();
      expect(result.summary.totalProducts).toBe(1);
    });

    it('should include all products in forecast', async () => {
      const productWithSales = makeProduct({ quantity: 10 });
      productsRepository.find.mockResolvedValue([productWithSales]);
      productsRepository.createQueryBuilder.mockReturnValue(
        createQueryBuilderMock(),
      );
      stockMovementsRepository.createQueryBuilder.mockReturnValue(
        createQueryBuilderMock(),
      );

      const result = await service.getAnalytics('user-1', 'monthly');

      expect(result.forecast).toHaveLength(1);
      expect(result.forecast[0].productId).toBe(productWithSales.id);
      expect(result.forecast[0]).toHaveProperty('averageDailySales');
      expect(result.forecast[0]).toHaveProperty('estimatedDaysLeft');
      expect(result.forecast[0]).toHaveProperty('status');
    });
  });
});
