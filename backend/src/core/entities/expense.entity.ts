import { Expense as IExpense } from '@shared/index';

/**
 * Domain entity representing an Expense within the system core.
 * Ensures data immutability for domain operations.
 */
export class ExpenseEntity implements IExpense {
  readonly id: number;
  readonly amount: number;
  readonly description: string;
  readonly date: Date;
  readonly isPrivate: boolean;
  readonly categoryId: number;
  readonly userId: number;
  readonly householdId: number;
  readonly createdAt: Date;

  /**
   * Initializes a new instance of the ExpenseEntity.
   * @param {Partial<ExpenseEntity>} partial - Partial expense data to initialize the entity.
   */
  constructor(partial: Partial<ExpenseEntity>) {
    Object.assign(this, partial);
  }
}
