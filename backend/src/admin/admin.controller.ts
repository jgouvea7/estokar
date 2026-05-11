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

  @Get('users')
  listUsers(@Query('page') page = 1, @Query('perPage') perPage = 10) {
    return this.adminService.listUsers(Number(page), Number(perPage));
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

  @Get('stats')
  getStats(@Query('period') period?: 'total' | 'monthly') {
    const normalizedPeriod = period === 'monthly' ? 'monthly' : 'total';
    return this.adminService.getStats(normalizedPeriod);
  }
}
