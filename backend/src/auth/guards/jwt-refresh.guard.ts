import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {
  handleRequest<TUser = any>(
    err: any,
    user: any,
    _info: any,
    _context: any,
    _status?: any,
  ) {
    if (err || !user) {
      throw (
        err ||
        new UnauthorizedException(
          'Refresh token inválido ou expirado. Faça login novamente.',
        )
      );
    }
    return user as TUser;
  }
}
