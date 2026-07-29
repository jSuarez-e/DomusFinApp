// backend/src/infrastructure/database/entities/loan.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, ManyToMany, JoinTable } from 'typeorm';
import { UserDbEntity } from './user.entity';
import { HouseholdDbEntity } from './household.entity';

@Entity('loans')
export class LoanDbEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'purpose_description', type: 'varchar', length: 255 })
  purposeDescription: string;

  @Column({ name: 'initial_principal', type: 'decimal', precision: 12, scale: 2 })
  initialPrincipal: number;

  @Column({ name: 'current_balance', type: 'decimal', precision: 12, scale: 2 })
  currentBalance: number;

  @Column({ name: 'interest_rate', type: 'decimal', precision: 5, scale: 2 })
  interestRate: number; // e.g. 1.5 % monthly

  @Column({ name: 'handling_fee', type: 'decimal', precision: 10, scale: 2, default: 0 })
  handlingFee: number;

  @Column({ name: 'life_insurance', type: 'decimal', precision: 10, scale: 2, default: 0 })
  lifeInsurance: number;

  @Column({ name: 'other_charges', type: 'decimal', precision: 10, scale: 2, default: 0 })
  otherCharges: number;

  @Column({ name: 'is_private', type: 'boolean', default: false })
  isPrivate: boolean;

  @Column({ name: 'creator_id' })
  creatorId: number;

  @ManyToOne(() => UserDbEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'creator_id' })
  creator: UserDbEntity;

  @Column({ name: 'household_id' })
  householdId: number;

  @ManyToOne(() => HouseholdDbEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'household_id' })
  household: HouseholdDbEntity;

  @ManyToMany(() => UserDbEntity, { onDelete: 'CASCADE' })
  @JoinTable({
    name: 'loan_participants',
    joinColumn: { name: 'loan_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  participants: UserDbEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
