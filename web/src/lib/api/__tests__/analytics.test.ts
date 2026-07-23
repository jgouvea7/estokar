import { apiRequest } from '../client';

jest.mock('../client', () => ({
  apiRequest: jest.fn(),
}));

describe('getAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  async function getAnalyticsModule() {
    return import('../analytics');
  }

  it('should call apiRequest with monthly period', async () => {
    const { getAnalytics } = await getAnalyticsModule();
    const mockData = { summary: { totalStock: 100, totalProducts: 10 } };

    (apiRequest as jest.Mock).mockResolvedValue(mockData);

    const result = await getAnalytics('test-token', 'monthly');

    expect(apiRequest).toHaveBeenCalledWith('/analytics?period=monthly', {
      method: 'GET',
      accessToken: 'test-token',
    });
    expect(result).toEqual(mockData);
  });

  it('should call apiRequest with weekly period', async () => {
    const { getAnalytics } = await getAnalyticsModule();

    (apiRequest as jest.Mock).mockResolvedValue({});

    await getAnalytics('test-token', 'weekly');

    expect(apiRequest).toHaveBeenCalledWith('/analytics?period=weekly', {
      method: 'GET',
      accessToken: 'test-token',
    });
  });

  it('should call apiRequest with annual period', async () => {
    const { getAnalytics } = await getAnalyticsModule();

    (apiRequest as jest.Mock).mockResolvedValue({});

    await getAnalytics('test-token', 'annual');

    expect(apiRequest).toHaveBeenCalledWith('/analytics?period=annual', {
      method: 'GET',
      accessToken: 'test-token',
    });
  });
});
