export interface Expense {
  id: number;
  amount: number;
  description: string;
  date: Date;
  isPrivate: boolean;
  categoryId: number;
  userId: number;
  householdId: number;
  createdAt: Date;
}
