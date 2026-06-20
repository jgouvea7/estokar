import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminLog } from './entities/admin-log.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/enums/user-role.enum';
import { Category } from '../categories/entities/category.entity';
import { Product } from '../products/entities/product.entity';
import { StockMovement } from '../stock-movements/entities/stock-movement.entity';
import { makeUser } from '../common/test/factories';

describe('AdminService', () => {
  let service: AdminService;
  let usersRepository: Record<string, jest.Mock>;
  let adminLogsRepository: Record<string, jest.Mock>;
  let categoriesRepository: Record<string, jest.Mock>;
  let productsRepository: Record<string, jest.Mock>;
  let stockMovementsRepository: Record<string, jest.Mock>;

  const mockUser: User = makeUser({ role: UserRole.FREE, name: 'Test User' });
  const mockAdmin = makeUser({ role: UserRole.ADMIN, name: 'Admin User' });

  beforeEach(async () => {
    usersRepository = {
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    adminLogsRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findAndCount: jest.fn(),
    };

    categoriesRepository = {
      delete: jest.fn(),
      count: jest.fn(),
    };

    productsRepository = {
      delete: jest.fn(),
      count: jest.fn(),
      findAndCount: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    stockMovementsRepository = {
      count: jest.fn(),
      findAndCount: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: getRepositoryToken(User), useValue: usersRepository },
        {
          provide: getRepositoryToken(AdminLog),
          useValue: adminLogsRepository,
        },
        {
          provide: getRepositoryToken(Category),
          useValue: categoriesRepository,
        },
        { provide: getRepositoryToken(Product), useValue: productsRepository },
        {
          provide: getRepositoryToken(StockMovement),
          useValue: stockMovementsRepository,
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listUsers', () => {
    it('should return paginated users with meta', async () => {
      usersRepository.findAndCount.mockResolvedValue([[mockUser], 1]);
      const result = await service.listUsers(1, 10);
      expect(result.data).toEqual([mockUser]);
      expect(result.meta).toMatchObject({ total: 1, page: 1, perPage: 10 });
    });

    it('should return empty list when no users', async () => {
      usersRepository.findAndCount.mockResolvedValue([[], 0]);
      const result = await service.listUsers(1, 10);
      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
    });
  });

  describe('promoteUser', () => {
    it('should promote a non-admin user to admin', async () => {
      usersRepository.findOne
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(mockAdmin);
      usersRepository.save.mockResolvedValue({
        ...mockUser,
        role: UserRole.ADMIN,
      });
      adminLogsRepository.create.mockReturnValue({});
      adminLogsRepository.save.mockResolvedValue({});

      const result = await service.promoteUser(mockAdmin.id, mockUser.id);

      expect(result.role).toBe(UserRole.ADMIN);
      expect(adminLogsRepository.save).toHaveBeenCalled();
    });

    it('should return user unchanged if already admin', async () => {
      usersRepository.findOne.mockResolvedValue(mockAdmin);
      const result = await service.promoteUser(mockAdmin.id, mockAdmin.id);
      expect(result.role).toBe(UserRole.ADMIN);
      expect(adminLogsRepository.save).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      usersRepository.findOne.mockResolvedValue(null);
      await expect(
        service.promoteUser('admin-1', 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeUser', () => {
    it('should delete user and all related data', async () => {
      usersRepository.findOne
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(mockAdmin);
      adminLogsRepository.create.mockReturnValue({});
      adminLogsRepository.save.mockResolvedValue({});

      const result = await service.removeUser(mockAdmin.id, mockUser.id);

      expect(result).toEqual(mockUser);
      expect(productsRepository.delete).toHaveBeenCalledWith({
        userId: mockUser.id,
      });
      expect(categoriesRepository.delete).toHaveBeenCalledWith({
        userId: mockUser.id,
      });
      expect(usersRepository.delete).toHaveBeenCalledWith({ id: mockUser.id });
      expect(adminLogsRepository.save).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if trying to self-delete', async () => {
      await expect(service.removeUser('admin-1', 'admin-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException if target user not found', async () => {
      usersRepository.findOne.mockResolvedValue(null);
      await expect(
        service.removeUser('admin-1', 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStats', () => {
    it('should return total stats', async () => {
      usersRepository.count.mockResolvedValue(10);
      productsRepository.count.mockResolvedValue(50);
      const result = await service.getStats('total');
      expect(result).toEqual({ totalUsers: 10, totalProducts: 50 });
    });

    it('should return monthly stats', async () => {
      usersRepository.count.mockResolvedValue(2);
      productsRepository.count.mockResolvedValue(5);
      const result = await service.getStats('monthly');
      expect(result).toEqual({ totalUsers: 2, totalProducts: 5 });
    });
  });

  describe('getDashboard', () => {
    it('should return dashboard summary', async () => {
      usersRepository.count.mockResolvedValue(10);
      productsRepository.count.mockResolvedValue(50);
      categoriesRepository.count.mockResolvedValue(5);
      stockMovementsRepository.count.mockResolvedValue(200);
      usersRepository.find.mockResolvedValue([mockUser]);

      const queryBuilderMock = {
        getCount: jest.fn().mockResolvedValue(3),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
        where: jest.fn().mockReturnThis(),
      };

      productsRepository.createQueryBuilder.mockReturnValue(queryBuilderMock);

      const result = await service.getDashboard();

      expect(result.totalUsers).toBe(10);
      expect(result.totalProducts).toBe(50);
      expect(result.totalCategories).toBe(5);
      expect(result.totalMovements).toBe(200);
      expect(result.lowStockProducts).toBe(3);
    });
  });

  describe('getLogs', () => {
    it('should return paginated logs', async () => {
      const mockLog = {
        id: '1',
        action: 'PROMOTE_USER',
        actorId: 'a1',
        actorName: 'Admin',
        targetUserId: 'u1',
        targetUserName: 'User',
        createdAt: new Date(),
      };
      adminLogsRepository.findAndCount.mockResolvedValue([[mockLog], 1]);

      const result = await service.getLogs(1, 10);

      expect(result.data).toEqual([mockLog]);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('listAllProducts', () => {
    it('should return paginated products with user info', async () => {
      const mockProduct = {
        id: 'p1',
        name: 'Produto',
        quantity: 10,
        userId: 'u1',
        user: { name: 'User' },
        category: { name: 'Cat' },
        description: '',
        image: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      productsRepository.findAndCount.mockResolvedValue([[mockProduct], 1]);

      const result = await service.listAllProducts(1, 20);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].userName).toBe('User');
      expect(result.meta.total).toBe(1);
    });
  });

  describe('listAllMovements', () => {
    it('should return paginated movements with user info', async () => {
      const mockMovement = {
        id: 'm1',
        productId: 'p1',
        productName: 'Prod',
        type: 'in',
        quantity: 5,
        userId: 'u1',
        user: { name: 'User' },
        createdAt: new Date(),
      };
      stockMovementsRepository.findAndCount.mockResolvedValue([
        [mockMovement],
        1,
      ]);

      const result = await service.listAllMovements(1, 20);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].userName).toBe('User');
      expect(result.meta.total).toBe(1);
    });
  });
});
