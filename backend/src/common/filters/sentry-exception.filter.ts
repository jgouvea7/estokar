import type { Request } from 'express';
import { BaseExceptionFilter } from '@nestjs/core';
import { HttpException, HttpStatus } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import type { HttpServer } from '@nestjs/common';

export class SentryExceptionFilter extends BaseExceptionFilter {
  constructor(applicationRef?: HttpServer) {
    super(applicationRef);
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>() as Request & {
      user?: { id?: string; email?: string };
    };
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof Error ? exception.message : 'Unhandled exception';

    const stack = exception instanceof Error ? exception.stack : undefined;
    const user = request?.user;

    const errorLog = {
      message: 'HTTP Error',
      errorMessage: message,
      stack,
      method: request?.method,
      url: request?.originalUrl || request?.url,
      status,
      userId: user?.id,
      userEmail: user?.email,
      timestamp: new Date().toISOString(),
    };

    console.error(JSON.stringify(errorLog));

    Sentry.withScope((scope) => {
      if (user?.id || user?.email) {
        scope.setUser({ id: user?.id, email: user?.email });
      }
      scope.setTag('route', request?.originalUrl || request?.url || 'unknown');
      scope.setTag('method', request?.method || 'unknown');
      scope.setExtra('status', status);
      scope.setExtra('requestId', request?.headers?.['x-request-id']);
      Sentry.captureException(exception);
    });

    super.catch(exception, host);
  }
}
