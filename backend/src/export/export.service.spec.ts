import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ExportService } from './export.service';
import { Product } from '../products/entities/product.entity';
import {
  StockMovement,
  StockMovementType,
} from '../stock-movements/entities/stock-movement.entity';
import { makeProduct, makeStockMovement } from '../common/test/factories';

describe('ExportService', () => {
  let service: ExportService;
  let productsRepository: Record<string, jest.Mock>;
  let stockMovementsRepository: Record<string, jest.Mock>;

  const mockProduct = makeProduct({
    name: 'Produto Teste',
    description: 'Descrição',
    quantity: 10,
    category: { id: 'cat-1', name: 'Categoria A' } as never,
  });

  const mockMovement = makeStockMovement({
    productName: 'Produto Teste',
    type: StockMovementType.OUT,
    quantity: 5,
    context: 'Venda',
  });

  beforeEach(async () => {
    productsRepository = {
      find: jest.fn(),
    };

    stockMovementsRepository = {
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportService,
        { provide: getRepositoryToken(Product), useValue: productsRepository },
        {
          provide: getRepositoryToken(StockMovement),
          useValue: stockMovementsRepository,
        },
      ],
    }).compile();

    service = module.get<ExportService>(ExportService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('exportProductsCsv', () => {
    it('should generate CSV with BOM and semicolon delimiter', async () => {
      productsRepository.find.mockResolvedValue([mockProduct]);

      const result = await service.exportProductsCsv('user-1');

      expect(result.filename).toMatch(/^produtos-\d{4}-\d{2}-\d{2}\.csv$/);
      expect(result.csv).toContain(
        'id;name;description;quantity;category;image;createdAt;updatedAt',
      );
      expect(result.csv).toContain('Produto Teste');
      expect(result.csv).toContain('Categoria A');
      expect(result.csv).toContain('10');
      expect(result.csv.charCodeAt(0)).toBe(0xfeff);
      expect(productsRepository.find).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        relations: ['category'],
        order: { name: 'ASC' },
      });
    });

    it('should return header-only CSV when no products', async () => {
      productsRepository.find.mockResolvedValue([]);

      const result = await service.exportProductsCsv('user-1');

      expect(result.csv).toContain(
        'id;name;description;quantity;category;image;createdAt;updatedAt',
      );
      const lines = result.csv.trim().split('\n');
      expect(lines.filter((l) => l.trim())).toHaveLength(1);
    });
  });

  describe('exportStockMovementsCsv', () => {
    it('should generate CSV with all movements', async () => {
      stockMovementsRepository.find.mockResolvedValue([mockMovement]);

      const result = await service.exportStockMovementsCsv('user-1');

      expect(result.filename).toMatch(/^movimentacoes-\d{4}-\d{2}-\d{2}\.csv$/);
      expect(result.csv).toContain(
        'id;productId;productName;type;quantity;context;createdAt',
      );
      expect(result.csv).toContain('Produto Teste');
      expect(result.csv).toContain('Saída');
      expect(result.csv).toContain('Venda');
      expect(result.csv.charCodeAt(0)).toBe(0xfeff);
    });

    it('should filter by date range when provided', async () => {
      stockMovementsRepository.find.mockResolvedValue([mockMovement]);

      await service.exportStockMovementsCsv(
        'user-1',
        '2025-01-01',
        '2025-12-31',
      );

      expect(stockMovementsRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          where: expect.objectContaining({
            userId: 'user-1',
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            createdAt: expect.anything(),
          }),
        }),
      );
    });

    it('should return header-only CSV when no movements', async () => {
      stockMovementsRepository.find.mockResolvedValue([]);

      const result = await service.exportStockMovementsCsv('user-1');

      const lines = result.csv.trim().split('\n');
      expect(lines.filter((l) => l.trim())).toHaveLength(1);
    });
  });

  describe('exportDashboardCsv', () => {
    it('should generate CSV with summary and products', async () => {
      productsRepository.find.mockResolvedValue([mockProduct]);

      const result = await service.exportDashboardCsv('user-1');

      expect(result.filename).toMatch(
        /^relatorio-estoque-\d{4}-\d{2}-\d{2}\.csv$/,
      );
      expect(result.csv).toContain('metric;value');
      expect(result.csv).toContain('Total de Produtos');
      expect(result.csv).toContain('1');
      expect(result.csv).toContain('Total em Estoque (unidades)');
      expect(result.csv).toContain('10');
      expect(result.csv).toContain('Disponibilidade (%)');
      expect(result.csv).toContain('100.00%');
      expect(result.csv).toContain('name;category;quantity;image');
      expect(result.csv).toContain('Produto Teste');
    });

    it('should handle empty products for dashboard', async () => {
      productsRepository.find.mockResolvedValue([]);

      const result = await service.exportDashboardCsv('user-1');

      expect(result.csv).toContain('Total de Produtos');
      expect(result.csv).toContain('0');
      expect(result.csv).toContain('Disponibilidade (%)');
      expect(result.csv).toContain('0%');
    });
  });
});
