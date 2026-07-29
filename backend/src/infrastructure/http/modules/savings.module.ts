// backend/src/infrastructure/http/modules/savings.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SavingsService } from '../services/savings.service';
import { SavingsController } from '../controllers/savings.controller';
import { SavingsGoalDbEntity } from '../../database/entities/savings-goal.entity';
import { AccountDbEntity } from '../../database/entities/account.entity';
import { MovementDbEntity } from '../../database/entities/movement.entity';
import { CategoryDbEntity } from '../../database/entities/category.entity';
import { PaymentMethodDbEntity } from '../../database/entities/payment-method.entity';
import { UserDbEntity } from '../../database/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SavingsGoalDbEntity,
      AccountDbEntity,
      MovementDbEntity,
      CategoryDbEntity,
      PaymentMethodDbEntity,
      UserDbEntity,
    ]),
  ],
  controllers: [SavingsController],
  providers: [SavingsService],
  exports: [SavingsService],
})
export class SavingsModule {}
