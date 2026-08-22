// backend/src/infrastructure/database/database-seeder.service.ts
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { CategoryDbEntity } from './entities/category.entity';
import { PaymentMethodDbEntity } from './entities/payment-method.entity';
import { UserDbEntity } from './entities/user.entity';
import { CategoryType } from '@shared/index';

/**
 * Servicio de inicialización de datos semilla globales.
 * Se ejecuta automáticamente al arrancar la aplicación una única vez.
 * Asegura que las categorías y medios de pago globales existan en la BD.
 */
@Injectable()
export class DatabaseSeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DatabaseSeederService.name);

  /**
   * Inicializa el servicio con los repositorios necesarios para el sembrado.
   * @param {Repository<CategoryDbEntity>} categoryRepository - Repositorio de la entidad de categoría.
   * @param {Repository<PaymentMethodDbEntity>} paymentMethodRepository - Repositorio de la entidad de método de pago.
   * @param {Repository<UserDbEntity>} userRepository - Repositorio de la entidad de usuario.
   */
  constructor(
    @InjectRepository(CategoryDbEntity)
    private readonly categoryRepository: Repository<CategoryDbEntity>,
    @InjectRepository(PaymentMethodDbEntity)
    private readonly paymentMethodRepository: Repository<PaymentMethodDbEntity>,
    @InjectRepository(UserDbEntity)
    private readonly userRepository: Repository<UserDbEntity>,
  ) {}

  /**
   * Evento del ciclo de vida de NestJS ejecutado al arrancar la aplicación.
   * Dispara el sembrado de datos por defecto requeridos globalmente.
   * @returns {Promise<void>} Promesa vacía tras completar las operaciones.
   */
  async onApplicationBootstrap(): Promise<void> {
    // await this.clearFinancialData(); Habilitar para limpieza de datos si se quiere borrar toda la BD
    await this.seedGlobalCategories();
    await this.seedGlobalPaymentMethods();
    await this.ensureHouseholdAdmins();
  }

  /**
   * Limpia todos los datos financieros del hogar (movimientos, deudas, cuentas, etc.),
   * manteniendo únicamente los usuarios y hogares registrados.
   */
  private async clearFinancialData(): Promise<void> {
    this.logger.log('🧹 Iniciando limpieza de datos financieros de la base de datos...');
    try {
      await this.categoryRepository.manager.transaction(async (manager) => {
        await manager.query('SET FOREIGN_KEY_CHECKS = 0;');
        
        await manager.query('DELETE FROM movements;');
        await manager.query('DELETE FROM loans;');
        await manager.query('DELETE FROM credit_cards;');
        await manager.query('DELETE FROM savings_goals;');
        await manager.query('DELETE FROM accounts;');
        await manager.query('DELETE FROM expenses;');
        
        // Limpiar categorías y medios de pago para que el seeder los vuelva a generar limpios
        await manager.query('DELETE FROM categories;');
        await manager.query('DELETE FROM payment_methods;');
        await manager.query('DELETE FROM loan_participants;');
        await manager.query('DELETE FROM savings_participants;');
        await manager.query('DELETE FROM users;');
        
        await manager.query('SET FOREIGN_KEY_CHECKS = 1;');
      });
      this.logger.log('✨ Base de datos limpia con éxito (usuarios y hogares conservados).');
    } catch (err) {
      this.logger.error('❌ Error limpiando base de datos:', err);
    }
  }

  /**
   * Crea las categorías globales por defecto si no existen aún en la base de datos.
   */
  private async seedGlobalCategories(): Promise<void> {
    const existing = await this.categoryRepository.count({
      where: { isGlobal: true, householdId: IsNull() },
    });

    if (existing > 0) {
      return;
    }

    const defaultCategories = [
      { name: 'Mercado', icon: 'fast-food-outline', isGlobal: true, householdId: null, type: CategoryType.EXPENSE },
      { name: 'Transporte', icon: 'car-outline', isGlobal: true, householdId: null, type: CategoryType.EXPENSE },
      { name: 'Servicios', icon: 'flash-outline', isGlobal: true, householdId: null, type: CategoryType.EXPENSE },
      { name: 'Salud', icon: 'medkit-outline', isGlobal: true, householdId: null, type: CategoryType.EXPENSE },
      { name: 'Entretenimiento', icon: 'camera-outline', isGlobal: true, householdId: null, type: CategoryType.EXPENSE },
      { name: 'Educación', icon: 'book-outline', isGlobal: true, householdId: null, type: CategoryType.EXPENSE },
      { name: 'Ropa', icon: 'shirt-outline', isGlobal: true, householdId: null, type: CategoryType.EXPENSE },
      { name: 'Comidas', icon: 'restaurant-outline', isGlobal: true, householdId: null, type: CategoryType.EXPENSE },
      { name: 'Gasolina', icon: 'car-outline', isGlobal: true, householdId: null, type: CategoryType.EXPENSE },
      { name: 'Ingresos', icon: 'wallet-outline', isGlobal: true, householdId: null, type: CategoryType.INCOME },
      { name: 'Salario', icon: 'wallet-outline', isGlobal: true, householdId: null, type: CategoryType.INCOME },
      { name: 'Otros Pagos', icon: 'wallet-outline', isGlobal: true, householdId: null, type: CategoryType.INCOME },
      { name: 'Consignaciones', icon: 'wallet-outline', isGlobal: true, householdId: null, type: CategoryType.INCOME },
      { name: 'Otros', icon: 'help-circle-outline', isGlobal: true, householdId: null, type: CategoryType.EXPENSE },
    ];

    const entities = this.categoryRepository.create(defaultCategories);
    await this.categoryRepository.save(entities);
    this.logger.log(`✅ ${defaultCategories.length} categorías globales sembradas correctamente.`);
  }

  /**
   * Crea los medios de pago globales por defecto si no existen aún en la base de datos.
   */
  private async seedGlobalPaymentMethods(): Promise<void> {
    const existing = await this.paymentMethodRepository.count({
      where: { householdId: IsNull() },
    });

    if (existing > 0) {
      return;
    }

    const defaults = [
      { name: 'Efectivo', householdId: null },
      { name: 'Tarjeta de Crédito', householdId: null },
      { name: 'Transferencia Bancaria', householdId: null },
      { name: 'Nequi', householdId: null },
      { name: 'Daviplata', householdId: null },
    ];

    const entities = this.paymentMethodRepository.create(defaults);
    await this.paymentMethodRepository.save(entities);
    this.logger.log(`✅ ${defaults.length} medios de pago globales sembrados correctamente.`);
  }

  /**
   * Asegura que cada hogar (incluyendo usuarios huérfanos sin hogar) cuente con al menos un administrador activo.
   * Si no se encuentra ningún administrador activo, promueve al primer usuario activo disponible.
   */
  private async ensureHouseholdAdmins(): Promise<void> {
    const users = await this.userRepository.find();
    if (users.length === 0) {
      return;
    }

    const householdGroups = new Map<number | null, UserDbEntity[]>();
    for (const u of users) {
      const hhId = u.householdId;
      if (!householdGroups.has(hhId)) {
        householdGroups.set(hhId, []);
      }
      householdGroups.get(hhId)!.push(u);
    }

    const usersToUpdate: UserDbEntity[] = [];

    for (const [hhId, hhUsers] of householdGroups.entries()) {
      const hasAdmin = hhUsers.some((u) => u.role === 'admin' && u.isActive);
      if (!hasAdmin && hhUsers.length > 0) {
        const target = hhUsers.find((u) => u.isActive) || hhUsers[0];
        target.role = 'admin';
        usersToUpdate.push(target);
        this.logger.log(`⚠️ Hogar ${hhId || 'sin hogar'}: No se encontró ningún admin activo. El usuario ${target.name} ha sido promovido a 'admin' automáticamente.`);
      }
    }

    if (usersToUpdate.length > 0) {
      await this.userRepository.save(usersToUpdate);
    }
  }
}
