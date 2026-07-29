// backend/src/infrastructure/http/modules/households.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { HouseholdDbEntity } from '../../database/entities/household.entity';
import { HouseholdsController } from '../controllers/households.controller';

@Module({
  imports: [TypeOrmModule.forFeature([HouseholdDbEntity])],
  controllers: [HouseholdsController],
  providers: [],
  exports: [TypeOrmModule],
})
export class HouseholdsModule {}
