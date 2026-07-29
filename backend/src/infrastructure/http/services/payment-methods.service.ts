// backend/src/infrastructure/http/services/payment-methods.service.ts
import { BadRequestException, Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not } from 'typeorm';

import { PaymentMethodDbEntity } from '../../database/entities/payment-method.entity';
import { MovementDbEntity } from '../../database/entities/movement.entity';

@Injectable()
export class PaymentMethodsService {
  constructor(
    @InjectRepository(PaymentMethodDbEntity)
    private readonly repository: Repository<PaymentMethodDbEntity>,
    @InjectRepository(MovementDbEntity)
    private readonly movementRepository: Repository<MovementDbEntity>,
  ) {}

  /**
   * Obtiene todos los medios de pago disponibles para un hogar (incluye globales de sistema y personalizados).
   * 
   * @param {number} householdId ID único del hogar.
   */
  async findAllForHousehold(householdId: number): Promise<PaymentMethodDbEntity[]> {
    const list = await this.repository.find({
      where: [
        { householdId },
        { householdId: IsNull() } // Medios de pago globales por defecto
      ],
      order: { id: 'ASC' }
    });

    // Semilla inicial si está completamente vacío (Efectivo, Tarjeta de Crédito, Transferencia Bancaria)
    if (list.length === 0) {
      const defaults = [
        { name: 'Efectivo', householdId: null },
        { name: 'Tarjeta de Crédito', householdId: null },
        { name: 'Transferencia Bancaria', householdId: null }
      ];
      const created = this.repository.create(defaults);
      await this.repository.save(created);
      return this.repository.find({
        where: [
          { householdId },
          { householdId: IsNull() }
        ],
        order: { id: 'ASC' }
      });
    }

    return list;
  }

  /**
   * Registra un medio de pago personalizado para el hogar.
   */
  async create(name: string, householdId: number): Promise<PaymentMethodDbEntity> {
    const exists = await this.repository.findOneBy({
      name: name.trim(),
      householdId
    });
    if (exists) {
      throw new ConflictException('Ya existe un medio de pago con ese nombre en tu hogar.');
    }

    const paymentMethod = this.repository.create({
      name: name.trim(),
      householdId
    });
    return this.repository.save(paymentMethod);
  }

  /**
   * Actualiza el nombre de un medio de pago.
   */
  async update(id: number, name: string, householdId: number): Promise<PaymentMethodDbEntity> {
    const method = await this.repository.findOneBy({ id });
    if (!method) {
      throw new NotFoundException('Medio de pago no encontrado.');
    }

    if (method.householdId === null) {
      throw new BadRequestException('No se pueden modificar medios de pago globales del sistema.');
    }

    if (method.householdId !== householdId) {
      throw new BadRequestException('Acceso denegado. Este medio de pago pertenece a otro hogar.');
    }

    const exists = await this.repository.findOne({
      where: {
        name: name.trim(),
        householdId,
        id: Not(id)
      }
    });
    if (exists) {
      throw new ConflictException('Ya existe otro medio de pago con ese nombre en tu hogar.');
    }

    method.name = name.trim();
    return this.repository.save(method);
  }

  /**
   * Elimina un medio de pago personalizado.
   */
  async delete(id: number, householdId: number): Promise<void> {
    const method = await this.repository.findOneBy({ id });
    if (!method) {
      throw new NotFoundException('Medio de pago no encontrado.');
    }

    if (method.householdId === null) {
      throw new BadRequestException('No se pueden eliminar medios de pago globales del sistema.');
    }

    if (method.householdId !== householdId) {
      throw new BadRequestException('Acceso denegado. Este medio de pago pertenece a otro hogar.');
    }

    const movementCount = await this.movementRepository.countBy({ paymentMethodId: id });
    if (movementCount > 0) {
      throw new BadRequestException('No se puede eliminar el medio de pago porque está siendo utilizado por movimientos del hogar.');
    }

    await this.repository.delete(id);
  }
}
