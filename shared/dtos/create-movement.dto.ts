// shared/dtos/create-movement.dto.ts
import { TransactionType } from '../models/transaction-type.enum';

export interface CreateMovementDto {
  amount: number;
  transactionDate?: string;
  type: TransactionType | 'Gasto' | 'Ingreso';
  isPrivate?: boolean;
  description?: string;
  sourceApp?: string;
  categoryId: number;
  paymentMethodId: number;
  accountId?: number;
  destinationAccountId?: number;
  creditCardId?: number;
  installments?: number;
}
