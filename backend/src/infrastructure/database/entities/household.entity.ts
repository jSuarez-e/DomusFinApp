// backend/src/infrastructure/database/entities/household.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { UserDbEntity } from './user.entity';
import { ExpenseDbEntity } from './expense.entity';
import { CategoryDbEntity } from './category.entity';

@Entity('households')
export class HouseholdDbEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ name: 'monthly_budget', type: 'decimal', precision: 10, scale: 2, default: 1000.00 })
  monthlyBudget: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => UserDbEntity, (user) => user.household)
  users: UserDbEntity[];

  @OneToMany(() => CategoryDbEntity, (category) => category.household)
  categories: CategoryDbEntity[];

  @OneToMany(() => ExpenseDbEntity, (expense) => expense.household)
  expenses: ExpenseDbEntity[];
}
