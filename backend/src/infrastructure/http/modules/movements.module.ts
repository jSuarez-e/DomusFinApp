// backend/src/infrastructure/http/modules/movements.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MovementDbEntity } from '../../database/entities/movement.entity';
import { AccountDbEntity } from '../../database/entities/account.entity';
import { CreditCardDbEntity } from '../../database/entities/credit-card.entity';
import { MovementsService } from '../services/movements.service';
import { MovementsController } from '../controllers/movements.controller';
import { WebhooksController } from '../controllers/webhooks.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MovementDbEntity, AccountDbEntity, CreditCardDbEntity])],
  controllers: [MovementsController, WebhooksController],
  providers: [MovementsService],
  exports: [MovementsService],
})
export class MovementsModule {}
