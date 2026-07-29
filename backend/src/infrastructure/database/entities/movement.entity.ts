// backend/src/infrastructure/database/entities/movement.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { UserDbEntity } from './user.entity';
import { HouseholdDbEntity } from './household.entity';
import { CategoryDbEntity } from './category.entity';
import { PaymentMethodDbEntity } from './payment-method.entity';
import { AccountDbEntity } from './account.entity';
import { CreditCardDbEntity } from './credit-card.entity';
import { SavingsGoalDbEntity } from './savings-goal.entity';
import { LoanDbEntity } from './loan.entity';

@Entity('movements')
export class MovementDbEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ name: 'transaction_date', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  transactionDate: Date;

  @Column()
  type: 'Gasto' | 'Ingreso' | 'Ahorro' | 'Pago Crédito' | 'Pago TC' | 'Transferencia';

  @Column({ name: 'is_private', default: false })
  isPrivate: boolean;

  @Column({ nullable: true })
  description: string;

  @Column({ name: 'source_app', nullable: true })
  sourceApp: string;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => UserDbEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserDbEntity;

  @Column({ name: 'household_id' })
  householdId: number;

  @ManyToOne(() => HouseholdDbEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'household_id' })
  household: HouseholdDbEntity;

  @Column({ name: 'category_id' })
  categoryId: number;

  @ManyToOne(() => CategoryDbEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'category_id' })
  category: CategoryDbEntity;

  @Column({ name: 'payment_method_id' })
  paymentMethodId: number;

  @ManyToOne(() => PaymentMethodDbEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'payment_method_id' })
  paymentMethod: PaymentMethodDbEntity;

  @Column({ name: 'account_id', nullable: true })
  accountId: number | null;

  @ManyToOne(() => AccountDbEntity, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'account_id' })
  account: AccountDbEntity | null;

  @Column({ name: 'destination_account_id', nullable: true })
  destinationAccountId: number | null;

  @ManyToOne(() => AccountDbEntity, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'destination_account_id' })
  destinationAccount: AccountDbEntity | null;

  @Column({ name: 'credit_card_id', nullable: true })
  creditCardId: number | null;

  @ManyToOne(() => CreditCardDbEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'credit_card_id' })
  creditCard: CreditCardDbEntity | null;

  @Column({ name: 'savings_goal_id', nullable: true })
  savingsGoalId: number | null;

  @ManyToOne(() => SavingsGoalDbEntity, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'savings_goal_id' })
  savingsGoal: SavingsGoalDbEntity | null;

  @Column({ name: 'loan_id', nullable: true })
  loanId: number | null;

  @ManyToOne(() => LoanDbEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'loan_id' })
  loan: LoanDbEntity | null;

  @Column({ name: 'principal_paid', type: 'decimal', precision: 12, scale: 2, nullable: true })
  principalPaid: number | null;

  @Column({ name: 'interest_paid', type: 'decimal', precision: 12, scale: 2, nullable: true })
  interestPaid: number | null;

  @Column({ name: 'installments', type: 'smallint', nullable: true })
  installments: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
