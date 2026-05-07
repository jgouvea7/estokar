import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../products/entities/product.entity';
import { StockMovement } from '../stock-movements/entities/stock-movement.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, StockMovement, User])],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}