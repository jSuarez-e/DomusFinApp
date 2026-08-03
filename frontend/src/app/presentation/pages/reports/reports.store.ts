import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { ReportDataDto } from '@shared/index';
import { ReportService } from '../../../core/services/report.service';
import { firstValueFrom } from 'rxjs';

/**
 * Mapeo de tipos extraídos directamente desde el DTO principal
 */
type ReportMovementDto = ReportDataDto['movements'][0];
type ReportCategoryDto = ReportDataDto['byCategory'][0];

/**
 * Define el estado del módulo de reportes.
 */
type ReportsState = {
  reportData: ReportDataDto | null;
  selectedYear: number;
  selectedMonth: number;
  selectedMemberId: number | null;
  activeType: 'General' | 'Gasto' | 'Ingreso' | 'Privado';
  excludeCapitalMovements: boolean;
  isLoading: boolean;
  error: string | null;
};

const initialState: ReportsState = {
  reportData: null,
  selectedYear: new Date().getFullYear(),
  selectedMonth: new Date().getMonth() + 1,
  selectedMemberId: null,
  activeType: 'General',
  excludeCapitalMovements: true,
  isLoading: false,
  error: null
};

/**
 * Interfaz para agrupar movimientos financieros por fecha.
 */
export interface GroupedMovement {
  dateLabel: string;
  dateValue: Date;
  dailyTotal: number;
  items: ReportMovementDto[];
}

/**
 * Store reactivo y localizado para la gestión de reportes financieros.
 * Maneja los filtros de fechas, históricos financieros, y formatea los datos para las gráficas.
 */
export const ReportsStore = signalStore(
  withState(initialState),
  withComputed((store) => ({
    /**
     * Calcula el resumen financiero (Gastos, Ingresos, Balance).
     * Excluye o incluye movimientos de capital según el estado de los filtros.
     * @returns {{ totalSpent: number, totalIncome: number, netSavings: number }} Resumen de KPI
     */
    summary: computed(() => {
      const serverSummary = store.reportData()?.summary as any;
      if (!serverSummary) {
        return { totalSpent: 0, totalIncome: 0, netSavings: 0 };
      }
      const exclude = store.excludeCapitalMovements();
      const operating = Number(serverSummary.operatingExpenses || serverSummary.totalSpent || 0);
      const capital = Number(serverSummary.capitalMovements || 0);
      
      const totalSpent = exclude ? operating : (operating + capital);
      const totalIncome = Number(serverSummary.totalIncome || 0);
      const netSavings = totalIncome - totalSpent;
      
      return { totalSpent, totalIncome, netSavings };
    }),

    /**
     * Selector derivado que extrae las categorías para poblar la gráfica y leyendas de colores.
     * @returns {ReportCategoryDto[]} Arreglo de categorías de gasto
     */
    byCategory: computed(() => store.reportData()?.byCategory || []),
    
    /**
     * Selector derivado que filtra la lista cruda de movimientos financieros.
     * @returns {ReportMovementDto[]} Lista de transacciones
     */
    movements: computed(() => {
      const list = store.reportData()?.movements || [];
      if (store.excludeCapitalMovements()) {
        return list.filter((m) => !['Ahorro', 'Pago Crédito', 'Pago TC'].includes(m.type));
      }
      return list;
    }),

    /**
     * Formatea y agrupa los movimientos por día para replicar el diseño visual propuesto.
     * @returns {GroupedMovement[]} Arreglo estructurado de movimientos agrupados por fecha
     */
    groupedMovements: computed(() => {
      const list = store.reportData()?.movements || [];
      const exclude = store.excludeCapitalMovements();
      const filtered = exclude ? list.filter((m) => !['Ahorro', 'Pago Crédito', 'Pago TC'].includes(m.type)) : list;
      
      const groupsMap = new Map<string, GroupedMovement>();
      filtered.forEach(m => {
        const d = new Date(m.transactionDate);
        const dateKey = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long' }).format(d);
        
        if (!groupsMap.has(dateKey)) {
          groupsMap.set(dateKey, {
            dateLabel: dateKey,
            dateValue: d,
            dailyTotal: 0,
            items: []
          });
        }
        const group = groupsMap.get(dateKey)!;
        group.items.push(m);
        group.dailyTotal += (m.type === 'Ingreso' ? Number(m.amount) : -Number(m.amount));
      });
      return Array.from(groupsMap.values()).sort((a, b) => b.dateValue.getTime() - a.dateValue.getTime());
    })
  })),
  withMethods((store, reportService = inject(ReportService)) => ({
    /**
     * Actualiza un filtro específico del reporte.
     * @param {Partial<ReportsState>} filter - Objeto con los filtros a modificar
     */
    updateFilter(filter: Partial<ReportsState>): void {
      patchState(store, filter);
    },

    /**
     * Carga asincrónicamente los reportes basados en el estado actual de los filtros (Año, Mes, Miembro).
     * @returns {Promise<void>} Promesa resolutora
     * @throws {Error} Lanza error si falla la conexión con el servidor
     */
    async loadReport(): Promise<void> {
      patchState(store, { isLoading: true, error: null });
      try {
        const params = {
          year: store.selectedYear(),
          month: store.selectedMonth(),
          userId: store.selectedMemberId() || undefined,
          type: store.activeType()
        };
        const data = await firstValueFrom(reportService.getAnalyticsReport(params));
        patchState(store, { reportData: data, isLoading: false });
      } catch (err: unknown) {
        const msg = (err as any)?.message || 'Error al cargar el reporte.';
        patchState(store, { error: msg, isLoading: false });
        throw err;
      }
    }
  }))
);
