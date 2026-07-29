// backend/src/infrastructure/http/dtos/register.dto.ts
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RegisterDto as IRegisterDto } from '@shared/index';

export class RegisterDto implements IRegisterDto {
  @ApiProperty({ description: 'The unique username of the user' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ description: 'The email address of the user' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'The client-encrypted password hash' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ description: 'Optional invitation code to join an existing household', required: false })
  @IsString()
  @IsOptional()
  invitationCode?: string;
}
