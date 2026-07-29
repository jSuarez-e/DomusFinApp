// backend/src/infrastructure/http/services/accounts.service.ts
import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';

import { AccountDbEntity } from '../../database/entities/account.entity';
import { MovementDbEntity } from '../../database/entities/movement.entity';
import { CreateAccountDto } from '../dtos/create-account.dto';
import { UpdateAccountDto } from '../dtos/update-account.dto';
import { User } from '@shared/index';

/**
 * Servicio de lógica de negocio para la gestión de cuentas financieras (CRUD).
 * Todas las operaciones están aisladas por hogar (multi-tenant).
 */
@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(AccountDbEntity)
    private readonly accountRepository: Repository<AccountDbEntity>,
    @InjectRepository(MovementDbEntity)
    private readonly movementRepository: Repository<MovementDbEntity>,
  ) {}

  /**
   * Crea una nueva cuenta financiera para el usuario autenticado dentro de su hogar activo.
   *
   * @param {CreateAccountDto} dto Datos de la nueva cuenta.
   * @param {User} user Usuario autenticado en sesión.
   * @returns {Promise<AccountDbEntity>} La cuenta creada con saldo inicial igualado al saldo actual.
   * @throws {BadRequestException} Si el usuario no pertenece a un hogar.
   * @throws {ConflictException} Si ya existe una cuenta con el mismo nombre en el hogar.
   */
  async create(dto: CreateAccountDto, user: User): Promise<AccountDbEntity> {
    if (!user.householdId) {
      throw new BadRequestException('El usuario no pertenece a ningún hogar.');
    }

    const existing = await this.accountRepository.findOne({
      where: { name: dto.name, householdId: user.householdId },
    });

    if (existing) {
      throw new ConflictException(`Ya existe una cuenta con el nombre "${dto.name}" en este hogar.`);
    }
    const account = this.accountRepository.create({
      name: dto.name,
      type: dto.type,
      initialBalance: dto.initialBalance,
      currentBalance: dto.initialBalance,
      householdId: user.householdId,
      userId: user.id,
      isPrivate: dto.isPrivate ?? false,
    });

    return this.accountRepository.save(account);
  }

  /**
   * Obtiene todas las cuentas financieras registradas en un hogar aplicando políticas de privacidad.
   *
   * @param {number} householdId ID del hogar activo.
   * @param {User} user Usuario solicitante.
   * @returns {Promise<AccountDbEntity[]>} Lista de cuentas visibles del hogar.
   */
  async findAllForHousehold(householdId: number, user: User): Promise<AccountDbEntity[]> {
    return await this.accountRepository.createQueryBuilder('entity')
      .leftJoinAndSelect('entity.user', 'user')
      .where('entity.householdId = :householdId', { householdId })
      .andWhere(new Brackets(qb => {
        qb.where('entity.isPrivate = false')
          .orWhere('entity.isPrivate = true AND entity.userId = :userId', { userId: user.id });
      }))
      .orderBy('entity.createdAt', 'DESC')
      .getMany();
  }

  /**
   * Obtiene una cuenta específica por ID con validación de tenant y de privacidad.
   *
   * @param {number} id ID de la cuenta.
   * @param {number} householdId ID del hogar para validación multi-tenant.
   * @param {User} user Usuario solicitante.
   * @returns {Promise<AccountDbEntity>} La cuenta encontrada.
   * @throws {NotFoundException} Si la cuenta no existe o no pertenece al hogar.
   * @throws {ForbiddenException} Si la cuenta es privada y pertenece a otro usuario.
   */
  async findOne(id: number, householdId: number, user: User): Promise<AccountDbEntity> {
    const account = await this.accountRepository.findOne({
      where: { id, householdId },
      relations: ['user'],
    });

    if (!account) {
      throw new NotFoundException(`Cuenta con ID ${id} no encontrada en este hogar.`);
    }

    const creatorId = account.userId ?? account.user?.id;
    if (account.isPrivate && creatorId !== user.id) {
      throw new ForbiddenException('No tienes permiso para acceder a esta cuenta privada.');
    }

    return account;
  }

  /**
   * Actualiza el nombre de una cuenta financiera. Solo el creador puede editar.
   *
   * @param {number} id ID de la cuenta a actualizar.
   * @param {UpdateAccountDto} dto Datos parciales de actualización.
   * @param {User} user Usuario autenticado (debe ser el creador).
   * @returns {Promise<AccountDbEntity>} La cuenta actualizada.
   * @throws {NotFoundException} Si la cuenta no existe.
   * @throws {ForbiddenException} Si el usuario no es el creador de la cuenta.
   * @throws {ConflictException} Si el nuevo nombre ya existe en el hogar.
   */
  async update(id: number, dto: UpdateAccountDto, user: User): Promise<AccountDbEntity> {
    if (!user.householdId) {
      throw new BadRequestException('El usuario no pertenece a ningún hogar.');
    }

    const account = await this.findOne(id, user.householdId, user);

    const creatorId = account.userId ?? account.user?.id;
    if (creatorId !== user.id) {
      throw new ForbiddenException('Solo el creador de la cuenta puede editarla.');
    }

    if (dto.name && dto.name !== account.name) {
      const duplicate = await this.accountRepository.findOne({
        where: { name: dto.name, householdId: user.householdId },
      });
      if (duplicate) {
        throw new ConflictException(`Ya existe una cuenta con el nombre "${dto.name}" en este hogar.`);
      }
      account.name = dto.name;
    }

    return this.accountRepository.save(account);
  }

  /**
   * Elimina una cuenta financiera. Verifica que no existan movimientos asociados.
   *
   * @param {number} id ID de la cuenta a eliminar.
   * @param {User} user Usuario autenticado (debe ser el creador).
   * @returns {Promise<void>}
   * @throws {NotFoundException} Si la cuenta no existe.
   * @throws {ForbiddenException} Si el usuario no es el creador.
   * @throws {BadRequestException} Si la cuenta tiene movimientos asociados.
   */
  async remove(id: number, user: User): Promise<void> {
    if (!user.householdId) {
      throw new BadRequestException('El usuario no pertenece a ningún hogar.');
    }

    const account = await this.findOne(id, user.householdId, user);

    const creatorId = account.userId ?? account.user?.id;
    if (creatorId !== user.id) {
      throw new ForbiddenException('Solo el creador de la cuenta puede eliminarla.');
    }

    const movementsCount = await this.movementRepository.count({
      where: [
        { accountId: id },
        { destinationAccountId: id },
      ],
    });

    if (movementsCount > 0) {
      throw new BadRequestException(
        `No se puede eliminar la cuenta "${account.name}" porque tiene ${movementsCount} movimiento(s) asociado(s).`,
      );
    }

    await this.accountRepository.remove(account);
  }
}
