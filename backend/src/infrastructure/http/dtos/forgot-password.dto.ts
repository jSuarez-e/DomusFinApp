// backend/src/infrastructure/http/dtos/forgot-password.dto.ts
import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ForgotPasswordDto as IForgotPasswordDto } from '@shared/index';

export class ForgotPasswordDto implements IForgotPasswordDto {
  @ApiProperty({ description: 'The registered email address of the user' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
