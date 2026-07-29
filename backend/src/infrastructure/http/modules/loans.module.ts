// backend/src/infrastructure/http/modules/loans.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoansService } from '../services/loans.service';
import { LoansController } from '../controllers/loans.controller';
import { LoanDbEntity } from '../../database/entities/loan.entity';
import { AccountDbEntity } from '../../database/entities/account.entity';
import { MovementDbEntity } from '../../database/entities/movement.entity';
import { CategoryDbEntity } from '../../database/entities/category.entity';
import { PaymentMethodDbEntity } from '../../database/entities/payment-method.entity';
import { UserDbEntity } from '../../database/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LoanDbEntity,
      AccountDbEntity,
      MovementDbEntity,
      CategoryDbEntity,
      PaymentMethodDbEntity,
      UserDbEntity,
    ]),
  ],
  controllers: [LoansController],
  providers: [LoansService],
  exports: [LoansService],
})
export class LoansModule {}
