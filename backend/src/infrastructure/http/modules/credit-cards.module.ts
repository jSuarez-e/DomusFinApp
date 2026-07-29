// backend/src/infrastructure/http/modules/credit-cards.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CreditCardDbEntity } from '../../database/entities/credit-card.entity';
import { AccountDbEntity } from '../../database/entities/account.entity';
import { MovementDbEntity } from '../../database/entities/movement.entity';
import { CategoryDbEntity } from '../../database/entities/category.entity';
import { PaymentMethodDbEntity } from '../../database/entities/payment-method.entity';
import { CreditCardsService } from '../services/credit-cards.service';
import { CreditCardsController } from '../controllers/credit-cards.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CreditCardDbEntity,
      AccountDbEntity,
      MovementDbEntity,
      CategoryDbEntity,
      PaymentMethodDbEntity,
    ]),
  ],
  controllers: [CreditCardsController],
  providers: [CreditCardsService],
  exports: [CreditCardsService],
})
export class CreditCardsModule {}
