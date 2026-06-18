import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { makeCategory } from '../common/test/factories';

describe('CategoriesController', () => {
  let controller: CategoriesController;
  let categoriesService: Record<string, jest.Mock>;

  const mockCategory = makeCategory();

  beforeEach(async () => {
    categoriesService = {
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [{ provide: CategoriesService, useValue: categoriesService }],
    }).compile();

    controller = module.get<CategoriesController>(CategoriesController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return categories for requester', async () => {
      categoriesService.findAll.mockResolvedValue([mockCategory]);

      const result = await controller.findAll('user-1');

      expect(categoriesService.findAll).toHaveBeenCalledWith('user-1');
      expect(result).toEqual([mockCategory]);
    });
  });

  describe('create', () => {
    it('should create a category', async () => {
      const dto = { name: 'New Category' };
      categoriesService.create.mockResolvedValue(mockCategory);

      const result = await controller.create(dto, 'user-1');

      expect(categoriesService.create).toHaveBeenCalledWith(dto, 'user-1');
      expect(result).toEqual(mockCategory);
    });
  });

  describe('update', () => {
    it('should update a category', async () => {
      const dto = { name: 'Updated' };
      categoriesService.update.mockResolvedValue({
        ...mockCategory,
        name: 'Updated',
      });

      const result = await controller.update(mockCategory.id, dto, 'user-1');

      expect(categoriesService.update).toHaveBeenCalledWith(
        mockCategory.id,
        dto,
        'user-1',
      );
      expect(result.name).toBe('Updated');
    });
  });

  describe('remove', () => {
    it('should remove a category', async () => {
      await controller.remove(mockCategory.id, 'user-1');

      expect(categoriesService.remove).toHaveBeenCalledWith(
        mockCategory.id,
        'user-1',
      );
    });
  });
});
