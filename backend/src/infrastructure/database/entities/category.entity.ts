// backend/src/infrastructure/database/entities/category.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany, Unique } from 'typeorm';
import { HouseholdDbEntity } from './household.entity';
import { ExpenseDbEntity } from './expense.entity';
import { CategoryType } from '@shared/index';

@Entity('categories')
@Unique(['name', 'householdId'])
export class CategoryDbEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  type: CategoryType;

  @Column({ type: 'varchar', length: 50, nullable: true })
  icon: string | null;

  @Column({ name: 'household_id', nullable: true })
  householdId: number | null;

  @ManyToOne(() => HouseholdDbEntity, (household) => household.categories, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'household_id' })
  household: HouseholdDbEntity | null;

  @Column({ name: 'is_global', default: false })
  isGlobal: boolean;

  @OneToMany(() => ExpenseDbEntity, (expense) => expense.category)
  expenses: ExpenseDbEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
