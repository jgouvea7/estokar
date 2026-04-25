import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty({ message: 'Nome da categoria é obrigatório' })
  @MaxLength(100)
  name: string;
}
