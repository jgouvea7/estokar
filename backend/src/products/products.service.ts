import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from 'src/categories/entities/category.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { StockMovementsService } from 'src/stock-movements/stock-movements.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
    private readonly stockMovementsService: StockMovementsService,
  ) {}

  async findAll(requesterId: string): Promise<Product[]> {
    return this.productsRepository.find({
      where: { userId: requesterId },
      relations: ['user', 'category'],
    });
  }

  async create(createProductDto: CreateProductDto, requesterId: string): Promise<Product> {
    const userId = requesterId;

    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException(`Usuário com ID "${userId}" não encontrado`);
    }

    const category = await this.resolveCategory(createProductDto.categoryId, requesterId);

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

    if (savedProduct.quantity > 0) {
      await this.stockMovementsService.create({
        productId: savedProduct.id,
        productName: savedProduct.name,
        type: 'in',
        quantity: savedProduct.quantity,
        userId: requesterId,
      });
    }

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

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    requesterId: string,
  ): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { id, userId: requesterId },
      relations: ['user', 'category'],
    });
    // O filtro por userId já foi feito na query acima
    if (!product) {
      throw new NotFoundException(`Produto com ID "${id}" não encontrado`);
    }

    const category = await this.resolveCategory(updateProductDto.categoryId, requesterId);

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
        type: diff > 0 ? 'in' : 'out',
        quantity: Math.abs(diff),
        userId: requesterId,
      });
    }

    return updatedProduct;
  }

  async remove(id: string, requesterId: string): Promise<Product> {
    const product = await this.productsRepository.findOneBy({ id, userId: requesterId });
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

    const category = await this.categoriesRepository.findOneBy({ id: categoryId, userId: requesterId });

    if (!category) {
      throw new NotFoundException(`Categoria com ID "${categoryId}" não encontrada`);
    }

    return category;
  }
}
