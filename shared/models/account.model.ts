// shared/models/account.model.ts

export enum AccountType {
  BANK = 'BANK',
  CASH = 'CASH',
  WALLET = 'WALLET',
}

export interface Account {
  id: number;
  name: string;
  type: AccountType;
  initialBalance: number;
  currentBalance: number;
  isPrivate: boolean;
  createdAt: Date;
  householdId: number;
  userId: number;
  user?: {
    id: number;
    name: string;
  };
}
