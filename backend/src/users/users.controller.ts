import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // GET /users/me — detalhe do usuário autenticado
  @Get('me')
  findMe(@CurrentUser('id') requesterId: string) {
    return this.usersService.findOne(requesterId);
  }

  // GET /users/:id — detalhe do usuário (apenas o próprio)
  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') requesterId: string,
  ) {
    if (id !== requesterId) {
      throw new ForbiddenException(
        'Você não tem permissão para acessar os dados de outro usuário.',
      );
    }
    return this.usersService.findOne(id);
  }

  // PATCH /users/:id — atualiza apenas o próprio usuário
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser('id') requesterId: string,
  ) {
    return this.usersService.update(id, updateUserDto, requesterId);
  }

  // DELETE /users/me — remove a conta autenticada
  @Delete('me')
  removeCurrentUser(@CurrentUser('id') requesterId: string) {
    return this.usersService.remove(requesterId, requesterId);
  }

  // DELETE /users/:id — remove apenas o próprio usuário
  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') requesterId: string,
  ) {
    return this.usersService.remove(id, requesterId);
  }
}
