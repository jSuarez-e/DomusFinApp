// shared/models/savings-goal.model.ts
import { User } from './user.model';

export interface SavingsGoal {
  id: number;
  title: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  isPrivate: boolean;
  creatorId: number;
  creator?: User;
  householdId: number;
  participants?: User[];
  createdAt: Date;
  updatedAt: Date;
}
