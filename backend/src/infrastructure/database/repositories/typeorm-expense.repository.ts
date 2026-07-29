// backend/src/infrastructure/database/repositories/typeorm-expense.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IExpenseRepository } from '../../../core/repositories/expense-repository.interface';
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
   * @returns {Promise<ExpenseDbEntity | null>} El gasto encontrado o null si no existe.
   */
  async findById(id: number): Promise<ExpenseDbEntity | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['category', 'user'],
    });
  }

  /**
   * Recupera todos los gastos pertenecientes a un hogar determinado, ordenados de forma descendente por fecha.
   * 
   * @param {number} householdId ID único del hogar.
   * @returns {Promise<ExpenseDbEntity[]>} Lista de gastos del hogar.
   */
  async findByHousehold(householdId: number): Promise<ExpenseDbEntity[]> {
    return this.repository.find({
      where: { householdId },
      relations: ['category', 'user'],
      order: { date: 'DESC' },
    });
  }

  /**
   * Guarda o actualiza un registro de gasto en la base de datos.
   * 
   * @param {Partial<ExpenseDbEntity>} expense Objeto con los campos parciales a guardar.
   * @returns {Promise<ExpenseDbEntity>} El registro de gasto persistido en base de datos.
   */
  async save(expense: Partial<ExpenseDbEntity>): Promise<ExpenseDbEntity> {
    const dbEntity = this.repository.create(expense);
    return this.repository.save(dbEntity);
  }
}
