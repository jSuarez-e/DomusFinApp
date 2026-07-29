// backend/src/infrastructure/http/controllers/households.controller.ts
import { Body, Controller, Get, Param, ParseIntPipe, Put, Request, UseGuards, BadRequestException, NotFoundException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RoleGuard } from '../guards/role.guard';
import { HouseholdDbEntity } from '../../database/entities/household.entity';
import { User } from '@shared/index';

@ApiTags('Households')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('households')
export class HouseholdsController {
  constructor(
    @InjectRepository(HouseholdDbEntity)
    private readonly householdRepository: Repository<HouseholdDbEntity>,
  ) {}

  @Get(':id')
  @ApiOperation({ summary: 'Obtener información de un hogar por ID' })
  @ApiResponse({ status: 200, description: 'Datos del hogar' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: User }
  ) {
    if (req.user.householdId !== id) {
      throw new BadRequestException('Acceso denegado. Solo puedes consultar tu propio hogar.');
    }

    const household = await this.householdRepository.findOneBy({ id });
    if (!household) {
      throw new NotFoundException('Hogar no encontrado.');
    }

    return household;
  }

  @Put('budget')
  @UseGuards(RoleGuard)
  @ApiOperation({ summary: 'Actualizar la meta de presupuesto mensual del hogar' })
  @ApiResponse({ status: 200, description: 'Presupuesto actualizado' })
  async updateBudget(
    @Body('monthlyBudget') monthlyBudget: number,
    @Request() req: { user: User }
  ) {
    if (!req.user.householdId) {
      throw new BadRequestException('El usuario no pertenece a ningún hogar.');
    }

    const numBudget = Number(monthlyBudget);
    if (isNaN(numBudget) || numBudget <= 0) {
      throw new BadRequestException('El presupuesto mensual debe ser un número positivo.');
    }

    const household = await this.householdRepository.findOneBy({ id: req.user.householdId });
    if (!household) {
      throw new NotFoundException('Hogar no encontrado.');
    }

    household.monthlyBudget = numBudget;
    return this.householdRepository.save(household);
  }
}
