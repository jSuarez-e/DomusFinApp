// backend/src/infrastructure/http/services/savings.service.ts
import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, In, IsNull, Brackets } from 'typeorm';
import { SavingsGoalDbEntity } from '../../database/entities/savings-goal.entity';
import { AccountDbEntity } from '../../database/entities/account.entity';
import { MovementDbEntity } from '../../database/entities/movement.entity';
import { CategoryDbEntity } from '../../database/entities/category.entity';
import { PaymentMethodDbEntity } from '../../database/entities/payment-method.entity';
import { UserDbEntity } from '../../database/entities/user.entity';
import { CreateSavingsGoalDto, DepositSavingsGoalDto, User } from '@shared/index';

@Injectable()
export class SavingsService {
  constructor(
    @InjectRepository(SavingsGoalDbEntity)
    private readonly savingsGoalRepository: Repository<SavingsGoalDbEntity>,
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
   * Crea una nueva meta de ahorro en el hogar del usuario.
   * 
   * @param dto Datos para la creación del ahorro.
   * @param user Usuario creador.
   * @returns El registro de la meta de ahorro creada.
   * @throws BadRequestException Si el usuario no pertenece a un hogar.
   */
  async create(dto: CreateSavingsGoalDto, user: User): Promise<SavingsGoalDbEntity> {
    if (!user.householdId) {
      throw new BadRequestException('El usuario no pertenece a ningún hogar.');
    }

    let participants: UserDbEntity[] = [];

    if (!dto.isPrivate) {
      const ids = dto.participantIds || [];
      // Asegurar que el creador esté incluido en los participantes de un ahorro común
      if (!ids.includes(user.id)) {
        ids.push(user.id);
      }

      if (ids.length > 0) {
        participants = await this.userRepository.find({
          where: { id: In(ids), householdId: user.householdId, isActive: true },
        });
      }
    }

    const goal = this.savingsGoalRepository.create({
      title: dto.title,
      description: dto.description || null,
      targetAmount: dto.targetAmount,
      currentAmount: 0,
      isPrivate: dto.isPrivate,
      creatorId: user.id,
      householdId: user.householdId,
      participants,
    });

    return this.savingsGoalRepository.save(goal);
  }

  /**
   * Obtiene todas las metas de ahorro del hogar del usuario aplicando políticas de privacidad.
   * 
   * @param householdId ID del hogar activo.
   * @param user Usuario solicitante.
   * @returns Listado de metas de ahorro visibles para el usuario.
   */
  async findAllForHousehold(householdId: number, user: User): Promise<SavingsGoalDbEntity[]> {
    return await this.savingsGoalRepository.createQueryBuilder('entity')
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
   * Obtiene una meta de ahorro específica validando el acceso del usuario.
   * 
   * @param id ID único de la meta.
   * @param user Usuario solicitante.
   * @returns La meta de ahorro.
   * @throws NotFoundException Si la meta no existe o es privada de otro usuario.
   */
  async findOne(id: number, user: User): Promise<SavingsGoalDbEntity> {
    const goal = await this.savingsGoalRepository.findOne({
      where: [
        { id, householdId: user.householdId!, isPrivate: false },
        { id, householdId: user.householdId!, isPrivate: true, creator: { id: user.id } }
      ],
      relations: ['participants', 'creator'],
    });

    if (!goal) {
      throw new NotFoundException(`Meta de ahorro con ID ${id} no encontrada.`);
    }

    return goal;
  }

  /**
   * Realiza un aporte monetario a una meta de ahorro debitando los fondos de una cuenta bancaria.
   * Ejecuta una transacción ACID para asegurar consistencia de los datos.
   * 
   * @param id ID de la meta de ahorro.
   * @param dto Datos del aporte (cuenta origen y monto).
   * @param user Usuario que aporta.
   * @returns La meta de ahorro con su saldo actualizado.
   * @throws NotFoundException Si el ahorro o la cuenta no existen.
   * @throws ForbiddenException Si el usuario no cumple las reglas de privacidad de la meta.
   * @throws BadRequestException Si los fondos son insuficientes o el monto no es válido.
   */
  async deposit(id: number, dto: DepositSavingsGoalDto, user: User): Promise<SavingsGoalDbEntity> {
    if (!user.householdId) {
      throw new BadRequestException('El usuario no pertenece a ningún hogar.');
    }

    const amount = Number(dto.amount);
    if (amount <= 0) {
      throw new BadRequestException('El monto a aportar debe ser mayor a cero.');
    }

    return this.dataSource.transaction(async (manager) => {
      // 1. Obtener y validar la meta de ahorro
      const goal = await manager.findOne(SavingsGoalDbEntity, {
        where: { id },
        relations: ['participants'],
      });

      if (!goal) {
        throw new NotFoundException(`Meta de ahorro con ID ${id} no encontrada.`);
      }

      // Validar políticas de privacidad para aportes
      if (goal.isPrivate) {
        if (goal.creatorId !== user.id) {
          throw new ForbiddenException('Esta meta de ahorro es privada. Solo el creador puede aportarle.');
        }
      } else {
        const isParticipant = goal.participants.some((p) => p.id === user.id);
        if (!isParticipant && goal.creatorId !== user.id) {
          throw new ForbiddenException('No estás inscrito como participante en esta meta de ahorro común.');
        }
      }

      // 2. Obtener y validar la cuenta origen
      const account = await manager.findOne(AccountDbEntity, {
        where: { id: dto.accountId, householdId: user.householdId! },
      });

      if (!account) {
        throw new NotFoundException(`Cuenta de origen con ID ${dto.accountId} no encontrada en este hogar.`);
      }

      if (Number(account.currentBalance) < amount) {
        throw new BadRequestException(`Fondos insuficientes en la cuenta "${account.name}". Saldo actual: ${account.currentBalance}`);
      }

      // 3. Actualizar saldos
      account.currentBalance = Number(account.currentBalance) - amount;
      goal.currentAmount = Number(goal.currentAmount) + amount;

      await manager.save(AccountDbEntity, account);
      await manager.save(SavingsGoalDbEntity, goal);

      // 4. Buscar categoría para el movimiento de ahorro (Preferiblemente "Ahorro" u "Otros")
      let category = await manager.findOne(CategoryDbEntity, {
        where: { name: 'Otros', householdId: user.householdId! },
      });
      if (!category) {
        category = await manager.findOne(CategoryDbEntity, {
          where: { isGlobal: true },
        });
      }
      if (!category) {
        throw new BadRequestException('No se encontró ninguna categoría para asociar al movimiento de ahorro.');
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

      // 6. Crear movimiento de Ahorro
      const movement = manager.create(MovementDbEntity, {
        amount,
        transactionDate: new Date(),
        type: 'Ahorro', // SAVINGS_DEPOSIT
        isPrivate: goal.isPrivate,
        description: `Aporte a ahorro: ${goal.title}`,
        sourceApp: 'Webapp',
        userId: user.id,
        householdId: user.householdId!,
        categoryId: category.id,
        paymentMethodId: paymentMethod.id,
        accountId: account.id,
        savingsGoalId: goal.id,
      });

      await manager.save(MovementDbEntity, movement);

      return goal;
    });
  }

  /**
   * Elimina una meta de ahorro si cumple las reglas de permisos de administrador para compartidas.
   * 
   * @param id ID único de la meta de ahorro.
   * @param user Usuario solicitante.
   */
  async remove(id: number, user: User): Promise<void> {
    const goal = await this.findOne(id, user);

    if (!goal.isPrivate && user.role !== 'admin') {
      throw new ForbiddenException('Solo el administrador del hogar puede eliminar una meta de ahorro compartida.');
    }

    await this.savingsGoalRepository.remove(goal);
  }
}
