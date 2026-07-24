import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { StockMovementsService } from './stock-movements.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('stock-movements')
@UseGuards(JwtAuthGuard)
export class StockMovementsController {
  constructor(private readonly stockMovementsService: StockMovementsService) {}

  @Get()
  findAll(
    @CurrentUser('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('period') period?: string,
  ) {
    return this.stockMovementsService.findAll(
      userId,
      page ? Math.max(1, Number(page)) : 1,
      limit ? Math.min(200, Math.max(1, Number(limit))) : 100,
      period,
    );
  }
}
