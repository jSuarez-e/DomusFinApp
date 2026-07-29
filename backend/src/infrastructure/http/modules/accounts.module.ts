// backend/src/infrastructure/http/modules/accounts.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AccountDbEntity } from '../../database/entities/account.entity';
import { MovementDbEntity } from '../../database/entities/movement.entity';
import { AccountsService } from '../services/accounts.service';
import { AccountsController } from '../controllers/accounts.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AccountDbEntity, MovementDbEntity])],
  controllers: [AccountsController],
  providers: [AccountsService],
  exports: [AccountsService],
})
export class AccountsModule {}
