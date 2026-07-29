import { Controller, Get, Post, Body, Param, Query, UseGuards, Request, ParseIntPipe, UseInterceptors, Delete } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { LoansService } from '../services/loans.service';
import { CreateLoanDto, PayLoanDto, User, AmortizationPeriod } from '@shared/index';
import { LoanDbEntity } from '../../database/entities/loan.entity';
import { PrivacyInterceptor } from '../interceptors/privacy.interceptor';

@ApiTags('Loans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UseInterceptors(PrivacyInterceptor)
@Controller('loans')
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  /**
   * Registra un nuevo crédito/deuda en el sistema.
   * 
   * @param dto Los datos del crédito a registrar.
   * @param req Petición HTTP conteniendo el usuario autenticado.
   * @returns El crédito creado.
   */
  @Post()
  @ApiOperation({ summary: 'Registrar un nuevo crédito/deuda' })
  @ApiResponse({ status: 201, description: 'Crédito registrado correctamente.', type: LoanDbEntity })
  async create(
    @Body() dto: CreateLoanDto,
    @Request() req: { user: User }
  ): Promise<LoanDbEntity> {
    return this.loansService.create(dto, req.user);
  }

  /**
   * Obtiene todos los créditos activos del hogar del usuario.
   * 
   * @param req Petición HTTP conteniendo el usuario autenticado.
   * @returns Listado de créditos.
   */
  @Get()
  @ApiOperation({ summary: 'Obtener todos los créditos/deudas del hogar activo' })
  @ApiResponse({ status: 200, description: 'Créditos del hogar.', type: [LoanDbEntity] })
  async findAll(@Request() req: { user: User }): Promise<LoanDbEntity[]> {
    const householdId = req.user.householdId;
    if (!householdId) {
      return [];
    }
    return this.loansService.findAllForHousehold(householdId, req.user);
  }

  /**
   * Simula la amortización de un préstamo según el sistema francés.
   * Exponemos el endpoint de simulación para proyecciones customizadas.
   */
  @Get('simulate')
  @ApiOperation({ summary: 'Simular tabla de amortización para préstamos (Sistema Francés)' })
  @ApiResponse({ status: 200, description: 'Simulación del plan de cuotas.' })
  simulate(
    @Query('amount') amount: string,
    @Query('interestRate') interestRate: string,
    @Query('installments') installments: string,
  ): AmortizationPeriod[] {
    return this.loansService.simulate(
      Number(amount),
      Number(interestRate),
      Number(installments),
    );
  }

  /**
   * Obtiene los detalles de un crédito por su ID.
   * 
   * @param id ID del crédito.
   * @param req Petición HTTP conteniendo el usuario autenticado.
   * @returns El crédito si el usuario tiene acceso.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Obtener un crédito por su ID' })
  @ApiResponse({ status: 200, description: 'Detalle del crédito.', type: LoanDbEntity })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: User }
  ): Promise<LoanDbEntity> {
    return this.loansService.findOne(id, req.user);
  }

  /**
   * Registra un pago de capital e intereses en el crédito.
   * 
   * @param id ID del crédito.
   * @param dto Datos del pago (cuenta, capital e interés).
   * @param req Petición HTTP conteniendo el usuario autenticado.
   * @returns El crédito con saldo actualizado.
   */
  @Post(':id/pay')
  @ApiOperation({ summary: 'Registrar un pago a cuenta del crédito' })
  @ApiResponse({ status: 200, description: 'Pago registrado correctamente.', type: LoanDbEntity })
  async pay(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PayLoanDto,
    @Request() req: { user: User }
  ): Promise<LoanDbEntity> {
    return this.loansService.pay(id, dto, req.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un crédito o deuda si el saldo es cero' })
  @ApiResponse({ status: 200, description: 'Crédito eliminado exitosamente' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: User }
  ): Promise<void> {
    return this.loansService.remove(id, req.user);
  }
}
