// backend/src/infrastructure/http/services/reports.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, IsNull } from 'typeorm';

import { MovementDbEntity } from '../../database/entities/movement.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(MovementDbEntity)
    private readonly movementRepository: Repository<MovementDbEntity>,
  ) {}

  /**
   * Genera el reporte analítico consolidado del hogar para un mes y año específico,
   * aplicando políticas de anonimización a transacciones privadas creadas por otros miembros.
   * 
   * @param {number} householdId ID único del hogar.
   * @param {number} currentUserId ID del usuario autenticado que solicita el reporte.
   * @param {object} query Parámetros de consulta (month, year, userId, type).
   * @returns {Promise<any>}
   */
  async generateReport(
    householdId: number,
    currentUserId: number,
    query: { month?: string; year?: string; userId?: string; type?: string }
  ): Promise<any> {
    const year = Number(query.year) || new Date().getFullYear();
    const month = Number(query.month) || (new Date().getMonth() + 1);

    const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Condición base de búsqueda por Hogar y Rango de Fecha
    const whereCondition: any = {
      householdId,
      transactionDate: Between(startDate, endDate),
    };

    // Filtro por usuario específico (si se solicita)
    if (query.userId) {
      whereCondition.userId = Number(query.userId);
    }

    // Consultar todos los movimientos en base de datos
    const movements = await this.movementRepository.find({
      where: whereCondition,
      relations: ['category', 'user'],
      order: { transactionDate: 'DESC' },
    });

    // Filtrar los movimientos: no incluir ingresos de otros miembros ni movimientos privados de otros miembros
    const allowedMovements = movements.filter((m) => {
      if (m.userId !== currentUserId) {
        if (m.type === 'Ingreso' || m.isPrivate) {
          return false;
        }
      }
      return true;
    });

    // Mapear movimientos aplicando la política de privacidad (Regla de Oro)
    const mappedMovements = allowedMovements.map((m) => {
      const isOwner = m.userId === currentUserId;
      const isPrivate = m.isPrivate === true;
      const isAuto = m.sourceApp === 'NativeCapture';

      if (isPrivate && !isOwner) {
        // Anonimizar transacción ajena privada (sin fecha ni descripción real)
        return {
          id: m.id,
          amount: Number(m.amount),
          transactionDate: null, // Hiding transactionDate for third-party private movements
          type: m.type,
          description: m.type === 'Gasto' ? 'Gasto Privado' : `Movimiento de ${m.user.name}`,
          categoryName: 'Privado',
          categoryId: 0,
          userName: m.user.name,
          isPrivate: true,
          is_auto_captured: isAuto,
        };
      }

      // Detalle normal para movimientos públicos u propios privados
      return {
        id: m.id,
        amount: Number(m.amount),
        transactionDate: m.transactionDate,
        type: m.type,
        description: m.description,
        categoryName: m.category?.name || 'Sin Categoría',
        categoryId: m.categoryId,
        userName: m.user.name,
        isPrivate,
        is_auto_captured: isAuto,
      };
    });

    // Filtrar los movimientos según el tipo solicitado
    let filteredMovements = mappedMovements;
    if (query.type === 'Gasto') {
      filteredMovements = mappedMovements.filter((m) => m.type === 'Gasto');
    } else if (query.type === 'Ingreso') {
      filteredMovements = mappedMovements.filter((m) => m.type === 'Ingreso');
    } else if (query.type === 'Privado') {
      // Filtrar y retornar estrictamente los gastos privados propios de forma detallada
      filteredMovements = movements
        .filter((m) => m.isPrivate && m.userId === currentUserId)
        .map((m) => ({
          id: m.id,
          amount: Number(m.amount),
          transactionDate: m.transactionDate,
          type: m.type,
          description: m.description,
          categoryName: m.category?.name || 'Sin Categoría',
          categoryId: m.categoryId,
          userName: m.user.name,
          isPrivate: true,
          is_auto_captured: m.sourceApp === 'NativeCapture',
        }));
    }

    // Calcular agregaciones a partir de los datos globales mapeados (para mantener la integridad matemática)
    const totalSpent = mappedMovements
      .filter((m) => m.type === 'Gasto')
      .reduce((sum, m) => sum + m.amount, 0);

    const totalIncome = mappedMovements
      .filter((m) => m.type === 'Ingreso')
      .reduce((sum, m) => sum + m.amount, 0);

    const netSavings = totalIncome - totalSpent;

    const operatingExpenses = totalSpent;

    const capitalMovements = mappedMovements
      .filter((m) => ['Ahorro', 'Pago Crédito', 'Pago TC', 'Transferencia'].includes(m.type))
      .reduce((sum, m) => sum + m.amount, 0);

    const operatingExpensesList = filteredMovements.filter((m) => m.type === 'Gasto');
    const capitalMovementsList = filteredMovements.filter((m) => ['Ahorro', 'Pago Crédito', 'Pago TC', 'Transferencia'].includes(m.type));

    // Agrupar gastos por categoría
    const categoryMap = new Map<number, { name: string; amount: number }>();
    let totalSpentForBreakdown = 0;

    mappedMovements
      .filter((m) => m.type === 'Gasto')
      .forEach((m) => {
        const catId = m.categoryId;
        const catName = m.categoryName;
        const current = categoryMap.get(catId) || { name: catName, amount: 0 };
        current.amount += m.amount;
        categoryMap.set(catId, current);
        totalSpentForBreakdown += m.amount;
      });

    const byCategory = Array.from(categoryMap.entries()).map(([id, data]) => ({
      categoryId: id,
      categoryName: data.name,
      amount: data.amount,
      percentage: totalSpentForBreakdown > 0 ? Number(((data.amount / totalSpentForBreakdown) * 100).toFixed(1)) : 0,
    })).sort((a, b) => b.amount - a.amount);

    return {
      summary: {
        totalSpent,
        totalIncome,
        netSavings,
        operatingExpenses,
        capitalMovements,
      },
      byCategory,
      movements: filteredMovements,
      operatingExpenses: operatingExpensesList,
      capitalMovements: capitalMovementsList,
    };
  }
}
