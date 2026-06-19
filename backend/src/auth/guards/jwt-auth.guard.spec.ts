import { UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(() => {
    guard = new JwtAuthGuard();
  });

  describe('handleRequest', () => {
    it('should return user when no error and user exists', () => {
      const user = { id: 'user-1', email: 'test@example.com' };

      const result = guard.handleRequest<{ id: string; email: string }>(
        null,
        user,
        undefined,
        undefined,
      );

      expect(result).toEqual(user);
    });

    it('should throw the original error when error is present', () => {
      const err = new Error('Token expired');

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
