// shared/models/movement.model.ts
import { TransactionType } from './transaction-type.enum';

export interface Movement {
  id: number;
  amount: number;
  transactionDate: Date;
  type: TransactionType | 'Gasto' | 'Ingreso';
  isPrivate: boolean;
  description: string | null;
  sourceApp: string | null;
  userId: number;
  householdId: number;
  categoryId: number;
  paymentMethodId: number;
  accountId: number | null;
  destinationAccountId?: number | null;
  creditCardId?: number | null;
  installments?: number | null;
  is_auto_captured?: boolean;
  isPrivateRedacted?: boolean;
  user?: {
    id?: number;
    name?: string;
    email?: string;
    role?: string;
  };
  account?: {
    id: number;
    name: string;
    type: string;
  };
  destinationAccount?: {
    id: number;
    name: string;
    type: string;
  };
  creditCard?: {
    id: number;
    aliasName: string;
    lastFourDigits: string;
  };
}
