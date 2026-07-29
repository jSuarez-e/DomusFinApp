// backend/src/infrastructure/database/entities/user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { HouseholdDbEntity } from './household.entity';
import { ExpenseDbEntity } from './expense.entity';

@Entity('users')
export class UserDbEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password?: string;

  @Column()
  name: string;

  @Column({ default: 'user' })
  role: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ default: 'COP' })
  currency: string;

  @Column({ name: 'date_format', default: 'DD/MM/YYYY' })
  dateFormat: string;

  @Column({ type: 'longtext', nullable: true })
  avatar: string | null;

  @Column({ name: 'household_id', nullable: true })
  householdId: number | null;

  @ManyToOne(() => HouseholdDbEntity, (household) => household.users, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'household_id' })
  household: HouseholdDbEntity | null;

  @OneToMany(() => ExpenseDbEntity, (expense) => expense.user)
  expenses: ExpenseDbEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
