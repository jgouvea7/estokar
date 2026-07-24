import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsUUID,
  MaxLength,
  Min,
  IsOptional,
  IsInt,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsOptional()
  userId?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsString()
  @IsNotEmpty({ message: 'Nome do produto é obrigatório' })
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'Quantidade deve ser um número' })
  @Min(0, { message: 'Quantidade não pode ser negativa' })
  quantity: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Alerta deve ser um número inteiro' })
  @Min(1, { message: 'Alerta deve ser de pelo menos 1 dia' })
  alertDaysBefore?: number;

  @IsString()
  @IsNotEmpty({ message: 'Imagem é obrigatória' })
  image: string;

  @IsOptional()
  @IsBoolean()
  hasExpiration?: boolean;

  @IsOptional()
  @IsDateString({}, { message: 'Data de validade inválida' })
  expirationDate?: string;
}
