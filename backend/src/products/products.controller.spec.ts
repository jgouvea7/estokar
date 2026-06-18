import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { makeProduct } from '../common/test/factories';

describe('ProductsController', () => {
  let controller: ProductsController;
  let productsService: Record<string, jest.Mock>;

  const mockProduct = makeProduct();

  beforeEach(async () => {
    productsService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      getDetails: jest.fn(),
      getDashboard: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [{ provide: ProductsService, useValue: productsService }],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all products for requester', async () => {
      productsService.findAll.mockResolvedValue([mockProduct]);

      const result = await controller.findAll('user-1');

      expect(productsService.findAll).toHaveBeenCalledWith('user-1');
      expect(result).toEqual([mockProduct]);
    });
  });

  describe('findOne', () => {
    it('should return a product', async () => {
      productsService.findOne.mockResolvedValue(mockProduct);

      const result = await controller.findOne('product-1', 'user-1');

      expect(productsService.findOne).toHaveBeenCalledWith(
        'product-1',
        'user-1',
      );
      expect(result).toEqual(mockProduct);
    });
  });

  describe('getDetails', () => {
    it('should return product details', async () => {
      const details = { product: mockProduct, dashboard: {} };
      productsService.getDetails.mockResolvedValue(details);

      const result = await controller.getDetails('product-1', 'user-1');

      expect(productsService.getDetails).toHaveBeenCalledWith(
        'product-1',
        'user-1',
      );
      expect(result).toEqual(details);
    });
  });

  describe('getDashboard', () => {
    it('should return product dashboard', async () => {
      const dashboard = {
        forecast: {},
        product: {},
        recentMovements: [],
        summary: {},
      };
      productsService.getDashboard.mockResolvedValue(dashboard);

      const result = await controller.getDashboard('product-1', 'user-1');

      expect(productsService.getDashboard).toHaveBeenCalledWith(
        'product-1',
        'user-1',
      );
      expect(result).toEqual(dashboard);
    });
  });

  describe('create', () => {
    it('should create a product', async () => {
      const dto = { name: 'New', description: 'Desc', quantity: 10, image: '' };
      productsService.create.mockResolvedValue(mockProduct);

      const result = await controller.create(dto, 'user-1');

      expect(productsService.create).toHaveBeenCalledWith(dto, 'user-1');
      expect(result).toEqual(mockProduct);
    });
  });

  describe('update', () => {
    it('should update a product', async () => {
      const dto = { name: 'Updated' };
      productsService.update.mockResolvedValue({
        ...mockProduct,
        name: 'Updated',
      });

      const result = await controller.update('product-1', dto, 'user-1');

      expect(productsService.update).toHaveBeenCalledWith(
        'product-1',
        dto,
        'user-1',
      );
      expect(result.name).toBe('Updated');
    });
  });

  describe('remove', () => {
    it('should remove a product', async () => {
      productsService.remove.mockResolvedValue(mockProduct);

      const result = await controller.remove('product-1', 'user-1');

      expect(productsService.remove).toHaveBeenCalledWith(
        'product-1',
        'user-1',
      );
      expect(result).toEqual(mockProduct);
    });
  });
});
