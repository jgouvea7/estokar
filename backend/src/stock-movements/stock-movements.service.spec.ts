import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { StockMovementsService } from './stock-movements.service';
import {
  StockMovement,
  StockMovementType,
} from './entities/stock-movement.entity';
import { makeStockMovement } from '../common/test/factories';

describe('StockMovementsService', () => {
  let service: StockMovementsService;
  let repository: Record<string, jest.Mock>;

  const mockMovement = makeStockMovement();

  beforeEach(async () => {
    repository = {
      findAndCount: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockMovementsService,
        { provide: getRepositoryToken(StockMovement), useValue: repository },
      ],
    }).compile();

    service = module.get<StockMovementsService>(StockMovementsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated movements', async () => {
      repository.findAndCount.mockResolvedValue([[mockMovement], 1]);

      const result = await service.findAll('user-1', 1, 100);

      expect(result).toEqual({
        data: [mockMovement],
        total: 1,
        page: 1,
        limit: 100,
      });
      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 100,
      });
    });

    it('should return empty array when no movements', async () => {
      repository.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAll('user-1', 1, 100);

      expect(result).toEqual({
        data: [],
        total: 0,
        page: 1,
        limit: 100,
      });
    });
  });

  describe('create', () => {
    it('should create a stock movement', async () => {
      const data = {
        productId: 'product-1',
        productName: 'Test Product',
        type: StockMovementType.IN,
        quantity: 10,
        userId: 'user-1',
      };

      repository.create.mockReturnValue(mockMovement);
      repository.save.mockResolvedValue(mockMovement);

      const result = await service.create(data);

      expect(result).toEqual(mockMovement);
      expect(repository.create).toHaveBeenCalledWith(data);
      expect(repository.save).toHaveBeenCalledWith(mockMovement);
    });
  });
});
