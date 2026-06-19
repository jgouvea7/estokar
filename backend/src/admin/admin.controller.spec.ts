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
      promoteUser: jest.fn(),
      removeUser: jest.fn(),
      getStats: jest.fn(),
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
      const paginatedResult = {
        data: [mockUser],
        meta: { total: 1, page: 1, perPage: 10 },
      };
      adminService.listUsers.mockResolvedValue(paginatedResult);

      const result = await controller.listUsers(1, 10, 'john');

      expect(adminService.listUsers).toHaveBeenCalledWith(1, 10, 'john');
      expect(result).toEqual(paginatedResult);
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

  describe('getStats', () => {
    it('should normalize period to total by default', async () => {
      adminService.getStats.mockResolvedValue({
        totalUsers: 10,
        totalProducts: 50,
      });

      await controller.getStats();

      expect(adminService.getStats).toHaveBeenCalledWith('total');
    });

    it('should pass monthly period', async () => {
      await controller.getStats('monthly');

      expect(adminService.getStats).toHaveBeenCalledWith('monthly');
    });
  });
});
