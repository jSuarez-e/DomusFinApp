// backend/src/infrastructure/database/entities/credit-card.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { UserDbEntity } from './user.entity';
import { HouseholdDbEntity } from './household.entity';

@Entity('credit_cards')
@Unique(['aliasName', 'householdId'])
export class CreditCardDbEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'alias_name', type: 'varchar', length: 100 })
  aliasName: string;

  @Column({ name: 'last_four_digits', type: 'varchar', length: 4 })
  lastFourDigits: string;

  @Column({ name: 'interest_rate', type: 'decimal', precision: 5, scale: 2 })
  interestRate: number; // e.g. 2.50 % monthly

  @Column({ name: 'late_fee_rate', type: 'decimal', precision: 5, scale: 2, default: 0 })
  lateFeeRate: number; // e.g. 3.00 % monthly

  @Column({ name: 'handling_fee', type: 'decimal', precision: 10, scale: 2, default: 0 })
  handlingFee: number; // monthly fee

  @Column({ name: 'life_insurance', type: 'decimal', precision: 10, scale: 2, default: 0 })
  lifeInsurance: number;

  @Column({ name: 'other_charges', type: 'decimal', precision: 10, scale: 2, default: 0 })
  otherCharges: number;

  @Column({ name: 'cut_date', type: 'int' })
  cutDate: number; // cut-off day of the month (e.g. 15)

  @Column({ name: 'payment_due_date', type: 'int' })
  paymentDueDate: number; // payment limit day of the month (e.g. 5)

  @Column({ name: 'current_debt', type: 'decimal', precision: 12, scale: 2, default: 0 })
  currentDebt: number;

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

  @Column({ name: 'is_private', type: 'boolean', default: true })
  isPrivate: boolean;
}
