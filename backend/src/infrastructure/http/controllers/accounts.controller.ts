// backend/src/infrastructure/http/controllers/accounts.controller.ts
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Request, UseGuards, BadRequestException, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AccountsService } from '../services/accounts.service';
import { CreateAccountDto } from '../dtos/create-account.dto';
import { UpdateAccountDto } from '../dtos/update-account.dto';
import { User } from '@shared/index';
import { PrivacyInterceptor } from '../interceptors/privacy.interceptor';

/**
 * Controlador REST para la gestión de cuentas financieras.
 * Todos los endpoints requieren autenticación JWT y operan bajo el hogar activo del usuario.
 */
@ApiTags('Accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UseInterceptors(PrivacyInterceptor)
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva cuenta financiera (Banco, Efectivo, Billetera)' })
  @ApiResponse({ status: 201, description: 'Cuenta creada exitosamente' })
  @ApiResponse({ status: 409, description: 'Ya existe una cuenta con ese nombre en el hogar' })
  async create(@Body() dto: CreateAccountDto, @Request() req: { user: User }) {
    return this.accountsService.create(dto, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las cuentas financieras del hogar activo' })
  @ApiResponse({ status: 200, description: 'Listado de cuentas del hogar' })
  async findAll(@Request() req: { user: User }) {
    if (!req.user.householdId) {
      throw new BadRequestException('El usuario no pertenece a ningún hogar.');
    }
    const result = await this.accountsService.findAllForHousehold(req.user.householdId, req.user);
    try {
      require('fs').writeFileSync(
        'd:/ANTIGRAVITY/DomusFinApp/backend/query-debug.json',
        JSON.stringify({
          currentUser: req.user,
          result
        }, null, 2)
      );
    } catch (e) {}
    return result;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de una cuenta financiera por ID' })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la cuenta' })
  @ApiResponse({ status: 200, description: 'Detalle de la cuenta' })
  @ApiResponse({ status: 404, description: 'Cuenta no encontrada' })
  async findOne(@Param('id', ParseIntPipe) id: number, @Request() req: { user: User }) {
    if (!req.user.householdId) {
      throw new BadRequestException('El usuario no pertenece a ningún hogar.');
    }
    return this.accountsService.findOne(id, req.user.householdId, req.user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar el nombre de una cuenta financiera' })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la cuenta' })
  @ApiResponse({ status: 200, description: 'Cuenta actualizada' })
  @ApiResponse({ status: 403, description: 'Solo el creador puede editar la cuenta' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAccountDto,
    @Request() req: { user: User },
  ) {
    return this.accountsService.update(id, dto, req.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una cuenta financiera (solo si no tiene movimientos)' })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la cuenta' })
  @ApiResponse({ status: 200, description: 'Cuenta eliminada' })
  @ApiResponse({ status: 400, description: 'La cuenta tiene movimientos asociados' })
  @ApiResponse({ status: 403, description: 'Solo el creador puede eliminar la cuenta' })
  async remove(@Param('id', ParseIntPipe) id: number, @Request() req: { user: User }) {
    await this.accountsService.remove(id, req.user);
    return { message: 'Cuenta eliminada exitosamente.' };
  }
}
