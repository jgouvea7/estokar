import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import {
  StockMovement,
  StockMovementType,
} from '../stock-movements/entities/stock-movement.entity';
import {
  makeUser,
  makeProduct,
  makeStockMovement,
} from '../common/test/factories';

function mockQueryBuilder(returnValue: unknown) {
  return {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    setParameter: jest.fn().mockReturnThis(),
    setParameters: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue(returnValue),
    getRawOne: jest.fn().mockResolvedValue(returnValue),
    getMany: jest.fn().mockResolvedValue(returnValue),
  };
}

describe('DashboardService', () => {
  let service: DashboardService;
  let productsRepository: Record<string, jest.Mock>;
  let usersRepository: Record<string, jest.Mock>;
  let stockMovementsRepository: Record<string, jest.Mock>;

  const mockUser = makeUser();
  const mockProduct = makeProduct();
  const outMovement = makeStockMovement({
    type: StockMovementType.OUT,
    quantity: 5,
    productId: mockProduct.id,
  });
  const inMovement = makeStockMovement({
    type: StockMovementType.IN,
    quantity: 10,
    productId: mockProduct.id,
  });

  beforeEach(async () => {
    productsRepository = {
      find: jest.fn(),
    };

    usersRepository = {
      findOne: jest.fn(),
    };

    stockMovementsRepository = {
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: getRepositoryToken(Product), useValue: productsRepository },
        { provide: getRepositoryToken(User), useValue: usersRepository },
        {
          provide: getRepositoryToken(StockMovement),
          useValue: stockMovementsRepository,
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboard', () => {
    it('should return full dashboard data', async () => {
      usersRepository.findOne.mockResolvedValue(mockUser);
      productsRepository.find.mockResolvedValue([mockProduct]);
      stockMovementsRepository.find.mockResolvedValue([
        outMovement,
        inMovement,
      ]);
      stockMovementsRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder([]),
      );

      const result = await service.getDashboard('user-1');

      expect(result).toHaveProperty('topSellingProducts');
      expect(result).toHaveProperty('lowStockProducts');
      expect(result).toHaveProperty('recentMovements');
      expect(result).toHaveProperty('forecastedProducts');
      expect(result).toHaveProperty('alerts');
      expect(result).toHaveProperty('topCategories');
      expect(result).toHaveProperty('weeklySales');
      expect(result).toHaveProperty('totalStock', 50);
      expect(result).toHaveProperty('catalogAvailability');
      expect(result).toHaveProperty('dailyBalance');
    });

    it('should handle empty data', async () => {
      usersRepository.findOne.mockResolvedValue(mockUser);
      productsRepository.find.mockResolvedValue([]);
      stockMovementsRepository.find.mockResolvedValue([]);
      stockMovementsRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder([]),
      );

      const result = await service.getDashboard('user-1');

      expect(result.topSellingProducts).toEqual([]);
      expect(result.lowStockProducts).toEqual([]);
      expect(result.recentMovements).toEqual([]);
      expect(result.totalStock).toBe(0);
      expect(result.catalogAvailability).toBe(0);
      expect(result.dailyBalance).toBe(0);
    });

    it('should include daily balance from today movements', async () => {
      const todayOut = makeStockMovement({
        type: StockMovementType.OUT,
        quantity: 3,
        createdAt: new Date(),
      });
      const todayIn = makeStockMovement({
        type: StockMovementType.IN,
        quantity: 8,
        createdAt: new Date(),
      });

      usersRepository.findOne.mockResolvedValue(mockUser);
      productsRepository.find.mockResolvedValue([mockProduct]);
      stockMovementsRepository.find.mockResolvedValue([todayOut, todayIn]);
      stockMovementsRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder([
          {
            productId: mockProduct.id,
            soldQuantity: '5',
            recentSoldQuantity: '5',
          },
        ]),
      );

      const result = await service.getDashboard('user-1');

      expect(result.dailyBalance).toBe(0);
    });
  });

  describe('getAlerts', () => {
    it('should return only alerts from dashboard', async () => {
      usersRepository.findOne.mockResolvedValue(mockUser);
      productsRepository.find.mockResolvedValue([mockProduct]);
      stockMovementsRepository.find.mockResolvedValue([]);
      stockMovementsRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder([]),
      );

      const result = await service.getAlerts('user-1');

      expect(Array.isArray(result)).toBe(true);
    });
  });
});
