// backend/src/infrastructure/http/dtos/update-account.dto.ts
import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UpdateAccountDto as IUpdateAccountDto } from '@shared/index';

/**
 * DTO de validación para la actualización parcial de una cuenta financiera.
 */
export class UpdateAccountDto implements IUpdateAccountDto {
  @ApiProperty({ description: 'Nuevo nombre de la cuenta', example: 'Bancolombia Corriente', required: false })
  @IsString()
  @IsOptional()
  name?: string;
}
