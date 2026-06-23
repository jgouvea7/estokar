import { Controller, Get, Res } from '@nestjs/common';
import { register } from 'prom-client';
import type { Response } from 'express';

@Controller('metrics')
export class MetricsController {
  @Get()
  async index(@Res({ passthrough: true }) response: Response) {
    response.header('Content-Type', register.contentType);
    return register.metrics();
  }
}
