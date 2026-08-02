// backend/src/infrastructure/database/repositories/typeorm-expense.repository.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IExpenseRepository } from '../../../core/repositories/expense-repository.interface';
import { ExpenseEntity } from '../../../core/entities/expense.entity';
import { ExpenseDbEntity } from '../entities/expense.entity';

@Injectable()
export class TypeOrmExpenseRepository implements IExpenseRepository {
  constructor(
    @InjectRepository(ExpenseDbEntity)
    private readonly repository: Repository<ExpenseDbEntity>,
  ) {}

  /**
   * Busca un gasto en la base de datos por su identificador único, incluyendo relaciones con categorías y creador.
   * 
   * @param {number} id ID único del gasto.
   * @returns {Promise<ExpenseEntity | null>} El gasto encontrado o null si no existe.
   */
  async findById(id: number): Promise<ExpenseEntity | null> {
    try {
      const expense = await this.repository.findOne({
        where: { id },
        relations: ['category', 'user'],
      });
      return expense ? new ExpenseEntity(expense) : null;
    } catch (error) {
      throw new InternalServerErrorException('Error al buscar el gasto en la base de datos');
    }
  }

  /**
   * Recupera todos los gastos pertenecientes a un hogar determinado, ordenados de forma descendente por fecha.
   * 
   * @param {number} householdId ID único del hogar.
   * @returns {Promise<ExpenseEntity[]>} Lista de gastos del hogar.
   */
  async findByHousehold(householdId: number): Promise<ExpenseEntity[]> {
    try {
      const expenses = await this.repository.find({
        where: { householdId },
        relations: ['category', 'user'],
        order: { date: 'DESC' },
      });
      return expenses.map(exp => new ExpenseEntity(exp));
    } catch (error) {
      throw new InternalServerErrorException('Error al recuperar los gastos del hogar');
    }
  }

  /**
   * Guarda o actualiza un registro de gasto en la base de datos.
   * 
   * @param {Partial<ExpenseEntity>} expense Objeto con los campos parciales a guardar.
   * @returns {Promise<ExpenseEntity>} El registro de gasto persistido en base de datos.
   */
  async save(expense: Partial<ExpenseEntity>): Promise<ExpenseEntity> {
    try {
      const dbEntity = this.repository.create(expense);
      const saved = await this.repository.save(dbEntity);
      return new ExpenseEntity(saved);
    } catch (error) {
      throw new InternalServerErrorException('Error al persistir el gasto en la base de datos');
    }
  }
}
