import { Controller, Get, Headers, Res, UnauthorizedException } from '@nestjs/common';
import { register } from 'prom-client';
import type { Response } from 'express';

@Controller('metrics')
export class MetricsController {
  @Get()
  async index(
    @Headers('authorization') auth: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    const expected = process.env.PROMETHEUS_SCRAPE_TOKEN;
    if (expected) {
      const token = auth?.replace(/^Bearer\s+/i, '') ?? '';
      if (token !== expected) {
        throw new UnauthorizedException();
      }
    }
    response.header('Content-Type', register.contentType);
    return register.metrics();
  }
}
