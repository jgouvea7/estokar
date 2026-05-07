import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsUUID,
  MaxLength,
  Min,
  IsOptional,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateProductDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Nome não pode ser vazio' })
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Quantidade deve ser um número' })
  @Min(0, { message: 'Quantidade não pode ser negativa' })
  quantity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Alerta deve ser um número inteiro' })
  @Min(1, { message: 'Alerta deve ser de pelo menos 1 dia' })
  alertDaysBefore?: number;

  @IsOptional()
  @IsString()
  image?: string;
}
