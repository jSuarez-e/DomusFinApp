// backend/src/infrastructure/http/controllers/movements.controller.ts
import { Body, Controller, Get, Post, Request, UseGuards, BadRequestException, Query, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { MovementsService } from '../services/movements.service';
import { CreateMovementDto } from '../dtos/create-movement.dto';
import { User } from '@shared/index';
import { MovementsPrivacyInterceptor } from '../interceptors/movements-privacy.interceptor';

@ApiTags('Movements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('movements')
export class MovementsController {
  constructor(private readonly movementsService: MovementsService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar un nuevo movimiento (Ingreso / Gasto)' })
  @ApiResponse({ status: 201, description: 'Movimiento creado exitosamente' })
  async create(@Body() dto: CreateMovementDto, @Request() req: { user: User }) {
    return this.movementsService.create(dto, req.user);
  }

  @Get('monthly-summary')
  @UseInterceptors(MovementsPrivacyInterceptor)
  @ApiOperation({ summary: 'Obtener resumen mensual y últimos 5 movimientos' })
  @ApiResponse({ status: 200, description: 'Resumen mensual y movimientos' })
  async getMonthlySummary(
    @Request() req: { user: User },
    @Query('month') month?: string,
  ) {
    if (!req.user.householdId) {
      throw new BadRequestException('El usuario no pertenece a ningún hogar.');
    }
    return this.movementsService.getMonthlySummary(req.user.householdId, month);
  }

  @Get()
  @UseInterceptors(MovementsPrivacyInterceptor)
  @ApiOperation({ summary: 'Obtener todos los movimientos del hogar activo' })
  @ApiResponse({ status: 200, description: 'Listado de movimientos financieros' })
  async findAll(@Request() req: { user: User }) {
    if (!req.user.householdId) {
      throw new BadRequestException('El usuario no pertenece a ningún hogar.');
    }
    return this.movementsService.findAllForHousehold(req.user.householdId, req.user);
  }
}
