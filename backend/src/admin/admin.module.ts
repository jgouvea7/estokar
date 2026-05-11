import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminLog } from './entities/admin-log.entity';
import { User } from '../users/entities/user.entity';
import { Category } from '../categories/entities/category.entity';
import { Product } from '../products/entities/product.entity';
import { AdminSeedService } from './admin-seed.service';
import { RolesGuard } from '../common/guards/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([User, AdminLog, Category, Product])],
  controllers: [AdminController],
  providers: [AdminService, AdminSeedService, RolesGuard],
})
export class AdminModule {}
