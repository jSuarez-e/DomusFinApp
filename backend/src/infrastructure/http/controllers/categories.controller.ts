// backend/src/infrastructure/http/controllers/categories.controller.ts
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Request, Query, UseGuards, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not } from 'typeorm';

import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RoleGuard } from '../guards/role.guard';
import { CategoryDbEntity } from '../../database/entities/category.entity';
import { ExpenseDbEntity } from '../../database/entities/expense.entity';
import { MovementDbEntity } from '../../database/entities/movement.entity';
import { User, CategoryType } from '@shared/index';

@ApiTags('Categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(
    @InjectRepository(CategoryDbEntity)
    private readonly categoryRepository: Repository<CategoryDbEntity>,
    @InjectRepository(ExpenseDbEntity)
    private readonly expenseRepository: Repository<ExpenseDbEntity>,
    @InjectRepository(MovementDbEntity)
    private readonly movementRepository: Repository<MovementDbEntity>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Obtener las categorías de gastos/ingresos disponibles (globales + hogar)' })
  @ApiResponse({ status: 200, description: 'Listado de categorías' })
  async findAll(
    @Request() req: { user: User },
    @Query('type') type?: CategoryType
  ) {
    if (!req.user.householdId) {
      throw new BadRequestException('El usuario no pertenece a ningún hogar.');
    }

    const whereClause: any[] = [
      { householdId: req.user.householdId },
      { householdId: IsNull() }
    ];

    if (type) {
      whereClause.forEach(clause => {
        clause.type = type;
      });
    }

    return this.categoryRepository.find({
      where: whereClause,
      order: { id: 'ASC' }
    });
  }

  @Post()
  @UseGuards(RoleGuard)
  @ApiOperation({ summary: 'Registrar una nueva categoría personalizada para el hogar' })
  @ApiResponse({ status: 201, description: 'Categoría creada' })
  async create(
    @Body('name') name: string,
    @Body('icon') icon: string,
    @Body('type') type: CategoryType,
    @Request() req: { user: User }
  ) {
    if (!name || name.trim() === '') {
      throw new BadRequestException('El nombre de la categoría es obligatorio.');
    }
    if (!req.user.householdId) {
      throw new BadRequestException('El usuario no pertenece a ningún hogar.');
    }

    const exists = await this.categoryRepository.findOneBy({
      name: name.trim(),
      householdId: req.user.householdId
    });
    if (exists) {
      throw new ConflictException('Ya existe una categoría con ese nombre en tu hogar.');
    }

    const category = this.categoryRepository.create({
      name: name.trim(),
      icon: icon || null,
      householdId: req.user.householdId,
      isGlobal: false,
      type: type || CategoryType.EXPENSE
    });

    return this.categoryRepository.save(category);
  }

  @Put(':id')
  @UseGuards(RoleGuard)
  @ApiOperation({ summary: 'Actualizar una categoría personalizada del hogar' })
  @ApiResponse({ status: 200, description: 'Categoría actualizada' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body('name') name: string,
    @Body('icon') icon: string,
    @Body('type') type: CategoryType,
    @Request() req: { user: User }
  ) {
    if (!name || name.trim() === '') {
      throw new BadRequestException('El nombre de la categoría es obligatorio.');
    }
    if (!req.user.householdId) {
      throw new BadRequestException('El usuario no pertenece a ningún hogar.');
    }

    const category = await this.categoryRepository.findOneBy({ id, householdId: req.user.householdId });
    if (!category) {
      throw new NotFoundException('Categoría no encontrada o no pertenece a este hogar.');
    }

    const exists = await this.categoryRepository.findOne({
      where: {
        name: name.trim(),
        householdId: req.user.householdId,
        id: Not(id)
      }
    });
    if (exists) {
      throw new ConflictException('Ya existe otra categoría con ese nombre en tu hogar.');
    }

    category.name = name.trim();
    category.icon = icon || null;
    if (type) {
      category.type = type;
    }

    return this.categoryRepository.save(category);
  }

  @Delete(':id')
  @UseGuards(RoleGuard)
  @ApiOperation({ summary: 'Eliminar una categoría personalizada del hogar' })
  @ApiResponse({ status: 200, description: 'Categoría eliminada' })
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: User }
  ) {
    if (!req.user.householdId) {
      throw new BadRequestException('El usuario no pertenece a ningún hogar.');
    }

    const category = await this.categoryRepository.findOneBy({ id, householdId: req.user.householdId });
    if (!category) {
      throw new NotFoundException('Categoría no encontrada o no pertenece a este hogar.');
    }

    if (category.isGlobal) {
      throw new BadRequestException('No se pueden eliminar categorías globales.');
    }

    const expenseCount = await this.expenseRepository.countBy({ categoryId: id });
    const movementCount = await this.movementRepository.countBy({ categoryId: id });

    if (expenseCount > 0 || movementCount > 0) {
      throw new BadRequestException('No se puede eliminar la categoría porque está siendo utilizada por gastos o movimientos del hogar.');
    }

    await this.categoryRepository.remove(category);
    return { success: true, message: 'Categoría eliminada correctamente.' };
  }
}
