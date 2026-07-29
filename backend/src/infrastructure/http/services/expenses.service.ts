// backend/src/infrastructure/http/services/expenses.service.ts
import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IExpenseRepository } from '../../../core/repositories/expense-repository.interface';
import { CreateExpenseDto } from '../dtos/create-expense.dto';
import { ExpenseDbEntity } from '../../database/entities/expense.entity';
import { CategoryDbEntity } from '../../database/entities/category.entity';
import { NativeCaptureExpenseDto } from '../dtos/native-capture.dto';
import { User } from '@shared/index';

@Injectable()
export class ExpensesService {
  constructor(
    @Inject('IExpenseRepository')
    private readonly expenseRepository: IExpenseRepository,
    @InjectRepository(CategoryDbEntity)
    private readonly categoryRepository: Repository<CategoryDbEntity>,
  ) {}

  /**
   * Registra un nuevo gasto en el sistema asociado a un usuario y su hogar.
   * 
   * @param {CreateExpenseDto} dto DTO que contiene los datos del gasto a crear.
   * @param {User} user Usuario autenticado que realiza el registro del gasto.
   * @returns {Promise<ExpenseDbEntity>} El registro del gasto creado guardado en base de datos.
   * @throws {BadRequestException} Si el usuario no pertenece a ningún hogar.
   */
  async createExpense(dto: CreateExpenseDto, user: User): Promise<ExpenseDbEntity> {
    if (!user.householdId) {
      throw new BadRequestException('User does not belong to any household.');
    }

    const expenseData: Partial<ExpenseDbEntity> = {
      amount: dto.amount,
      description: dto.description,
      categoryId: dto.categoryId,
      isPrivate: dto.isPrivate ?? false,
      userId: user.id,
      householdId: user.householdId,
      date: dto.date ? new Date(dto.date) : new Date(),
    };

    return this.expenseRepository.save(expenseData);
  }

  /**
   * Obtiene todos los gastos conjuntos de un hogar específico.
   * 
   * @param {number} householdId ID único del hogar del cual se desean consultar los gastos.
   * @returns {Promise<ExpenseDbEntity[]>} Listado con los gastos pertenecientes a dicho hogar.
   */
  async getExpensesForHousehold(householdId: number): Promise<ExpenseDbEntity[]> {
    return this.expenseRepository.findByHousehold(householdId);
  }

  /**
   * Obtiene los detalles de un gasto individual por su ID, validando que pertenezca al hogar del usuario actual.
   * 
   * @param {number} id ID único del gasto.
   * @param {User} user Usuario autenticado que solicita consultar el gasto.
   * @returns {Promise<ExpenseDbEntity>} El registro detallado del gasto.
   * @throws {NotFoundException} Si el gasto con el ID provisto no existe.
   * @throws {BadRequestException} Si el gasto pertenece a un hogar distinto al del usuario actual.
   */
  async getExpenseById(id: number, user: User): Promise<ExpenseDbEntity> {
    const expense = await this.expenseRepository.findById(id);
    if (!expense) {
      throw new NotFoundException('Expense not found.');
    }

    if (expense.householdId !== user.householdId) {
      throw new BadRequestException('Access denied. Expense belongs to another household.');
    }

    return expense;
  }

  /**
   * Registra un gasto a partir de los datos extraídos por la captura automática nativa.
   * Si no se especifica una categoría o no existe, busca o crea la categoría por defecto "Captura Automática".
   * 
   * @param {NativeCaptureExpenseDto} dto DTO que contiene los datos del gasto capturado.
   * @param {User} user Usuario autenticado propietario de la captura.
   * @returns {Promise<ExpenseDbEntity>} El registro del gasto creado en base de datos.
   * @throws {BadRequestException} Si el usuario no pertenece a ningún hogar.
   */
  async createExpenseFromNativeCapture(dto: NativeCaptureExpenseDto, user: User): Promise<ExpenseDbEntity> {
    if (!user.householdId) {
      throw new BadRequestException('User does not belong to any household.');
    }

    let categoryId = dto.categoryId;

    if (!categoryId) {
      // Intentar buscar la categoría "Captura Automática" del hogar de este usuario
      let category = await this.categoryRepository.findOne({
        where: {
          name: 'Captura Automática',
          householdId: user.householdId,
        },
      });

      // Si no existe, crearla dinámicamente
      if (!category) {
        category = this.categoryRepository.create({
          name: 'Captura Automática',
          householdId: user.householdId,
          isGlobal: false,
        });
        category = await this.categoryRepository.save(category);
      }

      categoryId = category.id;
    }

    const expenseData: Partial<ExpenseDbEntity> = {
      amount: dto.amount,
      description: dto.description,
      categoryId: categoryId,
      isPrivate: false, // Los gastos de captura automática no son privados por defecto
      userId: user.id,
      householdId: user.householdId,
      date: dto.date ? new Date(dto.date) : new Date(),
    };

    return this.expenseRepository.save(expenseData);
  }
}

