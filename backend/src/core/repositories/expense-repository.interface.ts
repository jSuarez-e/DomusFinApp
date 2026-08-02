// backend/src/core/repositories/expense-repository.interface.ts
import { ExpenseEntity } from '../entities/expense.entity';

/**
 * Core repository interface for Expense entities.
 * Defines strict asynchronous persistence operations for the domain.
 */
export interface IExpenseRepository {
  /**
   * Finds an expense by its unique identifier.
   * @param {number} id - The ID of the expense.
   * @returns {Promise<ExpenseEntity | null>} The expense entity if found, otherwise null.
   */
  findById(id: number): Promise<ExpenseEntity | null>;

  /**
   * Finds all expenses associated with a specific household.
   * @param {number} householdId - The ID of the household.
   * @returns {Promise<ExpenseEntity[]>} A list of expense entities.
   */
  findByHousehold(householdId: number): Promise<ExpenseEntity[]>;

  /**
   * Saves a new or existing expense entity.
   * @param {Partial<ExpenseEntity>} expense - The expense data to save.
   * @returns {Promise<ExpenseEntity>} The saved expense entity.
   */
  save(expense: Partial<ExpenseEntity>): Promise<ExpenseEntity>;
}
