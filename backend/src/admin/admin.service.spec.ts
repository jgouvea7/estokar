import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminLog } from './entities/admin-log.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/enums/user-role.enum';
import { Category } from '../categories/entities/category.entity';
import { Product } from '../products/entities/product.entity';
import { makeUser } from '../common/test/factories';

describe('AdminService', () => {
  let service: AdminService;
  let usersRepository: Record<string, jest.Mock>;
  let adminLogsRepository: Record<string, jest.Mock>;
  let categoriesRepository: Record<string, jest.Mock>;
  let productsRepository: Record<string, jest.Mock>;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const mockUser: User = makeUser({ role: UserRole.FREE });
  const mockAdmin = makeUser({ role: UserRole.ADMIN });

  beforeEach(async () => {
    usersRepository = {
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    };

    adminLogsRepository = {
      create: jest.fn(),
      save: jest.fn(),
    };

    categoriesRepository = {
      delete: jest.fn(),
    };

    productsRepository = {
      delete: jest.fn(),
      count: jest.fn(),
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
      usersRepository.findOne.mockResolvedValue(mockUser);
      usersRepository.save.mockResolvedValue({
        ...mockUser,
        role: UserRole.ADMIN,
      });
      adminLogsRepository.create.mockReturnValue({});
      adminLogsRepository.save.mockResolvedValue({});

      const result = await service.promoteUser('admin-1', mockUser.id);

      expect(result.role).toBe(UserRole.ADMIN);
      expect(adminLogsRepository.save).toHaveBeenCalled();
    });

    it('should return user unchanged if already admin', async () => {
      usersRepository.findOne.mockResolvedValue(mockAdmin);

      const result = await service.promoteUser('admin-1', mockAdmin.id);

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
      usersRepository.findOne.mockResolvedValue(mockUser);
      adminLogsRepository.create.mockReturnValue({});
      adminLogsRepository.save.mockResolvedValue({});

      const result = await service.removeUser('admin-1', mockUser.id);

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
      expect(usersRepository.count).toHaveBeenCalledWith(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        expect.objectContaining({ where: { createdAt: expect.any(Object) } }),
      );
    });
  });
});
