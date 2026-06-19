import { UnauthorizedException } from '@nestjs/common';
import { JwtRefreshGuard } from './jwt-refresh.guard';

describe('JwtRefreshGuard', () => {
  let guard: JwtRefreshGuard;

  beforeEach(() => {
    guard = new JwtRefreshGuard();
  });

  describe('handleRequest', () => {
    it('should return user when no error and user exists', () => {
      const user = { id: 'user-1', refreshToken: 'token' };

      const result = guard.handleRequest<{ id: string; refreshToken: string }>(
        null,
        user,
        undefined,
        undefined,
      );

      expect(result).toEqual(user);
    });

    it('should throw the original error when error is present', () => {
      const err = new Error('err');
      expect(() => {
        guard.handleRequest(err, null, undefined, undefined);
      }).toThrow(err);
    });

    it('should throw UnauthorizedException when user is falsy and no error', () => {
      expect(() => {
        guard.handleRequest(null, null, undefined, undefined);
      }).toThrow(UnauthorizedException);
    });
  });
});
