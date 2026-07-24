import { Test, TestingModule } from '@nestjs/testing';
import { StockMovementsController } from './stock-movements.controller';
import { StockMovementsService } from './stock-movements.service';
import { makeStockMovement } from '../common/test/factories';

describe('StockMovementsController', () => {
  let controller: StockMovementsController;
  let stockMovementsService: Record<string, jest.Mock>;

  const mockMovement = makeStockMovement();

  beforeEach(async () => {
    stockMovementsService = {
      findAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StockMovementsController],
      providers: [
        { provide: StockMovementsService, useValue: stockMovementsService },
      ],
    }).compile();

    controller = module.get<StockMovementsController>(StockMovementsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated movements for user with default params', async () => {
      stockMovementsService.findAll.mockResolvedValue({
        data: [mockMovement],
        total: 1,
        page: 1,
        limit: 100,
      });

      const result = await controller.findAll('user-1');

      expect(stockMovementsService.findAll).toHaveBeenCalledWith(
        'user-1',
        1,
        100,
        undefined,
      );
      expect(result).toEqual({
        data: [mockMovement],
        total: 1,
        page: 1,
        limit: 100,
      });
    });

    it('should pass page and limit query params', async () => {
      stockMovementsService.findAll.mockResolvedValue({
        data: [],
        total: 0,
        page: 2,
        limit: 50,
      });

      await controller.findAll('user-1', '2', '50');

      expect(stockMovementsService.findAll).toHaveBeenCalledWith(
        'user-1',
        2,
        50,
        undefined,
      );
    });
  });
});
