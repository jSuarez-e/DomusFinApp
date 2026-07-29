// backend/src/infrastructure/http/dtos/reset-password.dto.ts
import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ResetPasswordDto as IResetPasswordDto } from '@shared/index';

export class ResetPasswordDto implements IResetPasswordDto {
  @ApiProperty({ description: 'The recovery token sent via simulation/email' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ description: 'The new client-encrypted password hash' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  newPassword: string;
}
