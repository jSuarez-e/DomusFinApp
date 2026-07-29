// backend/src/infrastructure/http/modules/expenses.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpensesController } from '../controllers/expenses.controller';
import { ExpensesService } from '../services/expenses.service';
import { ExpenseDbEntity } from '../../database/entities/expense.entity';
import { CategoryDbEntity } from '../../database/entities/category.entity';
import { TypeOrmExpenseRepository } from '../../database/repositories/typeorm-expense.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ExpenseDbEntity, CategoryDbEntity])],
  controllers: [ExpensesController],
  providers: [
    ExpensesService,
    {
      provide: 'IExpenseRepository',
      useClass: TypeOrmExpenseRepository,
    },
  ],
  exports: [ExpensesService, 'IExpenseRepository'],
})
export class ExpensesModule {}
