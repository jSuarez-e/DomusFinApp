// backend/src/infrastructure/http/services/movements.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, Between, Brackets, IsNull } from 'typeorm';

import { MovementDbEntity } from '../../database/entities/movement.entity';
import { AccountDbEntity } from '../../database/entities/account.entity';
import { CreditCardDbEntity } from '../../database/entities/credit-card.entity';
import { CategoryDbEntity } from '../../database/entities/category.entity';
import { PaymentMethodDbEntity } from '../../database/entities/payment-method.entity';
import { CreateMovementDto } from '../dtos/create-movement.dto';
import { User, CategoryType } from '@shared/index';

@Injectable()
export class MovementsService {
  constructor(
    @InjectRepository(MovementDbEntity)
    private readonly movementRepository: Repository<MovementDbEntity>,
    @InjectRepository(AccountDbEntity)
    private readonly accountRepository: Repository<AccountDbEntity>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Registra un nuevo movimiento financiero con lógica transaccional ACID.
   * Actualiza automáticamente el saldo de la cuenta involucrada.
   *
   * @param {CreateMovementDto} dto DTO con los datos del movimiento.
   * @param {User} user Usuario autenticado en sesión.
   * @returns {Promise<MovementDbEntity>} El movimiento guardado.
   * @throws {BadRequestException} Si el usuario no pertenece a un hogar.
   * @throws {NotFoundException} Si la cuenta no existe o no pertenece al hogar.
   */
  async create(dto: CreateMovementDto, user: User): Promise<MovementDbEntity> {
    if (!user.householdId) {
      throw new BadRequestException('El usuario no pertenece a ningún hogar.');
    }

    return this.dataSource.transaction(async (manager) => {
      let isPrivate = dto.isPrivate ?? false;

      // Verificar que la cuenta origen existe y pertenece al hogar
      if (dto.accountId) {
        const account = await manager.findOne(AccountDbEntity, {
          where: { id: dto.accountId, householdId: user.householdId! },
        });

        if (!account) {
          throw new NotFoundException(`Cuenta con ID ${dto.accountId} no encontrada en este hogar.`);
        }

        isPrivate = account.isPrivate;

        // Ajustar saldo según tipo de movimiento
        const amount = Number(dto.amount);
        if (dto.type === 'Ingreso') {
          account.currentBalance = Number(account.currentBalance) + amount;
        } else {
          // Gasto, Ahorro, Pago Crédito, Pago TC → restan del saldo
          account.currentBalance = Number(account.currentBalance) - amount;
        }

        await manager.save(AccountDbEntity, account);

        // Si existe cuenta destino (transferencias futuras), sumar al destino
        if (dto.destinationAccountId) {
          const destAccount = await manager.findOne(AccountDbEntity, {
            where: { id: dto.destinationAccountId, householdId: user.householdId! },
          });

          if (!destAccount) {
            throw new NotFoundException(`Cuenta destino con ID ${dto.destinationAccountId} no encontrada en este hogar.`);
          }

          destAccount.currentBalance = Number(destAccount.currentBalance) + amount;
          await manager.save(AccountDbEntity, destAccount);
        }
      }

      // Verificar y actualizar deuda de la tarjeta de crédito
      if (dto.creditCardId) {
        const creditCard = await manager.findOne(CreditCardDbEntity, {
          where: { id: dto.creditCardId, householdId: user.householdId! },
        });

        if (!creditCard) {
          throw new NotFoundException(`Tarjeta de crédito con ID ${dto.creditCardId} no encontrada en este hogar.`);
        }

        isPrivate = true;

        const amount = Number(dto.amount);
        if (dto.type === 'Ingreso') {
          creditCard.currentDebt = Number(creditCard.currentDebt) - amount;
        } else {
          // Gasto, etc. aumenta la deuda de la tarjeta
          creditCard.currentDebt = Number(creditCard.currentDebt) + amount;
        }

        await manager.save(CreditCardDbEntity, creditCard);
      }

      // Crear y guardar el movimiento dentro de la misma transacción
      const movement = manager.create(MovementDbEntity, {
        amount: dto.amount,
        transactionDate: dto.transactionDate ? new Date(dto.transactionDate) : new Date(),
        type: dto.type,
        isPrivate,
        description: dto.description || undefined,
        sourceApp: dto.sourceApp || 'Webapp',
        userId: user.id,
        householdId: user.householdId!,
        categoryId: dto.categoryId,
        paymentMethodId: dto.paymentMethodId,
        accountId: dto.accountId || null,
        destinationAccountId: dto.destinationAccountId || null,
        creditCardId: dto.creditCardId || null,
        installments: dto.installments || null,
      });

      return manager.save(MovementDbEntity, movement);
    });
  }

  /**
   * Obtiene todos los movimientos registrados para un hogar.
   *
   * @param {number} householdId ID único del hogar.
   */
  async findAllForHousehold(householdId: number, user: User): Promise<MovementDbEntity[]> {
    return await this.movementRepository.createQueryBuilder('entity')
      .leftJoinAndSelect('entity.category', 'category')
      .leftJoinAndSelect('entity.paymentMethod', 'paymentMethod')
      .leftJoinAndSelect('entity.user', 'user')
      .leftJoinAndSelect('entity.account', 'account')
      .leftJoinAndSelect('entity.destinationAccount', 'destinationAccount')
      .leftJoinAndSelect('entity.creditCard', 'creditCard')
      .where('entity.householdId = :householdId', { householdId })
      .andWhere(new Brackets(qb => {
        qb.where('entity.isPrivate = false')
          .orWhere('entity.isPrivate = true AND entity.userId = :userId', { userId: user.id });
      }))
      .orderBy('entity.transactionDate', 'DESC')
      .getMany();
  }

  /**
   * Obtiene el resumen mensual (Total gastado, Presupuesto restante, Ingresos) y los últimos 5 movimientos.
   *
   * @param {number} householdId ID único del hogar.
   * @param {string} [monthStr] Filtro opcional de mes en formato YYYY-MM.
   * @returns {Promise<any>} Resumen del mes y últimos 5 movimientos.
   */
  async getMonthlySummary(householdId: number, monthStr?: string): Promise<any> {
    let year: number;
    let month: number;

    if (monthStr && /^\d{4}-\d{2}$/.test(monthStr)) {
      const [y, m] = monthStr.split('-').map(Number);
      year = y;
      month = m - 1;
    } else {
      const now = new Date();
      year = now.getFullYear();
      month = now.getMonth();
    }

    const startDate = new Date(year, month, 1, 0, 0, 0, 0);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

    // Consultar todos los movimientos del mes seleccionado
    const monthlyMovements = await this.movementRepository.find({
      where: {
        householdId,
        transactionDate: Between(startDate, endDate),
      },
    });

    const income = monthlyMovements
      .filter((m) => m.type === 'Ingreso')
      .reduce((sum, m) => sum + Number(m.amount), 0);

    const totalSpent = monthlyMovements
      .filter((m) => m.type === 'Gasto')
      .reduce((sum, m) => sum + Number(m.amount), 0);

    const budget = 1000.00; // Presupuesto mensual de la regla de negocio
    const remainingBudget = budget - totalSpent;

    // Obtener los últimos 5 movimientos ordenados por fecha descendente
    const recentMovements = await this.movementRepository.find({
      where: { householdId },
      relations: ['category', 'paymentMethod', 'user', 'account', 'creditCard'],
      order: { transactionDate: 'DESC' },
      take: 5,
    });

    return {
      summary: {
        totalSpent,
        remainingBudget,
        income,
      },
      recentMovements,
    };
  }

  /**
   * Procesa la captura automática de una notificación bancaria nativa,
   * extrae el monto con expresiones regulares, determina el tipo de movimiento,
   * y guarda el movimiento afectando el saldo de la cuenta correspondiente.
   * 
   * @param {string} packageName Nombre del paquete de la app que emitió la notificación.
   * @param {string} title Título de la notificación.
   * @param {string} body Cuerpo del mensaje de la notificación.
   * @param {User} user Usuario autenticado que reporta la captura.
   * @returns {Promise<MovementDbEntity>} El movimiento financiero guardado.
   */
  async autoCapture(
    packageName: string,
    title: string,
    body: string,
    user: User,
  ): Promise<MovementDbEntity> {
    if (!user.householdId) {
      throw new BadRequestException('El usuario no pertenece a ningún hogar.');
    }

    // 1. Extraer el valor numérico (monto) usando expresiones regulares
    // Busca un signo de peso seguido de números y separadores de miles/decimales
    const match = body.match(/(?:\$\s*)([0-9.,]+)/) || title.match(/(?:\$\s*)([0-9.,]+)/);
    if (!match) {
      throw new BadRequestException('No se pudo extraer el monto de la notificación.');
    }

    // Normalizar formato de moneda colombiano: quitar puntos de miles y reemplazar coma decimal
    let amountStr = match[1].replace(/\./g, '').replace(/,/g, '.');
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      throw new BadRequestException('El monto extraído no es válido.');
    }

    // 2. Determinar el tipo de transacción mediante palabras clave
    const text = (title + ' ' + body).toLowerCase();
    let type: 'Gasto' | 'Ingreso' = 'Gasto';
    if (
      text.includes('recibiste') ||
      text.includes('recibio') ||
      text.includes('recibió') ||
      text.includes('consignacion') ||
      text.includes('consignació') ||
      text.includes('abono') ||
      text.includes('transferencia de') ||
      text.includes('ingreso')
    ) {
      type = 'Ingreso';
    }

    return this.dataSource.transaction(async (manager) => {
      // 3. Obtener cuentas del hogar y mapear según banco de la notificación
      const accounts = await manager.find(AccountDbEntity, {
        where: { householdId: user.householdId! },
      });

      if (accounts.length === 0) {
        throw new NotFoundException('No se encontraron cuentas financieras en este hogar.');
      }

      let account = accounts[0]; // Fallback a la primera cuenta
      const searchStr = (packageName + ' ' + title + ' ' + body).toLowerCase();
      if (searchStr.includes('nequi')) {
        account = accounts.find((a) => a.name.toLowerCase().includes('nequi')) || account;
      } else if (searchStr.includes('daviplata')) {
        account = accounts.find((a) => a.name.toLowerCase().includes('daviplata')) || account;
      } else if (searchStr.includes('bancolombia')) {
        account = accounts.find((a) => a.name.toLowerCase().includes('bancolombia')) || account;
      }

      // 4. Buscar o crear la categoría por defecto "Por clasificar"
      let category = await manager.findOne(CategoryDbEntity, {
        where: { name: 'Por clasificar', householdId: user.householdId ?? undefined },
      });

      if (!category) {
        category = manager.create(CategoryDbEntity, {
          name: 'Por clasificar',
          icon: 'help-circle-outline',
          isGlobal: false,
          householdId: user.householdId,
          type: CategoryType.EXPENSE,
        });
        category = await manager.save(CategoryDbEntity, category);
      }

      // 5. Buscar medio de pago por defecto (Transferencia o Efectivo)
      let paymentMethod = await manager.findOne(PaymentMethodDbEntity, {
        where: { name: 'Transferencia Bancaria', householdId: user.householdId! },
      });
      if (!paymentMethod) {
        paymentMethod = await manager.findOne(PaymentMethodDbEntity, {
          where: { householdId: user.householdId! },
        });
      }
      if (!paymentMethod) {
        paymentMethod = await manager.findOne(PaymentMethodDbEntity, {
          where: { householdId: IsNull() },
        });
      }
      if (!paymentMethod) {
        throw new NotFoundException('No se encontró ningún medio de pago registrado.');
      }

      // 6. Afectar saldos de la cuenta
      if (type === 'Ingreso') {
        account.currentBalance = Number(account.currentBalance) + amount;
      } else {
        account.currentBalance = Number(account.currentBalance) - amount;
      }
      await manager.save(AccountDbEntity, account);

      // 7. Heredar la privacidad de la cuenta
      const isPrivate = account.isPrivate;

      // 8. Registrar el movimiento
      const movement = manager.create(MovementDbEntity, {
        amount,
        transactionDate: new Date(),
        type,
        isPrivate,
        description: body.length > 255 ? body.substring(0, 252) + '...' : body,
        sourceApp: 'NativeCapture', // Identificador de origen de captura
        userId: user.id,
        householdId: user.householdId!,
        categoryId: category.id,
        paymentMethodId: paymentMethod.id,
        accountId: account.id,
      });

      return manager.save(MovementDbEntity, movement);
    });
  }
}
