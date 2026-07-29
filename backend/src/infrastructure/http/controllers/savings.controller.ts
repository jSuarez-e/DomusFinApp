import { Controller, Get, Post, Body, Param, UseGuards, Request, ParseIntPipe, UseInterceptors, Delete } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { SavingsService } from '../services/savings.service';
import { CreateSavingsGoalDto, DepositSavingsGoalDto, User } from '@shared/index';
import { SavingsGoalDbEntity } from '../../database/entities/savings-goal.entity';
import { PrivacyInterceptor } from '../interceptors/privacy.interceptor';

@ApiTags('Savings Goals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UseInterceptors(PrivacyInterceptor)
@Controller('savings-goals')
export class SavingsController {
  constructor(private readonly savingsService: SavingsService) {}

  /**
   * Crea una nueva meta de ahorro.
   * 
   * @param dto Los datos del ahorro a crear.
   * @param req Petición HTTP conteniendo el usuario autenticado.
   * @returns La meta de ahorro guardada.
   */
  @Post()
  @ApiOperation({ summary: 'Crear una nueva meta de ahorro' })
  @ApiResponse({ status: 201, description: 'Meta de ahorro creada correctamente.', type: SavingsGoalDbEntity })
  async create(
    @Body() dto: CreateSavingsGoalDto,
    @Request() req: { user: User }
  ): Promise<SavingsGoalDbEntity> {
    return this.savingsService.create(dto, req.user);
  }

  /**
   * Lista todas las metas de ahorro accesibles para el hogar activo del usuario.
   * 
   * @param req Petición HTTP conteniendo el usuario autenticado.
   * @returns Listado de metas de ahorro.
   */
  @Get()
  @ApiOperation({ summary: 'Obtener todas las metas de ahorro del hogar activo' })
  @ApiResponse({ status: 200, description: 'Metas de ahorro del hogar.', type: [SavingsGoalDbEntity] })
  async findAll(@Request() req: { user: User }): Promise<SavingsGoalDbEntity[]> {
    const householdId = req.user.householdId;
    if (!householdId) {
      return [];
    }
    return this.savingsService.findAllForHousehold(householdId, req.user);
  }

  /**
   * Obtiene los detalles de una meta de ahorro por su ID.
   * 
   * @param id ID de la meta de ahorro.
   * @param req Petición HTTP conteniendo el usuario autenticado.
   * @returns La meta de ahorro si el usuario tiene acceso.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Obtener una meta de ahorro por su ID' })
  @ApiResponse({ status: 200, description: 'Detalle de la meta de ahorro.', type: SavingsGoalDbEntity })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: User }
  ): Promise<SavingsGoalDbEntity> {
    return this.savingsService.findOne(id, req.user);
  }

  /**
   * Realiza un aporte monetario a una meta de ahorro.
   * 
   * @param id ID de la meta de ahorro.
   * @param dto Datos del aporte (cuenta origen y monto).
   * @param req Petición HTTP conteniendo el usuario autenticado.
   * @returns La meta de ahorro con su saldo actualizado.
   */
  @Post(':id/deposit')
  @ApiOperation({ summary: 'Registrar un aporte monetario a la meta de ahorro' })
  @ApiResponse({ status: 200, description: 'Aporte registrado correctamente.', type: SavingsGoalDbEntity })
  async deposit(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: DepositSavingsGoalDto,
    @Request() req: { user: User }
  ): Promise<SavingsGoalDbEntity> {
    return this.savingsService.deposit(id, dto, req.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una meta de ahorro' })
  @ApiResponse({ status: 200, description: 'Meta de ahorro eliminada exitosamente' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: User }
  ): Promise<void> {
    return this.savingsService.remove(id, req.user);
  }
}
