import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, ILike, Repository } from 'typeorm';
import { AdminLog, AdminLogAction } from './entities/admin-log.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/enums/user-role.enum';
import { Category } from '../categories/entities/category.entity';
import { Product } from '../products/entities/product.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(AdminLog)
    private readonly adminLogsRepository: Repository<AdminLog>,
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  async listUsers(page = 1, perPage = 10, search?: string) {
    const where = search
      ? [{ name: ILike(`%${search}%`) }, { email: ILike(`%${search}%`) }]
      : undefined;

    const [users, total] = await this.usersRepository.findAndCount({
      select: ['id', 'name', 'email', 'role', 'createdAt'],
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * perPage,
      take: perPage,
    });

    return {
      data: users,
      meta: {
        total,
        page,
        perPage,
        lastPage: Math.ceil(total / perPage),
      },
    };
  }

  async promoteUser(actorId: string, targetUserId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: targetUserId },
      select: ['id', 'name', 'email', 'role'],
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    if (user.role !== UserRole.ADMIN) {
      user.role = UserRole.ADMIN;
      await this.usersRepository.save({ ...user, updatedAt: new Date() });
      await this.createAdminLog(
        actorId,
        targetUserId,
        AdminLogAction.PROMOTE_USER,
      );
    }

    return user;
  }

  async removeUser(actorId: string, targetUserId: string) {
    if (actorId === targetUserId) {
      throw new ForbiddenException(
        'Não é permitido remover a própria conta admin.',
      );
    }

    const user = await this.usersRepository.findOne({
      where: { id: targetUserId },
      select: ['id', 'name', 'email', 'role'],
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    await this.productsRepository.delete({ userId: targetUserId });
    await this.categoriesRepository.delete({ userId: targetUserId });
    await this.usersRepository.delete({ id: targetUserId });

    await this.createAdminLog(
      actorId,
      targetUserId,
      AdminLogAction.DELETE_USER,
    );

    return user;
  }

  async getStats(period: 'total' | 'monthly' = 'total') {
    if (period === 'monthly') {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfNextMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        1,
      );
      const dateFilter = { createdAt: Between(startOfMonth, startOfNextMonth) };

      const [totalUsers, totalProducts] = await Promise.all([
        this.usersRepository.count({ where: dateFilter }),
        this.productsRepository.count({ where: dateFilter }),
      ]);

      return {
        totalUsers,
        totalProducts,
      };
    }

    const [totalUsers, totalProducts] = await Promise.all([
      this.usersRepository.count(),
      this.productsRepository.count(),
    ]);

    return {
      totalUsers,
      totalProducts,
    };
  }

  private async createAdminLog(
    actorId: string,
    targetUserId: string,
    action: AdminLogAction,
  ) {
    const log = this.adminLogsRepository.create({
      actorId,
      targetUserId,
      action,
    });

    await this.adminLogsRepository.save(log);
  }
}
