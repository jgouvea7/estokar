import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ExportService } from './export.service';

@Controller('export')
@UseGuards(JwtAuthGuard)
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get('products/csv')
  async exportProductsCsv(
    @CurrentUser('id') userId: string,
    @Res() res: Response,
  ) {
    const { csv, filename } =
      await this.exportService.exportProductsCsv(userId);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }

  @Get('stock-movements/csv')
  async exportStockMovementsCsv(
    @CurrentUser('id') userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Res() res?: Response,
  ) {
    const { csv, filename } = await this.exportService.exportStockMovementsCsv(
      userId,
      startDate,
      endDate,
    );

    res!.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res!.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res!.send(csv);
  }

  @Get('dashboard/csv')
  async exportDashboardCsv(
    @CurrentUser('id') userId: string,
    @Res() res: Response,
  ) {
    const { csv, filename } =
      await this.exportService.exportDashboardCsv(userId);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }
}
