// backend/src/infrastructure/database/entities/expense.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { UserDbEntity } from './user.entity';
import { HouseholdDbEntity } from './household.entity';
import { CategoryDbEntity } from './category.entity';

@Entity('expenses')
export class ExpenseDbEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column()
  description: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  date: Date;

  @Column({ name: 'is_private', default: false })
  isPrivate: boolean;

  @Column({ name: 'category_id' })
  categoryId: number;

  @ManyToOne(() => CategoryDbEntity, (category) => category.expenses, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'category_id' })
  category: CategoryDbEntity;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => UserDbEntity, (user) => user.expenses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserDbEntity;

  @Column({ name: 'household_id' })
  householdId: number;

  @ManyToOne(() => HouseholdDbEntity, (household) => household.expenses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'household_id' })
  household: HouseholdDbEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
