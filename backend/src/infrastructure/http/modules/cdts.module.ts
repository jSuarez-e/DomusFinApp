// backend/src/infrastructure/http/modules/cdts.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CdtsController } from '../controllers/cdts.controller';
import { CdtsService } from '../services/cdts.service';
import { CdtDbEntity } from '../../database/entities/cdt.entity';
import { UserDbEntity } from '../../database/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CdtDbEntity, UserDbEntity])],
  controllers: [CdtsController],
  providers: [CdtsService],
})
export class CdtsModule {}
