import {
  IsEmail,
  IsInt,
  IsString,
  Min,
  MinLength,
  IsNotEmpty,
  MaxLength,
  IsOptional,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Nome não pode ser vazio' })
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Informe um e-mail válido' })
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Senha deve ter pelo menos 8 caracteres' })
  @MaxLength(72)
  password?: string;

  @IsOptional()
  @IsInt({ message: 'Dias de alerta deve ser um numero inteiro' })
  @Min(1, { message: 'Dias de alerta deve ser maior que zero' })
  alertDaysBefore?: number;
}
