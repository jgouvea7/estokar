import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, And } from 'typeorm';
import { stringify } from 'csv-stringify/sync';
import { Product } from '../products/entities/product.entity';
import {
  StockMovement,
  StockMovementType,
} from '../stock-movements/entities/stock-movement.entity';

@Injectable()
export class ExportService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(StockMovement)
    private readonly stockMovementsRepository: Repository<StockMovement>,
  ) {}

  async exportProductsCsv(
    userId: string,
  ): Promise<{ csv: string; filename: string }> {
    const products = await this.productsRepository.find({
      where: { userId },
      relations: ['category'],
      order: { name: 'ASC' },
    });

    const records = products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      quantity: p.quantity,
      category: p.category?.name ?? '',
      image: p.image,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));

    const csv = stringify(records, {
      header: true,
      columns: [
        'id',
        'name',
        'description',
        'quantity',
        'category',
        'image',
        'createdAt',
        'updatedAt',
      ],
      bom: true,
      delimiter: ';',
    });

    return {
      csv,
      filename: `produtos-${new Date().toISOString().slice(0, 10)}.csv`,
    };
  }

  async exportStockMovementsCsv(
    userId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<{ csv: string; filename: string }> {
    const where: Record<string, unknown> = { userId };

    if (startDate && endDate) {
      where.createdAt = And(
        MoreThanOrEqual(new Date(startDate)),
        LessThanOrEqual(new Date(endDate)),
      );
    } else if (startDate) {
      where.createdAt = MoreThanOrEqual(new Date(startDate));
    } else if (endDate) {
      where.createdAt = LessThanOrEqual(new Date(endDate));
    }

    const movements = await this.stockMovementsRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });

    const records = movements.map((m) => ({
      id: m.id,
      productId: m.productId,
      productName: m.productName,
      type: m.type === StockMovementType.IN ? 'Entrada' : 'Saída',
      quantity: m.quantity,
      context: m.context ?? '',
      createdAt: m.createdAt.toISOString(),
    }));

    const csv = stringify(records, {
      header: true,
      columns: [
        'id',
        'productId',
        'productName',
        'type',
        'quantity',
        'context',
        'createdAt',
      ],
      bom: true,
      delimiter: ';',
    });

    return {
      csv,
      filename: `movimentacoes-${new Date().toISOString().slice(0, 10)}.csv`,
    };
  }

  async exportDashboardCsv(
    userId: string,
  ): Promise<{ csv: string; filename: string }> {
    const products = await this.productsRepository.find({
      where: { userId },
      relations: ['category'],
      order: { name: 'ASC' },
    });

    const totalStock = products.reduce((acc, p) => acc + p.quantity, 0);
    const catalogAvailability =
      products.length > 0
        ? (
            (products.filter((p) => p.quantity > 0).length / products.length) *
            100
          ).toFixed(2)
        : '0';

    const records = products.map((p) => ({
      name: p.name,
      category: p.category?.name ?? '',
      quantity: p.quantity,
      image: p.image,
    }));

    const summary = [
      { metric: 'Total de Produtos', value: String(products.length) },
      { metric: 'Total em Estoque (unidades)', value: String(totalStock) },
      { metric: 'Disponibilidade (%)', value: `${catalogAvailability}%` },
    ];

    const summaryCsv = stringify(summary, {
      header: true,
      columns: ['metric', 'value'],
      bom: true,
      delimiter: ';',
    });

    const productsCsv = stringify(records, {
      header: true,
      columns: ['name', 'category', 'quantity', 'image'],
      bom: true,
      delimiter: ';',
    });

    const csv = `${summaryCsv}\n\n${productsCsv}`;

    return {
      csv,
      filename: `relatorio-estoque-${new Date().toISOString().slice(0, 10)}.csv`,
    };
  }
}
