// shared/dtos/create-account.dto.ts
import { AccountType } from '../models/account.model';

export interface CreateAccountDto {
  name: string;
  type: AccountType;
  initialBalance: number;
  isPrivate: boolean;
}
