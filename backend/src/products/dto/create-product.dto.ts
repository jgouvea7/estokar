import { IsString, IsNotEmpty, IsNumber, IsUUID, MaxLength, Min, IsOptional } from 'class-validator';
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

  @IsString()
  @IsNotEmpty({ message: 'Descrição é obrigatória' })
  @MaxLength(2000)
  description: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'Quantidade deve ser um número' })
  @Min(0, { message: 'Quantidade não pode ser negativa' })
  quantity: number;

  @IsString()
  @IsNotEmpty({ message: 'Imagem é obrigatória' })
  image: string;
}
