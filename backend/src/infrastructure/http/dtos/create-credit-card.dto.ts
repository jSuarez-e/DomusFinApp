// backend/src/infrastructure/http/dtos/create-credit-card.dto.ts
import { IsInt, IsNotEmpty, IsNumber, IsString, Length, Max, Min, IsBoolean, IsOptional, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateCreditCardDto as ICreateCreditCardDto } from '@shared/index';

export class CreateCreditCardDto implements ICreateCreditCardDto {
  @ApiProperty({ description: 'Alias o nombre personalizado para la tarjeta', example: 'Visa Premium' })
  @IsString()
  @IsNotEmpty()
  aliasName: string;

  @ApiProperty({ description: 'Últimos 4 dígitos de la tarjeta', example: '1234' })
  @IsString()
  @Length(4, 4)
  @IsNotEmpty()
  lastFourDigits: string;

  @ApiProperty({ description: 'Tasa de interés efectiva mensual (%)', example: 2.35 })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  interestRate: number;

  @ApiProperty({ description: 'Tasa de interés de mora (%)', example: 3.12 })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  lateFeeRate: number;

  @ApiProperty({ description: 'Cuota de manejo mensual ($)', example: 15000 })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  handlingFee: number;

  @ApiProperty({ description: 'Seguro de vida ($)', example: 2500, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  lifeInsurance?: number;

  @ApiProperty({ description: 'Otros cargos ($)', example: 1000, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  otherCharges?: number;

  @ApiProperty({ description: 'Día de corte de la tarjeta (1-31)', example: 15 })
  @IsInt()
  @Min(1)
  @Max(31)
  @IsNotEmpty()
  cutDate: number;

  @ApiProperty({ description: 'Día límite de pago de la tarjeta (1-31)', example: 5 })
  @IsInt()
  @Min(1)
  @Max(31)
  @IsNotEmpty()
  paymentDueDate: number;

  @ApiProperty({ description: 'Indica si la tarjeta es privada (solo visible para el dueño)', example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isPrivate?: boolean;

  @ApiProperty({ description: 'IDs de usuarios con los que se comparte la tarjeta', type: [Number], required: false })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  participantIds?: number[];
}
