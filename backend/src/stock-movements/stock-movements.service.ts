import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockMovement } from './entities/stock-movement.entity';

@Injectable()
export class StockMovementsService {
  constructor(
    @InjectRepository(StockMovement)
    private readonly stockMovementsRepository: Repository<StockMovement>,
  ) {}

  async findAll(
    userId: string,
    page = 1,
    limit = 100,
  ): Promise<{
    data: StockMovement[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;

    const [data, total] = await this.stockMovementsRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async create(data: Partial<StockMovement>): Promise<StockMovement> {
    const movement = this.stockMovementsRepository.create(data);
    return this.stockMovementsRepository.save(movement);
  }
}
