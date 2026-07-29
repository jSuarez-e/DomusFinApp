// backend/src/infrastructure/http/controllers/reports.controller.ts
import { Controller, Get, Query, Request, UseGuards, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ReportsService } from '../services/reports.service';
import { User } from '@shared/index';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @ApiOperation({ summary: 'Generar reporte analítico con agregaciones y filtrados' })
  @ApiResponse({ status: 200, description: 'Estructura agregada de ingresos/gastos y movimientos' })
  async getAnalytics(
    @Request() req: { user: User },
    @Query('month') month?: string,
    @Query('year') year?: string,
    @Query('userId') userId?: string,
    @Query('type') type?: string,
  ) {
    if (!req.user.householdId) {
      throw new BadRequestException('El usuario no pertenece a ningún hogar.');
    }

    // Validación de seguridad para la consulta de datos privados
    if (type === 'Privado') {
      if (userId && Number(userId) !== req.user.id) {
        throw new ForbiddenException('No tienes permiso para ver los gastos ocultos de otro usuario.');
      }
    }

    return this.reportsService.generateReport(req.user.householdId, req.user.id, {
      month,
      year,
      userId,
      type
    });
  }
}
