// backend/src/infrastructure/http/dtos/native-capture.dto.ts
import { IsNumber, IsString, IsOptional, IsPositive, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { NativeCaptureExpenseDto as INativeCaptureExpenseDto } from '@shared/index';

export class NativeCaptureExpenseDto implements INativeCaptureExpenseDto {
  @ApiProperty({ example: 45000.00, description: 'Monto del gasto extraído de la notificación bancaria' })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({ example: 'Transferencia de Nequi recibida/enviada', description: 'Descripción o texto principal procesado' })
  @IsString()
  description: string;

  @ApiProperty({ example: 'Nequi: Compra por $45000 en Tienda X', description: 'Mensaje de notificación original sin procesar', required: false })
  @IsString()
  @IsOptional()
  rawText?: string;

  @ApiProperty({ example: '2026-07-26T03:40:00.000Z', description: 'Fecha de la transacción extraída', required: false })
  @IsString()
  @IsOptional()
  date?: string;

  @ApiProperty({ example: 1, description: 'ID de la categoría si se logra mapear automáticamente', required: false })
  @IsInt()
  @IsOptional()
  categoryId?: number;
}
