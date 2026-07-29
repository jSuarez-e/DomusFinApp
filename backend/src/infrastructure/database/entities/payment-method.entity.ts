// backend/src/infrastructure/database/entities/payment-method.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany, Unique } from 'typeorm';
import { HouseholdDbEntity } from './household.entity';
import { MovementDbEntity } from './movement.entity';

@Entity('payment_methods')
@Unique(['name', 'householdId'])
export class PaymentMethodDbEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ name: 'household_id', nullable: true })
  householdId: number | null;

  @ManyToOne(() => HouseholdDbEntity, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'household_id' })
  household: HouseholdDbEntity | null;

  @OneToMany(() => MovementDbEntity, (movement) => movement.paymentMethod)
  movements: MovementDbEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
