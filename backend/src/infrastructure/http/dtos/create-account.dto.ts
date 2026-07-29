// backend/src/infrastructure/http/dtos/create-account.dto.ts
import { IsEnum, IsNotEmpty, IsNumber, IsString, Min, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateAccountDto as ICreateAccountDto } from '@shared/index';
import { AccountType } from '@shared/index';

/**
 * DTO de validación para la creación de una nueva cuenta financiera.
 */
export class CreateAccountDto implements ICreateAccountDto {
  @ApiProperty({ description: 'Nombre descriptivo de la cuenta', example: 'Bancolombia Ahorros' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Tipo de cuenta financiera', enum: AccountType, example: AccountType.BANK })
  @IsEnum(AccountType)
  @IsNotEmpty()
  type: AccountType;

  @ApiProperty({ description: 'Saldo inicial de la cuenta en pesos colombianos', example: 500000 })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  initialBalance: number;

  @ApiProperty({ description: 'Indica si la cuenta es privada', example: false })
  @IsBoolean()
  @IsNotEmpty()
  isPrivate: boolean;
}
