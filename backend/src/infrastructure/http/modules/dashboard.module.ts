// backend/src/infrastructure/http/modules/dashboard.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from '../services/dashboard.service';
import { DashboardController } from '../controllers/dashboard.controller';
import { AccountDbEntity } from '../../database/entities/account.entity';
import { CreditCardDbEntity } from '../../database/entities/credit-card.entity';
import { LoanDbEntity } from '../../database/entities/loan.entity';
import { MovementDbEntity } from '../../database/entities/movement.entity';
import { HouseholdDbEntity } from '../../database/entities/household.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AccountDbEntity,
      CreditCardDbEntity,
      LoanDbEntity,
      MovementDbEntity,
      HouseholdDbEntity,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
