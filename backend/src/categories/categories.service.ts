import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from 'src/products/entities/product.entity';
import { Repository } from 'typeorm';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  async findAll(requesterId: string): Promise<Category[]> {
    return this.categoriesRepository.find({
      where: { userId: requesterId },
      order: { name: 'ASC' },
    });
  }

  async create(createCategoryDto: CreateCategoryDto, requesterId: string): Promise<Category> {
    const name = this.normalizeName(createCategoryDto.name);
    const existing = await this.categoriesRepository.findOneBy({ name, userId: requesterId });

    if (existing) {
      throw new ConflictException('Já existe uma categoria com este nome.');
    }

    const now = new Date();
    const category = this.categoriesRepository.create({
      name,
      userId: requesterId,
      createdAt: now,
      updatedAt: now,
    });

    return this.categoriesRepository.save(category);
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
    requesterId: string,
  ): Promise<Category> {
    const category = await this.findOne(id, requesterId);

    if (updateCategoryDto.name) {
      const name = this.normalizeName(updateCategoryDto.name);
      const existing = await this.categoriesRepository.findOneBy({ name, userId: requesterId });

      if (existing && existing.id !== id) {
        throw new ConflictException('Já existe uma categoria com este nome.');
      }

      category.name = name;
    }

    category.updatedAt = new Date();
    return this.categoriesRepository.save(category);
  }

  async remove(id: string, requesterId: string): Promise<void> {
    const category = await this.findOne(id, requesterId);

    await this.productsRepository.update(
      { categoryId: category.id, userId: requesterId },
      { categoryId: null, updatedAt: new Date() },
    );

    await this.categoriesRepository.remove(category);
  }

  private async findOne(id: string, requesterId: string): Promise<Category> {
    const category = await this.categoriesRepository.findOneBy({ id, userId: requesterId });

    if (!category) {
      throw new NotFoundException(`Categoria com ID "${id}" não encontrada`);
    }

    return category;
  }

  private normalizeName(name: string): string {
    return name.trim();
  }
}
