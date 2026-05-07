import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product } from './entities/product.entity';
import { User } from '../users/entities/user.entity';
import { Category } from '../categories/entities/category.entity';
import { StockMovement } from '../stock-movements/entities/stock-movement.entity';
import { StockMovementsModule } from '../stock-movements/stock-movements.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, User, Category, StockMovement]),
    StockMovementsModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
