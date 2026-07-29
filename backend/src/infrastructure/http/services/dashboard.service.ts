// backend/src/infrastructure/http/services/dashboard.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { AccountDbEntity } from '../../database/entities/account.entity';
import { CreditCardDbEntity } from '../../database/entities/credit-card.entity';
import { LoanDbEntity } from '../../database/entities/loan.entity';
import { MovementDbEntity } from '../../database/entities/movement.entity';
import { HouseholdDbEntity } from '../../database/entities/household.entity';
import { User } from '@shared/index';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(AccountDbEntity)
    private readonly accountRepository: Repository<AccountDbEntity>,
    @InjectRepository(CreditCardDbEntity)
    private readonly creditCardRepository: Repository<CreditCardDbEntity>,
    @InjectRepository(LoanDbEntity)
    private readonly loanRepository: Repository<LoanDbEntity>,
    @InjectRepository(MovementDbEntity)
    private readonly movementRepository: Repository<MovementDbEntity>,
    @InjectRepository(HouseholdDbEntity)
    private readonly householdRepository: Repository<HouseholdDbEntity>,
  ) {}

  /**
   * Genera el resumen consolidado del dashboard aplicando reglas de privacidad a nivel de hogar.
   * Filtra cuentas, tarjetas, créditos y gastos privados ajenos.
   *
   * @param user Usuario autenticado en sesión.
   * @param monthStr Mes opcional a consultar en formato YYYY-MM.
   * @returns Resumen con liquidez, deuda total y presupuesto disponible.
   */
  async getSummary(user: User, monthStr?: string): Promise<{ total_liquidity: number; total_debt: number; monthly_budget_remaining: number }> {
    const householdId = user.householdId;
    if (!householdId) {
      throw new BadRequestException('El usuario no pertenece a ningún hogar.');
    }

    // 1. Obtener y filtrar Cuentas Visibles (para Liquidez)
    const accounts = await this.accountRepository.find({
      where: { householdId },
    });
    const visibleAccounts = accounts.filter((a) => !a.isPrivate || a.userId === user.id);
    const totalLiquidity = visibleAccounts.reduce((sum, a) => sum + Number(a.currentBalance), 0);

    // 2. Obtener y filtrar Tarjetas de Crédito Visibles (Tarjetas son 100% privadas)
    const creditCards = await this.creditCardRepository.find({
      where: { userId: user.id },
    });
    const totalCcDebt = creditCards.reduce((sum, c) => sum + Number(c.currentDebt), 0);

    // 3. Obtener y filtrar Créditos/Deudas Visibles
    const loans = await this.loanRepository.find({
      where: { householdId },
    });
    const visibleLoans = loans.filter((l) => !l.isPrivate || l.creatorId === user.id);
    const totalLoanDebt = visibleLoans.reduce((sum, l) => sum + Number(l.currentBalance), 0);

    const totalDebt = totalCcDebt + totalLoanDebt;

    // 4. Obtener Presupuesto del Hogar
    const household = await this.householdRepository.findOne({
      where: { id: householdId },
    });
    const monthlyBudget = household ? Number(household.monthlyBudget) : 1000.0;

    // 5. Calcular Gastos Mensuales Visibles (solo tipo 'Gasto')
    let year: number;
    let month: number;

    if (monthStr && /^\d{4}-\d{2}$/.test(monthStr)) {
      const [y, m] = monthStr.split('-').map(Number);
      year = y;
      month = m - 1;
    } else {
      const now = new Date();
      year = now.getFullYear();
      month = now.getMonth();
    }

    const startDate = new Date(year, month, 1, 0, 0, 0, 0);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

    const movements = await this.movementRepository.find({
      where: {
        householdId,
        type: 'Gasto', // Filtrar estrictamente por gasto (EXPENSE)
        transactionDate: Between(startDate, endDate),
      },
    });

    // Filtrar movimientos privados: solo mantener públicos o propios privados
    const visibleMovements = movements.filter((m) => !m.isPrivate || m.userId === user.id);
    const totalSpent = visibleMovements.reduce((sum, m) => sum + Number(m.amount), 0);

    const monthlyBudgetRemaining = monthlyBudget - totalSpent;

    return {
      total_liquidity: Number(totalLiquidity.toFixed(2)),
      total_debt: Number(totalDebt.toFixed(2)),
      monthly_budget_remaining: Number(monthlyBudgetRemaining.toFixed(2)),
    };
  }
}
