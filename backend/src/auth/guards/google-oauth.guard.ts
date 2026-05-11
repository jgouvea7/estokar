import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class GoogleOAuthGuard extends AuthGuard('google') {
  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const redirectUri =
      typeof request.query.redirect_uri === 'string'
        ? request.query.redirect_uri
        : undefined;

    if (!redirectUri) {
      return undefined;
    }

    return {
      accessType: 'offline',
      prompt: 'consent',
      state: redirectUri,
    };
  }
}
