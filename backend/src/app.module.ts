// backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpensesModule } from './infrastructure/http/modules/expenses.module';
import { UsersModule } from './infrastructure/http/modules/users.module';
import { AuthModule } from './infrastructure/http/modules/auth.module';
import { UserDbEntity } from './infrastructure/database/entities/user.entity';
import { HouseholdDbEntity } from './infrastructure/database/entities/household.entity';
import { CategoryDbEntity } from './infrastructure/database/entities/category.entity';
import { ExpenseDbEntity } from './infrastructure/database/entities/expense.entity';
import { PaymentMethodDbEntity } from './infrastructure/database/entities/payment-method.entity';
import { MovementDbEntity } from './infrastructure/database/entities/movement.entity';
import { AccountDbEntity } from './infrastructure/database/entities/account.entity';
import { CreditCardDbEntity } from './infrastructure/database/entities/credit-card.entity';
import { SavingsGoalDbEntity } from './infrastructure/database/entities/savings-goal.entity';
import { LoanDbEntity } from './infrastructure/database/entities/loan.entity';
import { CdtDbEntity } from './infrastructure/database/entities/cdt.entity';
import { MovementsModule } from './infrastructure/http/modules/movements.module';
import { AccountsModule } from './infrastructure/http/modules/accounts.module';
import { CreditCardsModule } from './infrastructure/http/modules/credit-cards.module';
import { PaymentMethodsModule } from './infrastructure/http/modules/payment-methods.module';
import { CategoriesModule } from './infrastructure/http/modules/categories.module';
import { HouseholdsModule } from './infrastructure/http/modules/households.module';
import { ReportsModule } from './infrastructure/http/modules/reports.module';
import { SavingsModule } from './infrastructure/http/modules/savings.module';
import { LoansModule } from './infrastructure/http/modules/loans.module';
import { DashboardModule } from './infrastructure/http/modules/dashboard.module';
import { CdtsModule } from './infrastructure/http/modules/cdts.module';
import { DatabaseSeederService } from './infrastructure/database/database-seeder.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST ?? 'localhost',
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3308,
      username: process.env.DB_USERNAME ?? 'domusfin_user',
      password: process.env.DB_PASSWORD ?? 'domusfin_password',
      database: process.env.DB_DATABASE ?? 'domusfin_db',
      entities: [UserDbEntity, HouseholdDbEntity, CategoryDbEntity, ExpenseDbEntity, PaymentMethodDbEntity, MovementDbEntity, AccountDbEntity, CreditCardDbEntity, SavingsGoalDbEntity, LoanDbEntity, CdtDbEntity], // Explicitly declare entities for Webpack bundle compatibility
      synchronize: process.env.DB_SYNC === 'true', //synchronize: process.env.NODE_ENV !== 'production', // Disable in prod or variable in false in PROD
      logging: process.env.NODE_ENV !== 'production',
    }),
    TypeOrmModule.forFeature([CategoryDbEntity, PaymentMethodDbEntity, UserDbEntity]),
    UsersModule,
    AuthModule,
    ExpensesModule,
    MovementsModule,
    AccountsModule,
    CreditCardsModule,
    PaymentMethodsModule,
    CategoriesModule,
    HouseholdsModule,
    ReportsModule,
    SavingsModule,
    LoansModule,
    DashboardModule,
    CdtsModule,
  ],
  controllers: [],
  providers: [DatabaseSeederService],
})

/**
 * Módulo principal de la aplicación que orquesta la carga de los demás módulos,
 * configuración de base de datos y proveedores compartidos.
 */
export class AppModule {}
