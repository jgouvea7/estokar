import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  ParseUUIDPipe,
  UseGuards,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Throttle({ default: { limit: 30, ttl: 60000 } })
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  getDashboard() {
    return this.adminService.getDashboard();
  }

  @Get('users')
  listUsers(
    @Query('page') page = 1,
    @Query('perPage') perPage = 10,
    @Query('search') search?: string,
  ) {
    const safePage = Math.max(Number(page), 1);
    const safePerPage = Math.min(Math.max(Number(perPage), 1), 100);
    return this.adminService.listUsers(safePage, safePerPage, search);
  }

  @Get('users/:id')
  getUserDetail(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getUserDetail(id);
  }

  @Patch('users/:id/promote')
  promoteUser(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') actorId: string,
  ) {
    return this.adminService.promoteUser(actorId, id);
  }

  @Delete('users/:id')
  removeUser(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') actorId: string,
  ) {
    return this.adminService.removeUser(actorId, id);
  }

  @Get('logs')
  getLogs(@Query('page') page = 1, @Query('perPage') perPage = 10) {
    const safePage = Math.max(Number(page), 1);
    const safePerPage = Math.min(Math.max(Number(perPage), 1), 100);
    return this.adminService.getLogs(safePage, safePerPage);
  }

  @Get('products')
  listAllProducts(
    @Query('page') page = 1,
    @Query('perPage') perPage = 20,
    @Query('search') search?: string,
  ) {
    const safePage = Math.max(Number(page), 1);
    const safePerPage = Math.min(Math.max(Number(perPage), 1), 100);
    return this.adminService.listAllProducts(safePage, safePerPage, search);
  }

  @Get('movements')
  listAllMovements(@Query('page') page = 1, @Query('perPage') perPage = 20) {
    const safePage = Math.max(Number(page), 1);
    const safePerPage = Math.min(Math.max(Number(perPage), 1), 100);
    return this.adminService.listAllMovements(safePage, safePerPage);
  }
}
