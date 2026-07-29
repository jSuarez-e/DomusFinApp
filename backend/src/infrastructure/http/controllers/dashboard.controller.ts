// backend/src/infrastructure/http/controllers/dashboard.controller.ts
import { Controller, Get, Request, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { DashboardService } from '../services/dashboard.service';
import { User } from '@shared/index';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * Obtiene el resumen de liquidez y deuda total visible, junto con el presupuesto restante del mes.
   *
   * @param req Petición conteniendo el usuario autenticado.
   * @param month Mes opcional a consultar en formato YYYY-MM.
   * @returns Consolidado financiero.
   */
  @Get('summary')
  @ApiOperation({ summary: 'Obtener consolidado financiero del dashboard del hogar activo' })
  @ApiResponse({ status: 200, description: 'Resumen financiero retornado.' })
  async getSummary(
    @Request() req: { user: User },
    @Query('month') month?: string,
  ): Promise<{ total_liquidity: number; total_debt: number; monthly_budget_remaining: number }> {
    return this.dashboardService.getSummary(req.user, month);
  }
}
