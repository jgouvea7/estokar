describe('buildApiUrl', () => {
  const ORIGINAL_ENV = process.env;

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  async function getClient(apiUrl?: string) {
    if (apiUrl) {
      process.env.NEXT_PUBLIC_API_URL = apiUrl;
    } else {
      delete process.env.NEXT_PUBLIC_API_URL;
    }
    jest.resetModules();
    return import('@/lib/api/client');
  }

  it('should return prefixed path when API_URL is not set', async () => {
    const { buildApiUrl } = await getClient();
    const url = buildApiUrl('/auth/login');
    expect(url).toBe('/auth/login');
  });

  it('should use API_URL with /api prefix when it does not end with /api', async () => {
    const { buildApiUrl } = await getClient('http://localhost:3000');
    const url = buildApiUrl('/auth/login');
    expect(url).toBe('http://localhost:3000/auth/login');
  });

  it('should not duplicate /api when API_URL already ends with /api', async () => {
    const { buildApiUrl } = await getClient('http://localhost:3000/');
    const url = buildApiUrl('/auth/login');
    expect(url).toBe('http://localhost:3000/auth/login');
  });

  it('should strip trailing slash from API_URL', async () => {
    const { buildApiUrl } = await getClient('http://localhost:3000/');
    const url = buildApiUrl('/auth/login');
    expect(url).toBe('http://localhost:3000/auth/login');
  });
});
