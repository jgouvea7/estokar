import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { Product } from '../products/entities/product.entity';
import { StockMovement } from '../stock-movements/entities/stock-movement.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, StockMovement])],
  controllers: [ExportController],
  providers: [ExportService],
})
export class ExportModule {}
