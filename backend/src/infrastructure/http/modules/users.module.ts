// backend/src/infrastructure/http/modules/users.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserDbEntity } from '../../database/entities/user.entity';
import { HouseholdDbEntity } from '../../database/entities/household.entity';
import { TypeOrmUserRepository } from '../../database/repositories/typeorm-user.repository';
import { UsersController } from '../controllers/users.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserDbEntity, HouseholdDbEntity])],
  controllers: [UsersController],
  providers: [
    {
      provide: 'IUserRepository',
      useClass: TypeOrmUserRepository,
    },
  ],
  exports: ['IUserRepository', TypeOrmModule],
})
export class UsersModule {}
