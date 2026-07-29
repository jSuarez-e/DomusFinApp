// backend/src/infrastructure/http/dtos/settings.dto.ts
import { IsEmail, IsNotEmpty, IsString, MinLength, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { 
  UpdatePasswordDto as IUpdatePasswordDto, 
  UpdateEmailDto as IUpdateEmailDto, 
  UpdatePreferencesDto as IUpdatePreferencesDto 
} from '@shared/index';

export class UpdatePasswordDto implements IUpdatePasswordDto {
  @ApiProperty({ description: 'The current password of the user' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  currentPassword?: string;

  @ApiProperty({ description: 'The new password of the user' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  newPassword?: string;
}

export class UpdateEmailDto implements IUpdateEmailDto {
  @ApiProperty({ description: 'The new email address of the user' })
  @IsEmail()
  @IsNotEmpty()
  newEmail?: string;
}

export class UpdatePreferencesDto implements IUpdatePreferencesDto {
  @ApiProperty({ description: 'The preferred currency', example: 'COP' })
  @IsString()
  @IsNotEmpty()
  @IsIn(['COP', 'USD'])
  currency?: string;

  @ApiProperty({ description: 'The preferred date format', example: 'DD/MM/YYYY' })
  @IsString()
  @IsNotEmpty()
  @IsIn(['DD/MM/YYYY', 'MM/DD/YYYY'])
  dateFormat?: string;
}
