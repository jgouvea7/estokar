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

  async findAll(userId: string): Promise<StockMovement[]> {
    return this.stockMovementsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async create(data: Partial<StockMovement>): Promise<StockMovement> {
    const movement = this.stockMovementsRepository.create(data);
    return this.stockMovementsRepository.save(movement);
  }
}
