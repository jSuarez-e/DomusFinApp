// backend/src/infrastructure/http/modules/payment-methods.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PaymentMethodDbEntity } from '../../database/entities/payment-method.entity';
import { MovementDbEntity } from '../../database/entities/movement.entity';
import { PaymentMethodsService } from '../services/payment-methods.service';
import { PaymentMethodsController } from '../controllers/payment-methods.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentMethodDbEntity, MovementDbEntity])],
  controllers: [PaymentMethodsController],
  providers: [PaymentMethodsService],
  exports: [PaymentMethodsService],
})
export class PaymentMethodsModule {}
