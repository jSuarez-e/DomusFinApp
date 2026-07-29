// backend/src/infrastructure/http/modules/categories.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CategoryDbEntity } from '../../database/entities/category.entity';
import { ExpenseDbEntity } from '../../database/entities/expense.entity';
import { MovementDbEntity } from '../../database/entities/movement.entity';
import { CategoriesController } from '../controllers/categories.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CategoryDbEntity, ExpenseDbEntity, MovementDbEntity])],
  controllers: [CategoriesController],
  providers: [],
  exports: [TypeOrmModule],
})
export class CategoriesModule {}
