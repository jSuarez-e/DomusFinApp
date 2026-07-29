// backend/src/infrastructure/http/services/loans.service.ts
import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, In, IsNull, Brackets } from 'typeorm';
import { LoanDbEntity } from '../../database/entities/loan.entity';
import { AccountDbEntity } from '../../database/entities/account.entity';
import { MovementDbEntity } from '../../database/entities/movement.entity';
import { CategoryDbEntity } from '../../database/entities/category.entity';
import { PaymentMethodDbEntity } from '../../database/entities/payment-method.entity';
import { UserDbEntity } from '../../database/entities/user.entity';
import { CreateLoanDto, PayLoanDto, User, AmortizationPeriod } from '@shared/index';

@Injectable()
export class LoansService {
  constructor(
    @InjectRepository(LoanDbEntity)
    private readonly loanRepository: Repository<LoanDbEntity>,
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
   * Registra una nueva deuda/crédito en el hogar activo del usuario.
   * 
   * @param dto Los datos del crédito a registrar.
   * @param user Usuario creador.
   * @returns El registro del crédito creado.
   * @throws BadRequestException Si el usuario no pertenece a ningún hogar.
   */
  async create(dto: CreateLoanDto, user: User): Promise<LoanDbEntity> {
    if (!user.householdId) {
      throw new BadRequestException('El usuario no pertenece a ningún hogar.');
    }

    let participants: UserDbEntity[] = [];

    if (!dto.isPrivate) {
      const ids = dto.participantIds || [];
      if (!ids.includes(user.id)) {
        ids.push(user.id);
      }

      if (ids.length > 0) {
        participants = await this.userRepository.find({
          where: { id: In(ids), householdId: user.householdId, isActive: true },
        });
      }
    }

    const loan = this.loanRepository.create({
      purposeDescription: dto.purposeDescription,
      initialPrincipal: dto.initialPrincipal,
      currentBalance: dto.initialPrincipal, // Al inicio, el saldo pendiente es el capital inicial
      interestRate: dto.interestRate,
      handlingFee: dto.handlingFee || 0,
      lifeInsurance: dto.lifeInsurance || 0,
      otherCharges: dto.otherCharges || 0,
      isPrivate: dto.isPrivate,
      creatorId: user.id,
      householdId: user.householdId!,
      participants,
    });

    return this.loanRepository.save(loan);
  }

  /**
   * Obtiene todos los créditos activos del hogar del usuario aplicando políticas de privacidad.
   * 
   * @param householdId ID del hogar activo.
   * @param user Usuario solicitante.
   * @returns Listado de créditos visibles.
   */
  async findAllForHousehold(householdId: number, user: User): Promise<LoanDbEntity[]> {
    return await this.loanRepository.createQueryBuilder('entity')
      .leftJoinAndSelect('entity.participants', 'participants')
      .leftJoinAndSelect('entity.creator', 'creator')
      .where('entity.householdId = :householdId', { householdId })
      .andWhere(new Brackets(qb => {
        qb.where('entity.isPrivate = false')
          .orWhere('entity.isPrivate = true AND entity.creatorId = :creatorId', { creatorId: user.id });
      }))
      .orderBy('entity.createdAt', 'DESC')
      .getMany();
  }

  /**
   * Obtiene un crédito por su ID validando políticas de privacidad.
   * 
   * @param id ID único del crédito.
   * @param user Usuario solicitante.
   * @returns El crédito si el usuario tiene acceso.
   * @throws NotFoundException Si el crédito no existe o es privado de otro usuario.
   */
  async findOne(id: number, user: User): Promise<LoanDbEntity> {
    const loan = await this.loanRepository.findOne({
      where: [
        { id, householdId: user.householdId!, isPrivate: false },
        { id, householdId: user.householdId!, isPrivate: true, creator: { id: user.id } }
      ],
      relations: ['participants', 'creator'],
    });

    if (!loan) {
      throw new NotFoundException(`Crédito/Deuda con ID ${id} no encontrado.`);
    }

    return loan;
  }

  /**
   * Procesa un pago amortizado a un crédito debitando fondos de una cuenta.
   * Ejecuta una transacción ACID para asegurar consistencia.
   * 
   * @param id ID del crédito.
   * @param dto Los datos del pago (cuenta, capital e interés pagado).
   * @param user Usuario que registra el pago.
   * @returns El crédito actualizado.
   * @throws NotFoundException Si el crédito o cuenta no existen.
   * @throws ForbiddenException Si el usuario no cumple las reglas de privacidad de la deuda.
   * @throws BadRequestException Si los fondos son insuficientes o montos inválidos.
   */
  async pay(id: number, dto: PayLoanDto, user: User): Promise<LoanDbEntity> {
    if (!user.householdId) {
      throw new BadRequestException('El usuario no pertenece a ningún hogar.');
    }

    const totalPayment = Number(dto.amount);
    if (totalPayment <= 0) {
      throw new BadRequestException('El pago total debe ser mayor a cero.');
    }

    return this.dataSource.transaction(async (manager) => {
      // 1. Obtener crédito
      const loan = await manager.findOne(LoanDbEntity, {
        where: { id },
        relations: ['participants'],
      });

      if (!loan) {
        throw new NotFoundException(`Crédito con ID ${id} no encontrado.`);
      }

      // Validar políticas de privacidad
      if (loan.isPrivate) {
        if (loan.creatorId !== user.id) {
          throw new ForbiddenException('Este crédito es privado. Solo el creador puede registrar pagos.');
        }
      } else {
        const isParticipant = loan.participants.some((p) => p.id === user.id);
        if (!isParticipant && loan.creatorId !== user.id) {
          throw new ForbiddenException('No estás inscrito como participante en este crédito común.');
        }
      }

      // Calcular interés y abono a capital automáticamente
      // Tasa mensual (interestRate %) aplicada sobre saldo actual
      const i = Number(loan.interestRate) / 100;
      let interestPaid = Number(loan.currentBalance) * i;
      let principalPaid = totalPayment - interestPaid;

      if (principalPaid < 0) {
        // Si el pago no cubre los intereses, todo va a interés
        interestPaid = totalPayment;
        principalPaid = 0;
      }

      // Si el pago a capital supera la deuda restante, liquidamos el préstamo
      if (principalPaid > Number(loan.currentBalance)) {
        principalPaid = Number(loan.currentBalance);
        interestPaid = totalPayment - principalPaid;
      }

      // 2. Obtener y validar la cuenta origen
      const account = await manager.findOne(AccountDbEntity, {
        where: { id: dto.accountId, householdId: user.householdId! },
      });

      if (!account) {
        throw new NotFoundException(`Cuenta de origen con ID ${dto.accountId} no encontrada en este hogar.`);
      }

      if (Number(account.currentBalance) < totalPayment) {
        throw new BadRequestException(`Fondos insuficientes en la cuenta "${account.name}". Saldo actual: ${account.currentBalance}, Requerido: ${totalPayment}`);
      }

      // 3. Actualizar saldos
      account.currentBalance = Number(account.currentBalance) - totalPayment;
      loan.currentBalance = Number(loan.currentBalance) - principalPaid;

      await manager.save(AccountDbEntity, account);
      await manager.save(LoanDbEntity, loan);

      // 4. Buscar categoría para el movimiento (Preferiblemente "Otros")
      let category = await manager.findOne(CategoryDbEntity, {
        where: { name: 'Otros', householdId: user.householdId! },
      });
      if (!category) {
        category = await manager.findOne(CategoryDbEntity, {
          where: { isGlobal: true },
        });
      }
      if (!category) {
        throw new BadRequestException('No se encontró ninguna categoría para asociar al movimiento del pago.');
      }

      // 5. Buscar medio de pago por defecto "Transferencia Bancaria"
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
        throw new BadRequestException('No se encontró ningún medio de pago para asociar.');
      }

      // 6. Crear movimiento de Pago Crédito
      const movement = manager.create(MovementDbEntity, {
        amount: totalPayment,
        transactionDate: new Date(),
        type: 'Pago Crédito', // CREDIT_PAYMENT
        isPrivate: loan.isPrivate,
        description: `Pago de Crédito: ${loan.purposeDescription} (Capital: $${principalPaid.toFixed(2)}, Int: $${interestPaid.toFixed(2)})`,
        sourceApp: 'Webapp',
        userId: user.id,
        householdId: user.householdId!,
        categoryId: category.id,
        paymentMethodId: paymentMethod.id,
        accountId: account.id,
        loanId: loan.id,
        principalPaid: Number(principalPaid.toFixed(2)),
        interestPaid: Number(interestPaid.toFixed(2)),
      });

      await manager.save(MovementDbEntity, movement);

      return loan;
    });
  }

  /**
   * Simula el plan de pagos de amortización utilizando el sistema francés.
   * 
   * @param amount Monto a financiar.
   * @param interestRate Tasa de interés efectiva mensual (%).
   * @param installments Número de cuotas.
   * @returns Un arreglo con los periodos proyectados de pago.
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
      // Fórmula de anualidad / amortización francesa: R = P * [i * (1+i)^n] / [(1+i)^n - 1]
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
   * Elimina un crédito o deuda si cumple las condiciones de saldo cero y permisos de administrador para compartidos.
   * 
   * @param id ID único del crédito.
   * @param user Usuario solicitante.
   */
  async remove(id: number, user: User): Promise<void> {
    const loan = await this.findOne(id, user);

    if (Number(loan.currentBalance) !== 0) {
      throw new BadRequestException('El saldo del crédito debe ser cero para poder eliminarlo.');
    }

    if (!loan.isPrivate && user.role !== 'admin') {
      throw new ForbiddenException('Solo el administrador del hogar puede eliminar un crédito compartido.');
    }

    await this.loanRepository.remove(loan);
  }
}
