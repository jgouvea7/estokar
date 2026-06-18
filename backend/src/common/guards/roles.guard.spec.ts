import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { UserRole } from '../../users/enums/user-role.enum';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  function mockContext(role?: UserRole): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user: role ? { role } : {} }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  }

  describe('canActivate', () => {
    it('should return true when no roles are required', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const result = guard.canActivate(mockContext(UserRole.ADMIN));

      expect(result).toBe(true);
    });

    it('should return true when user has required role', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([UserRole.ADMIN]);

      const result = guard.canActivate(mockContext(UserRole.ADMIN));

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user does not have required role', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([UserRole.ADMIN]);

      expect(() => guard.canActivate(mockContext(UserRole.FREE))).toThrow(
        ForbiddenException,
      );
    });
  });
});
