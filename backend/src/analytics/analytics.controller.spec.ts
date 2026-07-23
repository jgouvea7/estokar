import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let analyticsService: Record<string, jest.Mock>;

  const mockAnalyticsData = {
    summary: {
      totalStock: 100,
      totalProducts: 10,
      totalMovements: 50,
      totalEntries: 200,
      totalOutputs: 150,
      catalogAvailability: 80,
      avgOutputPerMovement: 3,
    },
    timeline: [],
    dailyBalance: [],
    topSelling: [],
    lowestSelling: [],
    categoryPerformance: [],
    weekDayDistribution: [],
    stockRanges: [],
    forecast: [],
  };

  beforeEach(async () => {
    analyticsService = {
      getAnalytics: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [{ provide: AnalyticsService, useValue: analyticsService }],
    }).compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAnalytics', () => {
    it('should call service with userId and period', async () => {
      analyticsService.getAnalytics.mockResolvedValue(mockAnalyticsData);

      const result = await controller.getAnalytics('user-1', 'monthly');

      expect(analyticsService.getAnalytics).toHaveBeenCalledWith(
        'user-1',
        'monthly',
      );
      expect(result).toEqual(mockAnalyticsData);
    });

    it('should pass undefined period when not provided', async () => {
      analyticsService.getAnalytics.mockResolvedValue(mockAnalyticsData);

      const result = await controller.getAnalytics('user-1', undefined);

      expect(analyticsService.getAnalytics).toHaveBeenCalledWith(
        'user-1',
        undefined,
      );
      expect(result).toEqual(mockAnalyticsData);
    });

    it('should pass weekly period', async () => {
      analyticsService.getAnalytics.mockResolvedValue(mockAnalyticsData);

      const result = await controller.getAnalytics('user-1', 'weekly');

      expect(analyticsService.getAnalytics).toHaveBeenCalledWith(
        'user-1',
        'weekly',
      );
      expect(result).toEqual(mockAnalyticsData);
    });

    it('should pass annual period', async () => {
      analyticsService.getAnalytics.mockResolvedValue(mockAnalyticsData);

      const result = await controller.getAnalytics('user-1', 'annual');

      expect(analyticsService.getAnalytics).toHaveBeenCalledWith(
        'user-1',
        'annual',
      );
      expect(result).toEqual(mockAnalyticsData);
    });
  });
});
