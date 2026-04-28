import type { Request, Response } from 'express';
import { Injectable, NestMiddleware } from '@nestjs/common';

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: () => void) {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      const log = {
        message: 'HTTP Request',
        method: req.method,
        url: req.originalUrl || req.url,
        status: res.statusCode,
        duration,
        timestamp: new Date().toISOString(),
      };

      console.log(JSON.stringify(log));
    });

    next();
  }
}
