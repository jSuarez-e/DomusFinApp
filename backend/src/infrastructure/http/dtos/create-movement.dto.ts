// backend/src/infrastructure/http/dtos/create-movement.dto.ts
import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateMovementDto as ICreateMovementDto } from '@shared/index';
import { TransactionType } from '@shared/index';

export class CreateMovementDto implements ICreateMovementDto {
  @ApiProperty({ description: 'The absolute amount value of the movement', example: 120.50 })
  @IsNumber()
  @Min(0.01)
  @IsNotEmpty()
  amount: number;

  @ApiProperty({ description: 'Optional transaction date string', example: '2026-07-26T12:00:00.000Z', required: false })
  @IsString()
  @IsOptional()
  transactionDate?: string;

  @ApiProperty({ description: 'The type classification of the movement', enum: TransactionType })
  @IsEnum(TransactionType)
  @IsNotEmpty()
  type: TransactionType;

  @ApiProperty({ description: 'Marks if the movement details are restricted / private', default: false, required: false })
  @IsBoolean()
  @IsOptional()
  isPrivate?: boolean;

  @ApiProperty({ description: 'A short description describing the movement', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Identifies which client application recorded the movement', required: false })
  @IsString()
  @IsOptional()
  sourceApp?: string;

  @ApiProperty({ description: 'The unique category database reference identifier' })
  @IsInt()
  @IsNotEmpty()
  categoryId: number;

  @ApiProperty({ description: 'The unique payment method database reference identifier' })
  @IsInt()
  @IsNotEmpty()
  paymentMethodId: number;

  @ApiProperty({ description: 'ID de la cuenta financiera asociada al movimiento', required: false })
  @IsInt()
  @IsOptional()
  accountId?: number;

  @ApiProperty({ description: 'ID de la cuenta destino (para transferencias futuras)', required: false })
  @IsInt()
  @IsOptional()
  destinationAccountId?: number;

  @ApiProperty({ description: 'ID de la tarjeta de crédito (si el medio de pago es TC)', required: false })
  @IsInt()
  @IsOptional()
  creditCardId?: number;

  @ApiProperty({ description: 'Número de cuotas a diferir la compra', required: false })
  @IsInt()
  @Min(1)
  @IsOptional()
  installments?: number;
}
