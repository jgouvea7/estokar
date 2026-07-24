import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  getDashboard(@CurrentUser('id') userId: string) {
    return this.dashboardService.getDashboard(userId);
  }

  @Get('alerts')
  getAlerts(@CurrentUser('id') userId: string) {
    return this.dashboardService.getAlerts(userId);
  }

  @Get('timeline')
  getTimeline(
    @CurrentUser('id') userId: string,
    @Query('period') period?: string,
  ) {
    return this.dashboardService.getTimeline(userId, period);
  }

  @Get('categories-stock')
  getCategoriesStock(@CurrentUser('id') userId: string) {
    return this.dashboardService.getCategoriesStock(userId);
  }
}
