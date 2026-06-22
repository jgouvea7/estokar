import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { AdminLog, AdminLogAction } from './entities/admin-log.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/enums/user-role.enum';
import { Category } from '../categories/entities/category.entity';
import { Product } from '../products/entities/product.entity';
import { StockMovement } from '../stock-movements/entities/stock-movement.entity';

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
    @InjectRepository(StockMovement)
    private readonly stockMovementsRepository: Repository<StockMovement>,
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
      meta: { total, page, perPage, lastPage: Math.ceil(total / perPage) },
    };
  }

  async getUserDetail(userId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      select: [
        'id',
        'name',
        'email',
        'role',
        'createdAt',
        'updatedAt',
        'alertDaysBefore',
      ],
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const [productAgg, categoryCount, movementCount] = await Promise.all([
      this.productsRepository
        .createQueryBuilder('product')
        .select('COUNT(*)', 'productCount')
        .addSelect('COALESCE(SUM(product.quantity), 0)', 'totalStock')
        .where('product.userId = :userId', { userId })
        .getRawOne<{ productCount: string; totalStock: string }>(),
      this.categoriesRepository.count({ where: { userId } }),
      this.stockMovementsRepository.count({ where: { userId } }),
    ]);

    const recentMovements = await this.stockMovementsRepository.find({
      where: { userId },
      select: [
        'id',
        'productId',
        'productName',
        'type',
        'quantity',
        'context',
        'createdAt',
      ],
      order: { createdAt: 'DESC' },
      take: 10,
    });

    return {
      ...user,
      productCount: Number(productAgg?.productCount ?? 0),
      categoryCount,
      movementCount,
      totalStock: Number(productAgg?.totalStock ?? 0),
      recentMovements,
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

    const actor = await this.usersRepository.findOne({
      where: { id: actorId },
      select: ['id', 'name'],
    });

    if (user.role !== UserRole.ADMIN) {
      user.role = UserRole.ADMIN;
      await this.usersRepository.save({ ...user, updatedAt: new Date() });
      await this.createAdminLog(
        actorId,
        actor?.name ?? 'Unknown',
        targetUserId,
        user.name,
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

    const actor = await this.usersRepository.findOne({
      where: { id: actorId },
      select: ['id', 'name'],
    });

    await this.productsRepository.delete({ userId: targetUserId });
    await this.categoriesRepository.delete({ userId: targetUserId });
    await this.usersRepository.delete({ id: targetUserId });

    await this.createAdminLog(
      actorId,
      actor?.name ?? 'Unknown',
      targetUserId,
      user.name,
      AdminLogAction.DELETE_USER,
    );

    return user;
  }

  async getDashboard() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      userAgg,
      productAgg,
      movementAgg,
      totalCategories,
      recentUsers,
      topUsersByProducts,
    ] = await Promise.all([
      this.usersRepository
        .createQueryBuilder('u')
        .select('COUNT(*)', 'totalUsers')
        .addSelect(
          `COUNT(CASE WHEN u.createdAt >= :startOfMonth THEN 1 END)`,
          'usersThisMonth',
        )
        .setParameter('startOfMonth', startOfMonth)
        .getRawOne<{ totalUsers: string; usersThisMonth: string }>(),
      this.productsRepository
        .createQueryBuilder('p')
        .select('COUNT(*)', 'totalProducts')
        .addSelect(
          `COUNT(CASE WHEN p.createdAt >= :startOfMonth THEN 1 END)`,
          'productsThisMonth',
        )
        .addSelect(
          `COUNT(CASE WHEN p.quantity <= 5 THEN 1 END)`,
          'lowStockProducts',
        )
        .setParameter('startOfMonth', startOfMonth)
        .getRawOne<{
          totalProducts: string;
          productsThisMonth: string;
          lowStockProducts: string;
        }>(),
      this.stockMovementsRepository
        .createQueryBuilder('m')
        .select('COUNT(*)', 'totalMovements')
        .addSelect(
          `COUNT(CASE WHEN m.createdAt >= :startOfMonth THEN 1 END)`,
          'movementsThisMonth',
        )
        .setParameter('startOfMonth', startOfMonth)
        .getRawOne<{ totalMovements: string; movementsThisMonth: string }>(),
      this.categoriesRepository.count(),
      this.usersRepository.find({
        select: ['id', 'name', 'email', 'role', 'createdAt'],
        order: { createdAt: 'DESC' },
        take: 5,
      }),
      this.productsRepository
        .createQueryBuilder('product')
        .select('product.userId', 'userId')
        .addSelect('COUNT(product.id)', 'count')
        .addSelect('"user"."name"', 'userName')
        .leftJoin('product.user', 'user')
        .groupBy('product.userId')
        .addGroupBy('user.name')
        .orderBy('count', 'DESC')
        .limit(5)
        .getRawMany(),
    ]);

    return {
      totalUsers: Number(userAgg?.totalUsers ?? 0),
      usersThisMonth: Number(userAgg?.usersThisMonth ?? 0),
      totalProducts: Number(productAgg?.totalProducts ?? 0),
      productsThisMonth: Number(productAgg?.productsThisMonth ?? 0),
      lowStockProducts: Number(productAgg?.lowStockProducts ?? 0),
      totalMovements: Number(movementAgg?.totalMovements ?? 0),
      movementsThisMonth: Number(movementAgg?.movementsThisMonth ?? 0),
      totalCategories,
      recentUsers,
      topUsersByProducts,
    };
  }

  async getLogs(page = 1, perPage = 10) {
    const [logs, total] = await this.adminLogsRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * perPage,
      take: perPage,
    });

    return {
      data: logs,
      meta: { total, page, perPage, lastPage: Math.ceil(total / perPage) },
    };
  }

  async listAllProducts(page = 1, perPage = 20, search?: string) {
    const where: { name?: ReturnType<typeof ILike> } = {};

    if (search) {
      where.name = ILike(`%${search}%`);
    }

    const [products, total] = await this.productsRepository.findAndCount({
      where: where as object,
      relations: ['user', 'category'],
      order: { updatedAt: 'DESC' },
      skip: (page - 1) * perPage,
      take: perPage,
    });

    return {
      data: products.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        quantity: p.quantity,
        image: p.image,
        userId: p.userId,
        userName: p.user?.name ?? 'Unknown',
        categoryName: p.category?.name ?? null,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
      meta: { total, page, perPage, lastPage: Math.ceil(total / perPage) },
    };
  }

  async listAllMovements(page = 1, perPage = 20) {
    const [movements, total] = await this.stockMovementsRepository.findAndCount(
      {
        relations: ['user'],
        order: { createdAt: 'DESC' },
        skip: (page - 1) * perPage,
        take: perPage,
      },
    );

    return {
      data: movements.map((m) => ({
        id: m.id,
        productId: m.productId,
        productName: m.productName,
        type: m.type,
        quantity: m.quantity,
        context: m.context,
        userId: m.userId,
        userName: m.user?.name ?? 'Unknown',
        createdAt: m.createdAt,
      })),
      meta: { total, page, perPage, lastPage: Math.ceil(total / perPage) },
    };
  }
  private async createAdminLog(
    actorId: string,
    actorName: string,
    targetUserId: string,
    targetUserName: string,
    action: AdminLogAction,
  ) {
    const log = this.adminLogsRepository.create({
      actorId,
      actorName,
      targetUserId,
      targetUserName,
      action,
    });
    await this.adminLogsRepository.save(log);
  }
}
