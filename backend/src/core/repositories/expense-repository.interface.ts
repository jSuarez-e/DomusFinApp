// backend/src/core/repositories/expense-repository.interface.ts
import { ExpenseDbEntity as ExpenseEntity } from '../../infrastructure/database/entities/expense.entity';

export interface IExpenseRepository {
  findById(id: number): Promise<ExpenseEntity | null>;
  findByHousehold(householdId: number): Promise<ExpenseEntity[]>;
  save(expense: Partial<ExpenseEntity>): Promise<ExpenseEntity>;
}
