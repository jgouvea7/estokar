import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

type ProductMovementSummaryRaw = {
  totalEntries: string | number;
  totalOutputs: string | number;
  recentSoldQuantity: string | number;
};

type ProductDashboardMovementRaw = {
  createdAt: Date | string;
  id: string;
  quantity: string | number;
  type: StockMovementType;
};

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
    const windowDays = 7;
    const windowStart = new Date();
    windowStart.setDate(windowStart.getDate() - windowDays);

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
          'COALESCE(SUM(CASE WHEN movement.type = :outType AND movement.createdAt >= :windowStart THEN movement.quantity ELSE 0 END), 0)',
          'recentSoldQuantity',
        )
        .where('movement.userId = :userId', { userId: requesterId })
        .setParameters({
          outType: StockMovementType.OUT,
          windowStart,
        })
        .groupBy('movement.productId')
        .getRawMany<{
          productId: string;
          recentSoldQuantity: string | number;
        }>(),
    ]);

    const alertDaysBefore = user?.alertDaysBefore ?? 7;
    const soldByProduct = new Map(
      movementSummaries.map((row) => [
        row.productId,
        this.toNumber(row.recentSoldQuantity),
      ]),
    );

    return products.map((product) => {
      const recentSoldQuantity = soldByProduct.get(product.id) ?? 0;
      const forecast = this.calculateForecast(
        product.quantity,
        recentSoldQuantity,
        windowDays,
      );

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
    const windowDays = 7;
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
        this.getMovementSummary(id, requesterId, windowDays),
        this.getRecentMovements(id, requesterId, recentMovementsLimit),
      ],
    );

    if (!product) {
      throw new NotFoundException(`Produto com ID "${id}" não encontrado`);
    }

    const totalEntries = this.toNumber(movementSummary?.totalEntries);
    const totalOutputs = this.toNumber(movementSummary?.totalOutputs);
    const recentSoldQuantity = this.toNumber(
      movementSummary?.recentSoldQuantity,
    );
    const forecast = this.calculateForecast(
      product.quantity,
      recentSoldQuantity,
      windowDays,
    );

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
      },
      dashboard: {
        alertDaysBefore: user?.alertDaysBefore ?? 7,
        currentStock: product.quantity,
        averageDailySales: forecast.averageDailySales,
        estimatedDaysLeft: forecast.estimatedDaysLeft,
        recentMovements: recentMovements.map(this.mapMovementToDto),
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
    const windowDays = 7;
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
        this.getMovementSummary(id, requesterId, windowDays),
        this.getRecentMovements(id, requesterId, recentMovementsLimit),
      ],
    );

    if (!product) {
      throw new NotFoundException(`Produto com ID "${id}" não encontrado`);
    }

    const totalEntries = this.toNumber(movementSummary?.totalEntries);
    const totalOutputs = this.toNumber(movementSummary?.totalOutputs);
    const recentSoldQuantity = this.toNumber(
      movementSummary?.recentSoldQuantity,
    );
    const forecast = this.calculateForecast(
      product.quantity,
      recentSoldQuantity,
      windowDays,
    );

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
      recentMovements: recentMovements.map(this.mapMovementToDto),
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

  private async getMovementSummary(
    id: string,
    requesterId: string,
    windowDays: number,
  ) {
    const windowStart = new Date();
    windowStart.setDate(windowStart.getDate() - windowDays);

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
        'COALESCE(SUM(CASE WHEN movement.type = :outType AND movement.createdAt >= :windowStart THEN movement.quantity ELSE 0 END), 0)',
        'recentSoldQuantity',
      )
      .where('movement.userId = :userId', { userId: requesterId })
      .andWhere('movement.productId = :productId', { productId: id })
      .setParameters({
        inType: StockMovementType.IN,
        outType: StockMovementType.OUT,
        windowStart,
      })
      .getRawOne<ProductMovementSummaryRaw>();
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

  private calculateForecast(
    currentStock: number,
    recentSoldQuantity: number,
    windowDays: number,
  ) {
    if (
      !Number.isFinite(currentStock) ||
      !Number.isFinite(recentSoldQuantity) ||
      !Number.isFinite(windowDays)
    ) {
      return { averageDailySales: 0, estimatedDaysLeft: null as number | null };
    }

    if (recentSoldQuantity <= 0 || windowDays <= 0) {
      return { averageDailySales: 0, estimatedDaysLeft: null as number | null };
    }

    const averageDailySales = recentSoldQuantity / windowDays;

    if (averageDailySales <= 0) {
      return { averageDailySales: 0, estimatedDaysLeft: null as number | null };
    }

    return {
      averageDailySales,
      estimatedDaysLeft: currentStock / averageDailySales,
    };
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

  private toNumber(value: string | number | undefined | null): number {
    if (value === undefined || value === null) {
      return 0;
    }

    return typeof value === 'number' ? value : Number(value);
  }
}
