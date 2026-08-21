// backend/src/infrastructure/database/entities/cdt.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { UserDbEntity } from './user.entity';
import { HouseholdDbEntity } from './household.entity';
import { CdtPaymentType } from '../../../../../shared/models/cdts/cdt.interface';

@Entity('cdts')
export class CdtDbEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'initial_amount', type: 'decimal', precision: 12, scale: 2 })
  initialAmount: number;

  @Column({ name: 'bank_name' })
  bankName: string;

  @Column({ type: 'decimal', precision: 5, scale: 4 })
  rate: number;

  @Column({ name: 'term_days' })
  termDays: number;

  @Column({ name: 'payment_type', type: 'varchar' })
  paymentType: CdtPaymentType;

  @Column({ name: 'is_public', default: false })
  isPublic: boolean;

  @Column('simple-array', { name: 'shared_with', nullable: true })
  sharedWith: number[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'owner_id' })
  ownerId: number;

  @ManyToOne(() => UserDbEntity)
  @JoinColumn({ name: 'owner_id' })
  owner: UserDbEntity;

  @Column({ name: 'household_id' })
  householdId: number;

  @ManyToOne(() => HouseholdDbEntity, (household) => household.cdts)
  @JoinColumn({ name: 'household_id' })
  household: HouseholdDbEntity;
}
