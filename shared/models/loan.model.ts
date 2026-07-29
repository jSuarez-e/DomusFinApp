// shared/models/loan.model.ts
import { User } from './user.model';

export interface Loan {
  id: number;
  purposeDescription: string;
  initialPrincipal: number;
  currentBalance: number;
  interestRate: number;
  handlingFee: number;
  lifeInsurance: number;
  otherCharges: number;
  isPrivate: boolean;
  creatorId: number;
  creator?: User;
  householdId: number;
  participants?: User[];
  createdAt: Date;
  updatedAt: Date;
}
