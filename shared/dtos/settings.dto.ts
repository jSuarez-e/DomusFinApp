// shared/dtos/settings.dto.ts

export interface UpdatePasswordDto {
  currentPassword?: string;
  newPassword?: string;
}

export interface UpdateEmailDto {
  newEmail?: string;
}

export interface UpdatePreferencesDto {
  currency?: string;
  dateFormat?: string;
}
