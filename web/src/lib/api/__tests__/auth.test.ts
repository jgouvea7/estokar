describe('getGoogleOAuthUrl', () => {
  const ORIGINAL_ENV = process.env;

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  async function getAuth(apiUrl: string) {
    process.env.NEXT_PUBLIC_API_URL = apiUrl;
    jest.resetModules();
    return import('@/lib/api/auth');
  }

  it('should generate a URL with the redirect parameter', async () => {
    const { getGoogleOAuthUrl } = await getAuth('http://localhost:3000/');
    const url = getGoogleOAuthUrl('http://localhost:3000/auth/callback');
    expect(url).toContain('/auth/google');
    expect(url).toContain('redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fcallback');
  });

  it('should return full URL with API base and query params', async () => {
    const { getGoogleOAuthUrl } = await getAuth('http://localhost:3000/');
    const url = getGoogleOAuthUrl('http://localhost:3000/auth/callback');
    expect(url).toBe('http://localhost:3000/auth/google?redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fcallback');
  });
});
