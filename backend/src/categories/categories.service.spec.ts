import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { Category } from './entities/category.entity';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { makeUser, makeCategory } from '../common/test/factories';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let categoriesRepository: Record<string, jest.Mock>;
  let productsRepository: Record<string, jest.Mock>;
  let usersRepository: Record<string, jest.Mock>;

  const mockUser = makeUser();
  const mockCategory = makeCategory();

  beforeEach(async () => {
    categoriesRepository = {
      find: jest.fn(),
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    productsRepository = {
      update: jest.fn(),
    };

    usersRepository = {
      findOneBy: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: getRepositoryToken(Category),
          useValue: categoriesRepository,
        },
        { provide: getRepositoryToken(Product), useValue: productsRepository },
        { provide: getRepositoryToken(User), useValue: usersRepository },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return categories ordered by name ASC', async () => {
      categoriesRepository.find.mockResolvedValue([mockCategory]);

      const result = await service.findAll('user-1');

      expect(result).toEqual([mockCategory]);
      expect(categoriesRepository.find).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        order: { name: 'ASC' },
      });
    });
  });

  describe('create', () => {
    const dto = { name: '  New Category  ' };

    it('should create a category successfully', async () => {
      usersRepository.findOneBy.mockResolvedValue(mockUser);
      categoriesRepository.findOneBy.mockResolvedValue(null);
      categoriesRepository.create.mockReturnValue(mockCategory);
      categoriesRepository.save.mockResolvedValue(mockCategory);

      const result = await service.create(dto, 'user-1');

      expect(result).toEqual(mockCategory);
      expect(categoriesRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'New Category' }),
      );
    });

    it('should throw NotFoundException if user does not exist', async () => {
      usersRepository.findOneBy.mockResolvedValue(null);

      await expect(service.create(dto, 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if category name already exists', async () => {
      usersRepository.findOneBy.mockResolvedValue(mockUser);
      categoriesRepository.findOneBy.mockResolvedValue(mockCategory);

      await expect(service.create(dto, 'user-1')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('update', () => {
    it('should update category name', async () => {
      categoriesRepository.findOneBy
        .mockResolvedValueOnce(mockCategory)
        .mockResolvedValueOnce(null);
      categoriesRepository.save.mockResolvedValue({
        ...mockCategory,
        name: 'Updated Category',
      });

      const result = await service.update(
        mockCategory.id,
        { name: 'Updated Category' },
        'user-1',
      );

      expect(result.name).toBe('Updated Category');
    });

    it('should throw NotFoundException if category not found', async () => {
      categoriesRepository.findOneBy.mockResolvedValue(null);

      await expect(
        service.update('nonexistent-id', { name: 'New Name' }, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if new name already used by another category', async () => {
      const anotherCategory = makeCategory();
      categoriesRepository.findOneBy
        .mockResolvedValueOnce(mockCategory)
        .mockResolvedValueOnce(anotherCategory);

      await expect(
        service.update(mockCategory.id, { name: 'Existing Name' }, 'user-1'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should remove category and nullify product references', async () => {
      categoriesRepository.findOneBy.mockResolvedValue(mockCategory);
      categoriesRepository.remove.mockResolvedValue(mockCategory);

      await service.remove(mockCategory.id, 'user-1');

      expect(productsRepository.update).toHaveBeenCalledWith(
        { categoryId: mockCategory.id, userId: 'user-1' },
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        { categoryId: null, updatedAt: expect.any(Date) },
      );
      expect(categoriesRepository.remove).toHaveBeenCalledWith(mockCategory);
    });

    it('should throw NotFoundException if category not found', async () => {
      categoriesRepository.findOneBy.mockResolvedValue(null);

      await expect(service.remove('nonexistent-id', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
