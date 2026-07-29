import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, Request, UseGuards, BadRequestException, UseInterceptors, Delete } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CreditCardsService } from '../services/credit-cards.service';
import { CreateCreditCardDto } from '../dtos/create-credit-card.dto';
import { PayCreditCardDto } from '../dtos/pay-credit-card.dto';
import { User } from '@shared/index';
import { PrivacyInterceptor } from '../interceptors/privacy.interceptor';

@ApiTags('Credit Cards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UseInterceptors(PrivacyInterceptor)
@Controller('credit-cards')
export class CreditCardsController {
  constructor(private readonly creditCardsService: CreditCardsService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar una nueva tarjeta de crédito' })
  @ApiResponse({ status: 201, description: 'Tarjeta creada exitosamente' })
  @ApiResponse({ status: 409, description: 'Ya existe una tarjeta con este alias' })
  async create(@Body() dto: CreateCreditCardDto, @Request() req: { user: User }) {
    return this.creditCardsService.create(dto, req.user);
  }

  @Get('simulate')
  @ApiOperation({ summary: 'Simular tabla de amortización de cuotas para una compra' })
  @ApiQuery({ name: 'amount', type: Number, description: 'Monto de la compra' })
  @ApiQuery({ name: 'interestRate', type: Number, description: 'Tasa de interés de la tarjeta (%)' })
  @ApiQuery({ name: 'installments', type: Number, description: 'Número de cuotas de diferido' })
  @ApiResponse({ status: 200, description: 'Plan de pagos simulado' })
  async simulate(
    @Query('amount') amount: string,
    @Query('interestRate') interestRate: string,
    @Query('installments') installments: string,
  ) {
    const amt = Number(amount);
    const rate = Number(interestRate);
    const inst = Number(installments);

    if (isNaN(amt) || isNaN(rate) || isNaN(inst)) {
      throw new BadRequestException('Monto, tasa de interés y cuotas deben ser valores numéricos.');
    }

    return this.creditCardsService.simulate(amt, rate, inst);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las tarjetas de crédito del hogar activo' })
  @ApiResponse({ status: 200, description: 'Listado de tarjetas de crédito' })
  async findAll(@Request() req: { user: User }) {
    if (!req.user.householdId) {
      throw new BadRequestException('El usuario no pertenece a ningún hogar.');
    }
    return this.creditCardsService.findAllForHousehold(req.user.householdId, req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de una tarjeta de crédito por ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Detalle de la tarjeta' })
  @ApiResponse({ status: 404, description: 'Tarjeta no encontrada' })
  async findOne(@Param('id', ParseIntPipe) id: number, @Request() req: { user: User }) {
    if (!req.user.householdId) {
      throw new BadRequestException('El usuario no pertenece a ningún hogar.');
    }
    return this.creditCardsService.findOne(id, req.user.householdId, req.user);
  }

  @Post('pay')
  @ApiOperation({ summary: 'Pagar deuda de una tarjeta de crédito debitando saldo de una cuenta' })
  @ApiResponse({ status: 201, description: 'Pago de tarjeta procesado exitosamente' })
  async pay(@Body() dto: PayCreditCardDto, @Request() req: { user: User }) {
    return this.creditCardsService.pay(dto, req.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una tarjeta de crédito si la deuda es cero' })
  @ApiResponse({ status: 200, description: 'Tarjeta de crédito eliminada exitosamente' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: User }
  ): Promise<void> {
    return this.creditCardsService.remove(id, req.user);
  }
}
