import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { StockMovement } from './entities/stock-movement.entity';
import { resolvePeriod, getStartDate } from '../common/utils/period.util';

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
    period?: string,
  ): Promise<{
    data: StockMovement[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { userId };

    if (period) {
      const resolvedPeriod = resolvePeriod(period);
      const startDate = getStartDate(resolvedPeriod);
      where.createdAt = MoreThanOrEqual(startDate);
    }

    const [data, total] = await this.stockMovementsRepository.findAndCount({
      where,
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
