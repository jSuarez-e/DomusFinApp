// backend/src/infrastructure/database/entities/account.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { UserDbEntity } from './user.entity';
import { HouseholdDbEntity } from './household.entity';

/**
 * Entidad de base de datos para cuentas financieras (Bancos, Efectivo, Billeteras).
 * Cada cuenta pertenece a un hogar (multi-tenant) y tiene un usuario creador.
 */
@Entity('accounts')
@Unique(['name', 'householdId'])
export class AccountDbEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'enum', enum: ['BANK', 'CASH', 'WALLET'] })
  type: 'BANK' | 'CASH' | 'WALLET';

  @Column({ name: 'initial_balance', type: 'decimal', precision: 12, scale: 2, default: 0 })
  initialBalance: number;

  @Column({ name: 'current_balance', type: 'decimal', precision: 12, scale: 2, default: 0 })
  currentBalance: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'household_id' })
  householdId: number;

  @ManyToOne(() => HouseholdDbEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'household_id' })
  household: HouseholdDbEntity;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => UserDbEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserDbEntity;

  @Column({ name: 'is_private', type: 'boolean', default: false })
  isPrivate: boolean;
}
