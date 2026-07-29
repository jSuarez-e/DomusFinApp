// backend/src/infrastructure/http/modules/reports.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MovementDbEntity } from '../../database/entities/movement.entity';
import { ReportsController } from '../controllers/reports.controller';
import { ReportsService } from '../services/reports.service';

@Module({
  imports: [TypeOrmModule.forFeature([MovementDbEntity])],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
