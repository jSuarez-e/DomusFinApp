// backend/src/infrastructure/http/modules/auth.module.ts
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtStrategy } from '../../auth/jwt.strategy';
import { UsersModule } from './users.module';
import { AuthService } from '../services/auth.service';
import { AuthController } from '../controllers/auth.controller';
import { UserDbEntity } from '../../database/entities/user.entity';
import { HouseholdDbEntity } from '../../database/entities/household.entity';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([UserDbEntity, HouseholdDbEntity]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'supersecretkey',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController],
  providers: [JwtStrategy, AuthService],
  exports: [PassportModule, JwtModule, AuthService],
})
export class AuthModule {}
