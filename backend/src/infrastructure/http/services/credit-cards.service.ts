// backend/src/infrastructure/http/services/credit-cards.service.ts
import { BadRequestException, ConflictException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, IsNull } from 'typeorm';

import { CreditCardDbEntity } from '../../database/entities/credit-card.entity';
import { AccountDbEntity } from '../../database/entities/account.entity';
import { MovementDbEntity } from '../../database/entities/movement.entity';
import { CategoryDbEntity } from '../../database/entities/category.entity';
import { PaymentMethodDbEntity } from '../../database/entities/payment-method.entity';
import { UserDbEntity } from '../../database/entities/user.entity';
import { CreateCreditCardDto } from '../dtos/create-credit-card.dto';
import { PayCreditCardDto } from '../dtos/pay-credit-card.dto';
import { User, AmortizationPeriod, TransactionType } from '@shared/index';

@Injectable()
export class CreditCardsService {
  constructor(
    @InjectRepository(CreditCardDbEntity)
    private readonly creditCardRepository: Repository<CreditCardDbEntity>,
    @InjectRepository(AccountDbEntity)
    private readonly accountRepository: Repository<AccountDbEntity>,
    @InjectRepository(MovementDbEntity)
    private readonly movementRepository: Repository<MovementDbEntity>,
    @InjectRepository(CategoryDbEntity)
    private readonly categoryRepository: Repository<CategoryDbEntity>,
    @InjectRepository(PaymentMethodDbEntity)
    private readonly paymentMethodRepository: Repository<PaymentMethodDbEntity>,
    @InjectRepository(UserDbEntity)
    private readonly userRepository: Repository<UserDbEntity>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Registra una nueva tarjeta de crédito para el hogar activo del usuario.
   */
  async create(dto: CreateCreditCardDto, user: User): Promise<CreditCardDbEntity> {
    if (!user.householdId) {
      throw new BadRequestException('El usuario no pertenece a ningún hogar.');
    }

    const existing = await this.creditCardRepository.findOne({
      where: { aliasName: dto.aliasName, householdId: user.householdId },
    });

    if (existing) {
      throw new ConflictException(`Ya existe una tarjeta con el alias "${dto.aliasName}" en este hogar.`);
    }
    const isPrivate = dto.isPrivate ?? true;

    let participants: UserDbEntity[] = [];
    if (dto.participantIds && dto.participantIds.length > 0) {
      participants = await this.userRepository.createQueryBuilder('user')
        .where('user.id IN (:...ids)', { ids: dto.participantIds })
        .andWhere('user.householdId = :householdId', { householdId: user.householdId })
        .getMany();
    }

    const card = this.creditCardRepository.create({
      aliasName: dto.aliasName,
      lastFourDigits: dto.lastFourDigits,
      interestRate: dto.interestRate,
      lateFeeRate: dto.lateFeeRate,
      handlingFee: dto.handlingFee,
      cutDate: dto.cutDate,
      paymentDueDate: dto.paymentDueDate,
      currentDebt: 0,
      householdId: user.householdId,
      userId: user.id,
      isPrivate,
      participants,
    });

    return this.creditCardRepository.save(card);
  }

  /**
   * Obtiene todas las tarjetas de crédito de un hogar (Estrictamente filtrado por usuario).
   */
  async findAllForHousehold(householdId: number, user: User): Promise<CreditCardDbEntity[]> {
    return await this.creditCardRepository.createQueryBuilder('tc')
      .leftJoinAndSelect('tc.participants', 'participant')
      .where('tc.householdId = :householdId', { householdId })
      .andWhere('(tc.userId = :userId OR tc.isPrivate = false OR participant.id = :userId)', { userId: user.id })
      .orderBy('tc.createdAt', 'DESC')
      .getMany();
  }

  /**
   * Obtiene una tarjeta de crédito por ID (Estrictamente filtrado por usuario).
   */
  async findOne(id: number, householdId: number, user: User): Promise<CreditCardDbEntity> {
    const card = await this.creditCardRepository.createQueryBuilder('tc')
      .leftJoinAndSelect('tc.participants', 'participant')
      .where('tc.id = :id', { id })
      .andWhere('tc.householdId = :householdId', { householdId })
      .andWhere('(tc.userId = :userId OR tc.isPrivate = false OR participant.id = :userId)', { userId: user.id })
      .getOne();

    if (!card) {
      throw new NotFoundException(`Tarjeta de crédito con ID ${id} no encontrada en este hogar.`);
    }

    return card;
  }

  /**
   * Simula el plan de pagos de amortización utilizando el sistema francés.
   */
  simulate(amount: number, interestRate: number, installments: number): AmortizationPeriod[] {
    if (amount <= 0 || installments <= 0) {
      throw new BadRequestException('El monto y las cuotas deben ser mayores a cero.');
    }

    const i = interestRate / 100; // Convertir porcentaje a decimal (tasa mensual)
    let monthlyFee = 0;

    if (i === 0) {
      monthlyFee = amount / installments;
    } else {
      monthlyFee = amount * (i * Math.pow(1 + i, installments)) / (Math.pow(1 + i, installments) - 1);
    }

    const plan: AmortizationPeriod[] = [];
    let remainingBalance = amount;
    const now = new Date();

    for (let period = 1; period <= installments; period++) {
      const interest = remainingBalance * i;
      const capital = monthlyFee - interest;
      remainingBalance = remainingBalance - capital;

      // Calcular fecha proyectada (un mes después por periodo)
      const dueDate = new Date(now.getFullYear(), now.getMonth() + period, now.getDate());

      plan.push({
        period,
        capital: Number(capital.toFixed(2)),
        interest: Number(interest.toFixed(2)),
        totalFee: Number(monthlyFee.toFixed(2)),
        remainingBalance: Number(Math.max(0, remainingBalance).toFixed(2)),
        dueDate: dueDate.toISOString(),
      });
    }

    return plan;
  }

  /**
   * Lógica transaccional ACID para pagar una tarjeta de crédito debitando fondos de una cuenta.
   * 
   * @param dto - El DTO con los detalles del pago de la tarjeta de crédito.
   * @param user - El usuario que realiza la transacción.
   * @returns El registro de movimiento guardado en la base de datos.
   * @throws BadRequestException - Si el usuario no pertenece a un hogar o el monto es menor o igual a cero.
   * @throws NotFoundException - Si la cuenta o la tarjeta de crédito no son encontradas en el hogar.
   */
  async pay(dto: PayCreditCardDto, user: User): Promise<MovementDbEntity> {
    const { householdId } = user;
    if (!householdId) {
      throw new BadRequestException('El usuario no pertenece a ningún hogar.');
    }

    return this.dataSource.transaction(async (manager) => {
      // 1. Validar cuenta bancaria
      const account = await manager.findOne(AccountDbEntity, {
        where: { id: dto.accountId, householdId },
      });
      if (!account) {
        throw new NotFoundException(`Cuenta de origen con ID ${dto.accountId} no encontrada en este hogar.`);
      }

      // 2. Validar tarjeta de crédito
      const creditCard = await manager.findOne(CreditCardDbEntity, {
        where: { id: dto.creditCardId, householdId },
      });
      if (!creditCard) {
        throw new NotFoundException(`Tarjeta de crédito con ID ${dto.creditCardId} no encontrada en este hogar.`);
      }

      const payAmount = Number(dto.amount);
      if (payAmount <= 0) {
        throw new BadRequestException('El monto a pagar debe ser mayor a cero.');
      }

      // 3. Modificar saldos
      account.currentBalance = Number(account.currentBalance) - payAmount;
      creditCard.currentDebt = Number(creditCard.currentDebt) - payAmount;

      await manager.save(AccountDbEntity, account);
      await manager.save(CreditCardDbEntity, creditCard);

      // 4. Buscar categoría por defecto "Servicios" u "Otros" para asociar al pago
      let category = await manager.findOne(CategoryDbEntity, {
        where: { name: 'Otros', householdId },
      });
      if (!category) {
        category = await manager.findOne(CategoryDbEntity, {
          where: { isGlobal: true },
        });
      }
      if (!category) {
        throw new BadRequestException('No se encontró ninguna categoría para asociar al movimiento de pago.');
      }

      // 5. Buscar medio de pago por defecto "Transferencia Bancaria"
      let paymentMethod = await manager.findOne(PaymentMethodDbEntity, {
        where: { name: 'Transferencia Bancaria', householdId },
      });
      if (!paymentMethod) {
        paymentMethod = await manager.findOne(PaymentMethodDbEntity, {
          where: { householdId },
        });
      }
      if (!paymentMethod) {
        paymentMethod = await manager.findOne(PaymentMethodDbEntity, {
          where: { householdId: IsNull() },
        });
      }
      if (!paymentMethod) {
        throw new BadRequestException('No se encontró ningún medio de pago para asociar.');
      }

      // 6. Crear movimiento CC_PAYMENT
      const movement = manager.create(MovementDbEntity, {
        amount: payAmount,
        transactionDate: new Date(),
        type: 'Pago TC', // Corresponde al valor en español del enum para mantener la BD limpia
        isPrivate: true,
        description: `Pago de Tarjeta de Crédito ${creditCard.aliasName}`,
        sourceApp: 'Webapp',
        userId: user.id,
        householdId,
        categoryId: category.id,
        paymentMethodId: paymentMethod.id,
        accountId: account.id,
        creditCardId: creditCard.id,
        installments: 1,
      });

      return manager.save(MovementDbEntity, movement);
    });
  }

  /**
   * Elimina una tarjeta de crédito si cumple las condiciones de deuda cero y permisos de administrador para compartidas.
   * 
   * @param id ID único de la tarjeta de crédito.
   * @param user Usuario solicitante.
   */
  async remove(id: number, user: User): Promise<void> {
    const card = await this.findOne(id, user.householdId!, user);

    if (Number(card.currentDebt) !== 0) {
      throw new BadRequestException('La deuda de la tarjeta de crédito debe ser cero para poder eliminarla.');
    }

    if (!card.isPrivate && user.role !== 'admin') {
      throw new ForbiddenException('Solo el administrador del hogar puede eliminar una tarjeta de crédito compartida.');
    }

    await this.creditCardRepository.remove(card);
  }
}
