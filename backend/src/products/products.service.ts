import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from '../categories/entities/category.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { StockMovementsService } from '../stock-movements/stock-movements.service';
import { StockMovementType } from '../stock-movements/entities/stock-movement.entity';
import { StockMovement } from '../stock-movements/entities/stock-movement.entity';
import {
  ProductDashboardResponseDto,
  ProductDashboardMovementDto,
} from './dto/product-dashboard-response.dto';
import { calculateForecast, toNumber } from '../common/utils/forecast.util';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
    @InjectRepository(StockMovement)
    private readonly stockMovementsRepository: Repository<StockMovement>,
    private readonly stockMovementsService: StockMovementsService,
  ) {}

  async findAll(
    requesterId: string,
  ): Promise<
    (Product & { estimatedDaysLeft: number | null; alertDaysBefore: number })[]
  > {
    const windowStart7 = new Date();
    windowStart7.setDate(windowStart7.getDate() - 7);

    const windowStart14 = new Date();
    windowStart14.setDate(windowStart14.getDate() - 14);

    const windowStart30 = new Date();
    windowStart30.setDate(windowStart30.getDate() - 30);

    const [user, products, movementSummaries] = await Promise.all([
      this.usersRepository.findOne({
        where: { id: requesterId },
        select: ['id', 'alertDaysBefore'],
      }),
      this.productsRepository.find({
        where: { userId: requesterId },
        relations: ['category'],
        order: { updatedAt: 'DESC' },
      }),
      this.stockMovementsRepository
        .createQueryBuilder('movement')
        .select('movement.productId', 'productId')
        .addSelect(
          'COALESCE(SUM(CASE WHEN movement.type = :outType AND movement.createdAt >= :windowStart7 THEN movement.quantity ELSE 0 END), 0)',
          'recentSoldQuantity7',
        )
        .addSelect(
          'COALESCE(SUM(CASE WHEN movement.type = :outType AND movement.createdAt >= :windowStart14 THEN movement.quantity ELSE 0 END), 0)',
          'recentSoldQuantity14',
        )
        .addSelect(
          'COALESCE(SUM(CASE WHEN movement.type = :outType AND movement.createdAt >= :windowStart30 THEN movement.quantity ELSE 0 END), 0)',
          'recentSoldQuantity30',
        )
        .where('movement.userId = :userId', { userId: requesterId })
        .setParameters({
          outType: StockMovementType.OUT,
          windowStart7,
          windowStart14,
          windowStart30,
        })
        .groupBy('movement.productId')
        .getRawMany<{
          productId: string;
          recentSoldQuantity7: string | number;
          recentSoldQuantity14: string | number;
          recentSoldQuantity30: string | number;
        }>(),
    ]);

    const alertDaysBefore = user?.alertDaysBefore ?? 7;
    const soldByProduct = new Map(
      movementSummaries.map((row) => [
        row.productId,
        {
          sold7: toNumber(row.recentSoldQuantity7),
          sold14: toNumber(row.recentSoldQuantity14),
          sold30: toNumber(row.recentSoldQuantity30),
        },
      ]),
    );

    return products.map((product) => {
      const sales = soldByProduct.get(product.id);
      const forecast = calculateForecast({
        currentStock: product.quantity,
        soldLast7Days: sales?.sold7 ?? 0,
        soldLast14Days: sales?.sold14,
        soldLast30Days: sales?.sold30,
      });

      return {
        ...product,
        estimatedDaysLeft: forecast.estimatedDaysLeft,
        alertDaysBefore,
      };
    });
  }

  async create(
    createProductDto: CreateProductDto,
    requesterId: string,
  ): Promise<Product> {
    const userId = requesterId;

    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException(`Usuário com ID "${userId}" não encontrado`);
    }

    const category = await this.resolveCategory(
      createProductDto.categoryId,
      requesterId,
    );

    const now = new Date();
    const newProduct = this.productsRepository.create({
      ...createProductDto,
      category,
      categoryId: category?.id,
      userId,
      user,
      createdAt: now,
      updatedAt: now,
    });

    const savedProduct = await this.productsRepository.save(newProduct);

    await this.stockMovementsService.create({
      productId: savedProduct.id,
      productName: savedProduct.name,
      context: 'Estoque inicial',
      type: StockMovementType.IN,
      quantity: savedProduct.quantity,
      userId: requesterId,
    });

    return savedProduct;
  }

  async findOne(id: string, requesterId: string): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { id, userId: requesterId },
      relations: ['user', 'category'],
    });
    if (!product) {
      throw new NotFoundException(`Produto com ID "${id}" não encontrado`);
    }
    return product;
  }

  async getDetails(id: string, requesterId: string) {
    const recentMovementsLimit = 10;

    const [user, product, movementSummary, recentMovements] = await Promise.all(
      [
        this.usersRepository.findOne({
          where: { id: requesterId },
          select: ['id', 'alertDaysBefore'],
        }),
        this.productsRepository.findOne({
          where: { id, userId: requesterId },
          relations: ['category'],
        }),
        this.getMovementSummary(id, requesterId),
        this.getRecentMovements(id, requesterId, recentMovementsLimit),
      ],
    );

    if (!product) {
      throw new NotFoundException(`Produto com ID "${id}" não encontrado`);
    }

    const totalEntries = toNumber(movementSummary?.totalEntries);
    const totalOutputs = toNumber(movementSummary?.totalOutputs);
    const forecast = calculateForecast({
      currentStock: product.quantity,
      soldLast7Days: toNumber(movementSummary?.recentSoldQuantity),
      soldLast14Days: toNumber(movementSummary?.recentSoldQuantity14),
      soldLast30Days: toNumber(movementSummary?.recentSoldQuantity30),
    });

    return {
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        image: product.image,
        categoryId: product.categoryId,
        category: product.category
          ? { id: product.category.id, name: product.category.name }
          : null,
        hasExpiration: product.hasExpiration,
        expirationDate: product.expirationDate,
      },
      dashboard: {
        alertDaysBefore: user?.alertDaysBefore ?? 7,
        currentStock: product.quantity,
        averageDailySales: forecast.averageDailySales,
        estimatedDaysLeft: forecast.estimatedDaysLeft,
        recentMovements: recentMovements.map((m) => this.mapMovementToDto(m)),
        summary: {
          totalEntries,
          totalOutputs,
        },
      },
    };
  }

  async getDashboard(
    id: string,
    requesterId: string,
  ): Promise<ProductDashboardResponseDto> {
    const recentMovementsLimit = 10;

    const [user, product, movementSummary, recentMovements] = await Promise.all(
      [
        this.usersRepository.findOne({
          where: { id: requesterId },
          select: ['id', 'alertDaysBefore'],
        }),
        this.productsRepository.findOne({
          where: { id, userId: requesterId },
          select: ['id', 'name', 'quantity', 'image'],
        }),
        this.getMovementSummary(id, requesterId),
        this.getRecentMovements(id, requesterId, recentMovementsLimit),
      ],
    );

    if (!product) {
      throw new NotFoundException(`Produto com ID "${id}" não encontrado`);
    }

    const totalEntries = toNumber(movementSummary?.totalEntries);
    const totalOutputs = toNumber(movementSummary?.totalOutputs);
    const forecast = calculateForecast({
      currentStock: product.quantity,
      soldLast7Days: toNumber(movementSummary?.recentSoldQuantity),
      soldLast14Days: toNumber(movementSummary?.recentSoldQuantity14),
      soldLast30Days: toNumber(movementSummary?.recentSoldQuantity30),
    });

    return {
      forecast: {
        averageDailySales: forecast.averageDailySales,
        estimatedDaysLeft: forecast.estimatedDaysLeft,
      },
      product: {
        alertDaysBefore: user?.alertDaysBefore ?? 7,
        currentStock: product.quantity,
        id: product.id,
        image: product.image,
        name: product.name,
      },
      recentMovements: recentMovements.map((m) => this.mapMovementToDto(m)),
      summary: {
        totalEntries,
        totalOutputs,
      },
    };
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    requesterId: string,
  ): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { id, userId: requesterId },
      relations: ['user', 'category'],
    });
    if (!product) {
      throw new NotFoundException(`Produto com ID "${id}" não encontrado`);
    }

    const category = await this.resolveCategory(
      updateProductDto.categoryId,
      requesterId,
    );

    const oldQuantity = product.quantity;
    const updatedProduct = await this.productsRepository.save({
      ...product,
      ...updateProductDto,
      category,
      categoryId: category?.id ?? product.categoryId,
      updatedAt: new Date(),
    });

    if (updatedProduct.quantity !== oldQuantity) {
      const diff = updatedProduct.quantity - oldQuantity;
      await this.stockMovementsService.create({
        productId: updatedProduct.id,
        productName: updatedProduct.name,
        type: diff > 0 ? StockMovementType.IN : StockMovementType.OUT,
        quantity: Math.abs(diff),
        userId: requesterId,
      });
    }

    return updatedProduct;
  }

  async remove(id: string, requesterId: string): Promise<Product> {
    const product = await this.productsRepository.findOneBy({
      id,
      userId: requesterId,
    });
    if (!product) {
      throw new NotFoundException(`Produto com ID "${id}" não encontrado`);
    }

    return this.productsRepository.remove(product);
  }

  private async resolveCategory(
    categoryId: string | undefined,
    requesterId: string,
  ): Promise<Category | undefined> {
    if (!categoryId) {
      return undefined;
    }

    const category = await this.categoriesRepository.findOneBy({
      id: categoryId,
      userId: requesterId,
    });

    if (!category) {
      throw new NotFoundException(
        `Categoria com ID "${categoryId}" não encontrada`,
      );
    }

    return category;
  }

  async getProductTimeline(id: string, requesterId: string) {
    const product = await this.productsRepository.findOne({
      where: { id, userId: requesterId },
      select: ['id', 'createdAt'],
    });

    if (!product) {
      throw new NotFoundException(`Produto com ID "${id}" não encontrado`);
    }

    const movements = await this.stockMovementsRepository
      .createQueryBuilder('m')
      .select('m.createdAt', 'createdAt')
      .addSelect(
        `CASE WHEN m.type = :inType THEN m.quantity ELSE -m.quantity END`,
        'netChange',
      )
      .where('m.userId = :userId', { userId: requesterId })
      .andWhere('m.productId = :productId', { productId: id })
      .setParameter('inType', StockMovementType.IN)
      .orderBy('m.createdAt', 'ASC')
      .getRawMany<{ createdAt: Date; netChange: string }>();

    if (!movements.length) return { points: [] };

    const creationDay = product.createdAt.toISOString().slice(0, 10);
    const dailyMap = new Map<string, number>();

    for (const m of movements) {
      const day = m.createdAt.toISOString().slice(0, 10);
      dailyMap.set(day, (dailyMap.get(day) ?? 0) + Number(m.netChange));
    }

    const allDays = new Set([creationDay, ...dailyMap.keys()]);
    const sortedDays = [...allDays].sort();
    let cumulative = 0;
    const points: { date: string; balance: number }[] = [];

    for (const day of sortedDays) {
      if (dailyMap.has(day)) {
        cumulative += dailyMap.get(day)!;
      }
      points.push({ date: day, balance: cumulative });
    }

    return { points };
  }

  private async getMovementSummary(id: string, requesterId: string) {
    const windowStart7 = new Date();
    windowStart7.setDate(windowStart7.getDate() - 7);

    const windowStart14 = new Date();
    windowStart14.setDate(windowStart14.getDate() - 14);

    const windowStart30 = new Date();
    windowStart30.setDate(windowStart30.getDate() - 30);

    return this.stockMovementsRepository
      .createQueryBuilder('movement')
      .select(
        'COALESCE(SUM(CASE WHEN movement.type = :inType THEN movement.quantity ELSE 0 END), 0)',
        'totalEntries',
      )
      .addSelect(
        'COALESCE(SUM(CASE WHEN movement.type = :outType THEN movement.quantity ELSE 0 END), 0)',
        'totalOutputs',
      )
      .addSelect(
        'COALESCE(SUM(CASE WHEN movement.type = :outType AND movement.createdAt >= :windowStart7 THEN movement.quantity ELSE 0 END), 0)',
        'recentSoldQuantity',
      )
      .addSelect(
        'COALESCE(SUM(CASE WHEN movement.type = :outType AND movement.createdAt >= :windowStart14 THEN movement.quantity ELSE 0 END), 0)',
        'recentSoldQuantity14',
      )
      .addSelect(
        'COALESCE(SUM(CASE WHEN movement.type = :outType AND movement.createdAt >= :windowStart30 THEN movement.quantity ELSE 0 END), 0)',
        'recentSoldQuantity30',
      )
      .where('movement.userId = :userId', { userId: requesterId })
      .andWhere('movement.productId = :productId', { productId: id })
      .setParameters({
        inType: StockMovementType.IN,
        outType: StockMovementType.OUT,
        windowStart7,
        windowStart14,
        windowStart30,
      })
      .getRawOne<{
        totalEntries: string;
        totalOutputs: string;
        recentSoldQuantity: string;
        recentSoldQuantity14: string;
        recentSoldQuantity30: string;
      }>();
  }

  private async getRecentMovements(
    id: string,
    requesterId: string,
    limit: number,
  ) {
    return this.stockMovementsRepository
      .createQueryBuilder('movement')
      .where('movement.userId = :userId', { userId: requesterId })
      .andWhere('movement.productId = :productId', { productId: id })
      .orderBy('movement.createdAt', 'DESC')
      .limit(limit)
      .getMany();
  }

  private mapMovementToDto(
    movement: StockMovement,
  ): ProductDashboardMovementDto {
    return {
      createdAt: movement.createdAt,
      id: movement.id,
      quantity: movement.quantity,
      type: movement.type,
    };
  }
}
