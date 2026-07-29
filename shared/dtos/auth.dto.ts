export interface LoginResponseDto {
  accessToken: string;
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
}
