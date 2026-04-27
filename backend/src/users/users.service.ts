import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from '../categories/entities/category.entity';
import { Product } from '../products/entities/product.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      relations: ['products'],
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['products'],
    });
    if (!user) {
      throw new NotFoundException(`Usuário com ID "${id}" não encontrado`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ email });
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    requesterId: string,
  ): Promise<User> {
    if (id !== requesterId) {
      throw new ForbiddenException('Você não tem permissão para editar este usuário.');
    }

    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`Usuário com ID "${id}" não encontrado`);
    }

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const emailInUse = await this.usersRepository.findOneBy({ email: updateUserDto.email });
      if (emailInUse) {
        throw new ConflictException('Este e-mail já está em uso.');
      }
    }

    const updates: Partial<User> = {
      ...updateUserDto,
      updatedAt: new Date(),
    };

    if (updateUserDto.password) {
      updates.password = await bcrypt.hash(updateUserDto.password, 12);
    }

    return this.usersRepository.save({ ...user, ...updates });
  }

  async remove(id: string, requesterId: string): Promise<User> {
    if (id !== requesterId) {
      throw new ForbiddenException('Você não tem permissão para remover este usuário.');
    }

    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`Usuário com ID "${id}" não encontrado`);
    }

    await this.productsRepository.delete({ userId: id });
    await this.categoriesRepository.delete({ userId: id });
    await this.usersRepository.delete({ id });

    return user;
  }
}
