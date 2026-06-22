import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { makeUser } from '../common/test/factories';
import { UserRole } from '../users/enums/user-role.enum';

describe('AdminController', () => {
  let controller: AdminController;
  let adminService: Record<string, jest.Mock>;

  const mockUser = makeUser({ role: UserRole.ADMIN });

  beforeEach(async () => {
    adminService = {
      listUsers: jest.fn(),
      getUserDetail: jest.fn(),
      promoteUser: jest.fn(),
      removeUser: jest.fn(),
      getStats: jest.fn(),
      getDashboard: jest.fn(),
      getLogs: jest.fn(),
      listAllProducts: jest.fn(),
      listAllMovements: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [{ provide: AdminService, useValue: adminService }],
    }).compile();

    controller = module.get<AdminController>(AdminController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listUsers', () => {
    it('should call listUsers with safe page and perPage', async () => {
      const paginatedResult = {
        data: [mockUser],
        meta: { total: 1, page: 1, perPage: 10 },
      };
      adminService.listUsers.mockResolvedValue(paginatedResult);
      const result = await controller.listUsers(1, 10);
      expect(adminService.listUsers).toHaveBeenCalledWith(1, 10, undefined);
      expect(result).toEqual(paginatedResult);
    });

    it('should pass search term to service', async () => {
      adminService.listUsers.mockResolvedValue({
        data: [mockUser],
        meta: { total: 1, page: 1, perPage: 10 },
      });
      await controller.listUsers(1, 10, 'john');
      expect(adminService.listUsers).toHaveBeenCalledWith(1, 10, 'john');
    });

    it('should clamp perPage to max 100', async () => {
      await controller.listUsers(1, 500);
      expect(adminService.listUsers).toHaveBeenCalledWith(1, 100, undefined);
    });

    it('should ensure page is at least 1', async () => {
      await controller.listUsers(0, 10);
      expect(adminService.listUsers).toHaveBeenCalledWith(1, 10, undefined);
    });
  });

  describe('getUserDetail', () => {
    it('should call getUserDetail with id', async () => {
      adminService.getUserDetail.mockResolvedValue(mockUser);
      const result = await controller.getUserDetail('user-1');
      expect(adminService.getUserDetail).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(mockUser);
    });
  });

  describe('promoteUser', () => {
    it('should call promoteUser', async () => {
      adminService.promoteUser.mockResolvedValue(mockUser);
      const result = await controller.promoteUser('user-2', 'admin-1');
      expect(adminService.promoteUser).toHaveBeenCalledWith(
        'admin-1',
        'user-2',
      );
      expect(result).toEqual(mockUser);
    });
  });

  describe('removeUser', () => {
    it('should call removeUser', async () => {
      adminService.removeUser.mockResolvedValue(mockUser);
      const result = await controller.removeUser('user-2', 'admin-1');
      expect(adminService.removeUser).toHaveBeenCalledWith('admin-1', 'user-2');
      expect(result).toEqual(mockUser);
    });
  });

  describe('getDashboard', () => {
    it('should call getDashboard', async () => {
      adminService.getDashboard.mockResolvedValue({
        totalUsers: 10,
        totalProducts: 50,
      });
      const result = await controller.getDashboard();
      expect(adminService.getDashboard).toHaveBeenCalled();
      expect(result.totalUsers).toBe(10);
    });
  });

  describe('getLogs', () => {
    it('should call getLogs with safe pagination', async () => {
      adminService.getLogs.mockResolvedValue({
        data: [],
        meta: { total: 0, page: 1, perPage: 10 },
      });
      await controller.getLogs(1, 10);
      expect(adminService.getLogs).toHaveBeenCalledWith(1, 10);
    });
  });

  describe('listAllProducts', () => {
    it('should call listAllProducts with params', async () => {
      adminService.listAllProducts.mockResolvedValue({
        data: [],
        meta: { total: 0, page: 1, perPage: 20 },
      });
      await controller.listAllProducts(1, 20);
      expect(adminService.listAllProducts).toHaveBeenCalledWith(
        1,
        20,
        undefined,
      );
    });
  });

  describe('listAllMovements', () => {
    it('should call listAllMovements', async () => {
      adminService.listAllMovements.mockResolvedValue({
        data: [],
        meta: { total: 0, page: 1, perPage: 20 },
      });
      await controller.listAllMovements(1, 20);
      expect(adminService.listAllMovements).toHaveBeenCalledWith(1, 20);
    });
  });
});
