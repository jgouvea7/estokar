import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

describe('DashboardController', () => {
  let controller: DashboardController;
  let dashboardService: Record<string, jest.Mock>;

  const mockDashboard = {
    topSellingProducts: [],
    lowStockProducts: [],
    recentMovements: [],
    forecastedProducts: [],
    alerts: [],
    topCategories: [],
    weeklySales: {},
    totalStock: 0,
    catalogAvailability: 0,
    dailyBalance: 0,
  };

  beforeEach(async () => {
    dashboardService = {
      getDashboard: jest.fn(),
      getAlerts: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [{ provide: DashboardService, useValue: dashboardService }],
    }).compile();

    controller = module.get<DashboardController>(DashboardController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboard', () => {
    it('should return dashboard data', async () => {
      dashboardService.getDashboard.mockResolvedValue(mockDashboard);

      const result = await controller.getDashboard('user-1');

      expect(dashboardService.getDashboard).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(mockDashboard);
    });
  });

  describe('getAlerts', () => {
    it('should return alerts', async () => {
      dashboardService.getAlerts.mockResolvedValue([]);

      const result = await controller.getAlerts('user-1');

      expect(dashboardService.getAlerts).toHaveBeenCalledWith('user-1');
      expect(result).toEqual([]);
    });
  });
});
