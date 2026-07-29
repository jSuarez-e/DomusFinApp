// shared/dtos/register.dto.ts
export interface RegisterDto {
  username: string;
  email: string;
  password: string;
  invitationCode?: string;
}
