// backend/src/infrastructure/http/controllers/expenses.controller.ts
import { Controller, Get, Post, Body, Param, UseGuards, UseInterceptors, Request, ParseIntPipe, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ExpensesPrivacyInterceptor } from '../interceptors/expenses-privacy.interceptor';
import { ExpensesService } from '../services/expenses.service';
import { CreateExpenseDto } from '../dtos/create-expense.dto';
import { NativeCaptureExpenseDto } from '../dtos/native-capture.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { User } from '@shared/index';

@ApiTags('Expenses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UseInterceptors(ExpensesPrivacyInterceptor)
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar un nuevo gasto en el hogar' })
  @ApiResponse({ status: 201, description: 'Gasto registrado correctamente.' })
  /**
   * Endpoint POST para registrar un nuevo gasto en el hogar.
   * 
   * @param {CreateExpenseDto} createExpenseDto Datos estructurados del nuevo gasto.
   * @param {object} req Objeto de petición HTTP de NestJS conteniendo el usuario autenticado.
   * @returns {Promise<ExpenseDbEntity>} El gasto recién creado.
   */
  async create(
    @Body() createExpenseDto: CreateExpenseDto,
    @Request() req: { user: User },
  ) {
    return this.expensesService.createExpense(createExpenseDto, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los gastos conjuntos del hogar' })
  @ApiResponse({ status: 200, description: 'Listado de gastos con privacidad parcial aplicada.' })
  /**
   * Endpoint GET para obtener todos los gastos asociados al hogar del usuario actual.
   * Aplica un interceptor de privacidad para redactar la descripción y categoría de gastos privados creados por otros usuarios.
   * 
   * @param {object} req Objeto de petición HTTP de NestJS conteniendo el usuario autenticado.
   * @returns {Promise<ExpenseDbEntity[]>} Lista de gastos con privacidad aplicada.
   * @throws {BadRequestException} Si el usuario no tiene un hogar asignado.
   */
  async findAll(@Request() req: { user: User }) {
    if (!req.user.householdId) {
      throw new BadRequestException('User does not belong to any household.');
    }
    return this.expensesService.getExpensesForHousehold(req.user.householdId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalles de un gasto por ID' })
  @ApiResponse({ status: 200, description: 'Detalle del gasto con privacidad parcial aplicada.' })
  /**
   * Endpoint GET para obtener los detalles de un gasto por su identificador único.
   * Aplica un interceptor de privacidad para redactar la información si el gasto es marcado como privado y pertenece a otro usuario.
   * 
   * @param {number} id ID único del gasto a consultar.
   * @param {object} req Objeto de petición HTTP de NestJS conteniendo el usuario autenticado.
   * @returns {Promise<ExpenseDbEntity>} El detalle del gasto con privacidad aplicada.
   */
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: User },
  ) {
    return this.expensesService.getExpenseById(id, req.user);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Registrar un gasto proveniente de la captura nativa en segundo plano' })
  @ApiResponse({ status: 201, description: 'Gasto de captura nativa registrado correctamente.' })
  /**
   * Endpoint POST para recibir y registrar gastos de captura automática desde el background service nativo.
   * Valida la autenticación JWT a través de JwtAuthGuard.
   * 
   * @param {NativeCaptureExpenseDto} dto Datos del gasto capturados por la app móvil.
   * @param {object} req Objeto de petición HTTP conteniendo el usuario autenticado.
   * @returns {Promise<ExpenseDbEntity>} El gasto registrado.
   */
  async createFromWebhook(
    @Body() dto: NativeCaptureExpenseDto,
    @Request() req: { user: User },
  ) {
    return this.expensesService.createExpenseFromNativeCapture(dto, req.user);
  }
}

