// backend/src/infrastructure/http/controllers/payment-methods.controller.ts
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Request, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RoleGuard } from '../guards/role.guard';
import { PaymentMethodsService } from '../services/payment-methods.service';
import { User } from '@shared/index';

@ApiTags('Payment Methods')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payment-methods')
export class PaymentMethodsController {
  constructor(private readonly paymentMethodsService: PaymentMethodsService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener los medios de pago disponibles del hogar' })
  @ApiResponse({ status: 200, description: 'Listado de medios de pago' })
  async findAll(@Request() req: { user: User }) {
    if (!req.user.householdId) {
      throw new BadRequestException('El usuario no pertenece a ningún hogar.');
    }
    return this.paymentMethodsService.findAllForHousehold(req.user.householdId);
  }

  @Post()
  @UseGuards(RoleGuard)
  @ApiOperation({ summary: 'Registrar un medio de pago personalizado' })
  @ApiResponse({ status: 201, description: 'Medio de pago creado' })
  async create(
    @Body('name') name: string,
    @Request() req: { user: User }
  ) {
    if (!name || name.trim() === '') {
      throw new BadRequestException('El nombre del medio de pago es obligatorio.');
    }
    if (!req.user.householdId) {
      throw new BadRequestException('El usuario no pertenece a ningún hogar.');
    }
    return this.paymentMethodsService.create(name, req.user.householdId);
  }

  @Put(':id')
  @UseGuards(RoleGuard)
  @ApiOperation({ summary: 'Actualizar un medio de pago personalizado' })
  @ApiResponse({ status: 200, description: 'Medio de pago actualizado' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body('name') name: string,
    @Request() req: { user: User }
  ) {
    if (!name || name.trim() === '') {
      throw new BadRequestException('El nombre del medio de pago es obligatorio.');
    }
    if (!req.user.householdId) {
      throw new BadRequestException('El usuario no pertenece a ningún hogar.');
    }
    return this.paymentMethodsService.update(id, name, req.user.householdId);
  }

  @Delete(':id')
  @UseGuards(RoleGuard)
  @ApiOperation({ summary: 'Eliminar un medio de pago personalizado' })
  @ApiResponse({ status: 200, description: 'Medio de pago eliminado' })
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: User }
  ) {
    if (!req.user.householdId) {
      throw new BadRequestException('El usuario no pertenece a ningún hogar.');
    }
    await this.paymentMethodsService.delete(id, req.user.householdId);
    return { success: true, message: 'Medio de pago eliminado correctamente.' };
  }
}
