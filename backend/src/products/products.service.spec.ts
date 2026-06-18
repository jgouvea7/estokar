import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { User } from '../users/entities/user.entity';
import { Category } from '../categories/entities/category.entity';
import { StockMovementsService } from '../stock-movements/stock-movements.service';
import {
  StockMovement,
  StockMovementType,
} from '../stock-movements/entities/stock-movement.entity';
import { makeUser, makeProduct } from '../common/test/factories';

function mockQueryBuilder(returnValue: unknown) {
  return {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    setParameters: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue(returnValue),
    getRawOne: jest.fn().mockResolvedValue(returnValue),
    getMany: jest.fn().mockResolvedValue(returnValue),
  };
}

describe('ProductsService', () => {
  let service: ProductsService;
  let productsRepository: Record<string, jest.Mock>;
  let usersRepository: Record<string, jest.Mock>;
  let categoriesRepository: Record<string, jest.Mock>;
  let stockMovementsRepository: Record<string, jest.Mock>;
  let stockMovementsService: Record<string, jest.Mock>;

  const mockUser = makeUser();
  const mockProduct = makeProduct();

  beforeEach(async () => {
    productsRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    usersRepository = {
      findOne: jest.fn(),
      findOneBy: jest.fn(),
    };

    categoriesRepository = {
      findOneBy: jest.fn(),
    };

    stockMovementsRepository = {
      createQueryBuilder: jest.fn(),
    };

    stockMovementsService = {
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: getRepositoryToken(Product), useValue: productsRepository },
        { provide: getRepositoryToken(User), useValue: usersRepository },
        {
          provide: getRepositoryToken(Category),
          useValue: categoriesRepository,
        },
        {
          provide: getRepositoryToken(StockMovement),
          useValue: stockMovementsRepository,
        },
        { provide: StockMovementsService, useValue: stockMovementsService },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return products with forecast data', async () => {
      usersRepository.findOne.mockResolvedValue(mockUser);
      productsRepository.find.mockResolvedValue([mockProduct]);
      stockMovementsRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder([]),
      );

      const result = await service.findAll('user-1');

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('estimatedDaysLeft', null);
      expect(result[0]).toHaveProperty('alertDaysBefore', 7);
    });
  });

  describe('create', () => {
    const dto = {
      name: 'New Product',
      description: 'Desc',
      quantity: 10,
      image: '',
    };

    it('should create a product with initial stock movement', async () => {
      usersRepository.findOneBy.mockResolvedValue(mockUser);
      categoriesRepository.findOneBy = jest.fn().mockResolvedValue(null);
      productsRepository.create.mockReturnValue(mockProduct);
      productsRepository.save.mockResolvedValue(mockProduct);

      const result = await service.create(dto, 'user-1');

      expect(result).toEqual(mockProduct);
      expect(stockMovementsService.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: StockMovementType.IN }),
      );
    });

    it('should throw NotFoundException if user does not exist', async () => {
      usersRepository.findOneBy.mockResolvedValue(null);

      await expect(service.create(dto, 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findOne', () => {
    it('should return product when found', async () => {
      productsRepository.findOne.mockResolvedValue(mockProduct);

      const result = await service.findOne('product-1', 'user-1');

      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException if not found', async () => {
      productsRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('product-1', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getDetails', () => {
    it('should return product details with dashboard', async () => {
      usersRepository.findOne.mockResolvedValue(mockUser);
      productsRepository.findOne.mockResolvedValue(mockProduct);
      stockMovementsRepository.createQueryBuilder
        .mockReturnValueOnce(
          mockQueryBuilder({
            totalEntries: '10',
            totalOutputs: '5',
            recentSoldQuantity: '3',
          }),
        )
        .mockReturnValueOnce(mockQueryBuilder([]));

      const result = await service.getDetails('product-1', 'user-1');

      expect(result).toHaveProperty('product');
      expect(result).toHaveProperty('dashboard');
      expect(result.dashboard.currentStock).toBe(50);
    });

    it('should throw NotFoundException if not found', async () => {
      usersRepository.findOne.mockResolvedValue(mockUser);
      productsRepository.findOne.mockResolvedValue(null);
      stockMovementsRepository.createQueryBuilder
        .mockReturnValueOnce(
          mockQueryBuilder({
            totalEntries: '0',
            totalOutputs: '0',
            recentSoldQuantity: '0',
          }),
        )
        .mockReturnValueOnce(mockQueryBuilder([]));

      await expect(service.getDetails('product-1', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getDashboard', () => {
    it('should return dashboard data for a product', async () => {
      usersRepository.findOne.mockResolvedValue(mockUser);
      productsRepository.findOne.mockResolvedValue(mockProduct);
      stockMovementsRepository.createQueryBuilder
        .mockReturnValueOnce(
          mockQueryBuilder({
            totalEntries: '10',
            totalOutputs: '5',
            recentSoldQuantity: '3',
          }),
        )
        .mockReturnValueOnce(mockQueryBuilder([]));

      const result = await service.getDashboard('product-1', 'user-1');

      expect(result).toHaveProperty('forecast');
      expect(result).toHaveProperty('product');
      expect(result).toHaveProperty('recentMovements');
      expect(result).toHaveProperty('summary');
    });

    it('should throw NotFoundException if product not found', async () => {
      usersRepository.findOne.mockResolvedValue(mockUser);
      productsRepository.findOne.mockResolvedValue(null);
      stockMovementsRepository.createQueryBuilder
        .mockReturnValueOnce(
          mockQueryBuilder({
            totalEntries: '0',
            totalOutputs: '0',
            recentSoldQuantity: '0',
          }),
        )
        .mockReturnValueOnce(mockQueryBuilder([]));

      await expect(service.getDashboard('product-1', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update product and create stock movement if quantity changed', async () => {
      productsRepository.findOne.mockResolvedValue(mockProduct);
      productsRepository.save.mockResolvedValue({
        ...mockProduct,
        quantity: 60,
      });

      await service.update('product-1', { quantity: 60 }, 'user-1');

      expect(stockMovementsService.create).toHaveBeenCalled();
    });

    it('should not create stock movement if quantity unchanged', async () => {
      productsRepository.findOne.mockResolvedValue(mockProduct);
      productsRepository.save.mockResolvedValue(mockProduct);

      await service.update('product-1', { name: 'Renamed' }, 'user-1');

      expect(stockMovementsService.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if not found', async () => {
      productsRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('product-1', { name: 'Renamed' }, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove product when found', async () => {
      productsRepository.findOneBy.mockResolvedValue(mockProduct);
      productsRepository.remove.mockResolvedValue(mockProduct);

      const result = await service.remove('product-1', 'user-1');

      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException if not found', async () => {
      productsRepository.findOneBy.mockResolvedValue(null);

      await expect(service.remove('product-1', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
