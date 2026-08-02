// backend/src/infrastructure/http/controllers/auth.controller.ts
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

import { AuthService } from '../services/auth.service';
import { RegisterDto } from '../dtos/register.dto';
import { ForgotPasswordDto } from '../dtos/forgot-password.dto';
import { ResetPasswordDto } from '../dtos/reset-password.dto';
import { LoginResponseDto } from '@shared/index';

/**
 * DTO interno para la solicitud de inicio de sesión.
 */
class LoginDto {
  @IsString()
  @IsNotEmpty()
  usernameOrEmail: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user and return a JWT access token' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(dto.usernameOrEmail, dto.password);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user inside a new or existing Household (Tenant)' })
  @ApiResponse({ status: 201, description: 'Registration successful' })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async register(@Body() dto: RegisterDto): Promise<Record<string, unknown>> {
    return this.authService.register(dto);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password recovery email' })
  @ApiResponse({ status: 200, description: 'Recovery instructions simulation triggered' })
  @ApiResponse({ status: 404, description: 'Email not found' })
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<Record<string, unknown>> {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset user password using token verification' })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  @ApiResponse({ status: 401, description: 'Invalid/expired token' })
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<Record<string, unknown>> {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }
}
