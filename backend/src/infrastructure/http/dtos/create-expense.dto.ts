// backend/src/infrastructure/http/dtos/create-expense.dto.ts
import { IsNumber, IsString, IsBoolean, IsOptional, IsPositive, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateExpenseDto {
  @ApiProperty({ example: 120.50, description: 'Monto del gasto' })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({ example: 'Compras del supermercado', description: 'Descripción detallada del gasto' })
  @IsString()
  description: string;

  @ApiProperty({ example: 1, description: 'ID de la categoría del gasto' })
  @IsInt()
  categoryId: number;

  @ApiProperty({ example: false, description: 'Si el gasto es de carácter privado', default: false, required: false })
  @IsBoolean()
  @IsOptional()
  isPrivate?: boolean;

  @ApiProperty({ example: '2026-07-26T03:00:00.000Z', description: 'Fecha del gasto', required: false })
  @IsOptional()
  @IsString()
  date?: string;
}
