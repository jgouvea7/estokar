import { useAuthStore } from '@/store/auth-store';

const mockSession = {
  accessToken: 'test-token',
  refreshToken: 'test-refresh',
  user: {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'FREE' as const,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
};

beforeEach(() => {
  useAuthStore.setState({ session: null });
});

describe('auth-store', () => {
  it('should start with null session', () => {
    const state = useAuthStore.getState();
    expect(state.session).toBeNull();
  });

  it('should set session', () => {
    useAuthStore.getState().setSession(mockSession);
    const state = useAuthStore.getState();
    expect(state.session).toEqual(mockSession);
  });

  it('should clear session', () => {
    useAuthStore.getState().setSession(mockSession);
    useAuthStore.getState().clearSession();
    const state = useAuthStore.getState();
    expect(state.session).toBeNull();
  });
});
