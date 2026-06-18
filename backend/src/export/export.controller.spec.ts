import { Test, TestingModule } from '@nestjs/testing';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';

describe('ExportController', () => {
  let controller: ExportController;
  let exportService: Record<string, jest.Mock>;

  const mockCsvResult = { csv: 'col1;col2\nval1;val2', filename: 'export.csv' };

  function mockResponse() {
    return {
      setHeader: jest.fn(),
      send: jest.fn(),
    } as unknown as Record<string, jest.Mock>;
  }

  beforeEach(async () => {
    exportService = {
      exportProductsCsv: jest.fn().mockResolvedValue(mockCsvResult),
      exportStockMovementsCsv: jest.fn().mockResolvedValue(mockCsvResult),
      exportDashboardCsv: jest.fn().mockResolvedValue(mockCsvResult),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExportController],
      providers: [{ provide: ExportService, useValue: exportService }],
    }).compile();

    controller = module.get<ExportController>(ExportController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('exportProductsCsv', () => {
    it('should call service and set response headers', async () => {
      const res = mockResponse();

      await controller.exportProductsCsv('user-1', res as never);

      expect(exportService.exportProductsCsv).toHaveBeenCalledWith('user-1');
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'text/csv; charset=utf-8',
      );
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="export.csv"',
      );
      expect(res.send).toHaveBeenCalledWith(mockCsvResult.csv);
    });
  });

  describe('exportStockMovementsCsv', () => {
    it('should call service without date filters', async () => {
      const res = mockResponse();

      await controller.exportStockMovementsCsv(
        'user-1',
        undefined,
        undefined,
        res as never,
      );

      expect(exportService.exportStockMovementsCsv).toHaveBeenCalledWith(
        'user-1',
        undefined,
        undefined,
      );
    });

    it('should pass date filters to service', async () => {
      const res = mockResponse();

      await controller.exportStockMovementsCsv(
        'user-1',
        '2025-01-01',
        '2025-12-31',
        res as never,
      );

      expect(exportService.exportStockMovementsCsv).toHaveBeenCalledWith(
        'user-1',
        '2025-01-01',
        '2025-12-31',
      );
    });
  });

  describe('exportDashboardCsv', () => {
    it('should call service and set response headers', async () => {
      const res = mockResponse();

      await controller.exportDashboardCsv('user-1', res as never);

      expect(exportService.exportDashboardCsv).toHaveBeenCalledWith('user-1');
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'text/csv; charset=utf-8',
      );
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="export.csv"',
      );
      expect(res.send).toHaveBeenCalledWith(mockCsvResult.csv);
    });
  });
});
