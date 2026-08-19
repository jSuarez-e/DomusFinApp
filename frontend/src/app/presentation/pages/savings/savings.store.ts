import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { SavingsGoal } from '@shared/index';
import { SavingsService } from '../../../core/services/savings.service';

/**
 * Estado local para el módulo de ahorros.
 */
type SavingsState = {
  savingsGoals: SavingsGoal[];
  isLoading: boolean;
  error: string | null;
};

const initialState: SavingsState = {
  savingsGoals: [],
  isLoading: false,
  error: null
};

/**
 * Store reactivo y localizado para la gestión de metas de ahorro.
 * Proporciona el estado derivado y los métodos de mutación asíncronos para interactuar con la API.
 */
export const SavingsStore = signalStore(
  withState(initialState),
  withComputed((store) => ({
    /**
     * Calcula las metas de ahorro activas y finalizadas que no han sido archivadas.
     * Se ordenan colocando primero las metas en curso y luego las completadas.
     * @returns {SavingsGoal[]} Arreglo de metas
     */
    activeSavingsGoals: computed(() => {
      const visible = store.savingsGoals().filter(g => g.status !== 'ARCHIVED');
      return visible.sort((a, b) => {
        const tA = Number(a.targetAmount) || 1;
        const tB = Number(b.targetAmount) || 1;
        const pA = (Number(a.currentAmount) / tA) * 100;
        const pB = (Number(b.currentAmount) / tB) * 100;
        const aCompleted = pA >= 100;
        const bCompleted = pB >= 100;
        
        if (aCompleted && !bCompleted) return 1;
        if (!aCompleted && bCompleted) return -1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }),
    /**
     * Calcula las metas de ahorro que han sido archivadas.
     * @returns {SavingsGoal[]} Arreglo de metas en el histórico
     */
    archivedSavingsGoals: computed(() => 
      store.savingsGoals().filter(g => g.status === 'ARCHIVED')
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    ),
    /**
     * Calcula el total de dinero consolidado que se ha ahorrado en todas las metas.
     * @returns {number} Sumatoria del monto actual de todas las metas
     */
    totalSaved: computed(() => 
      store.savingsGoals().reduce((sum, g) => sum + Number(g.currentAmount), 0)
    ),
    /**
     * Calcula el monto objetivo total consolidado de todas las metas de ahorro.
     * @returns {number} Sumatoria de las metas objetivo
     */
    totalTarget: computed(() => 
      store.savingsGoals().reduce((sum, g) => sum + Number(g.targetAmount), 0)
    ),
    /**
     * Calcula el porcentaje de progreso global sobre todas las metas consolidadas.
     * @returns {number} Porcentaje de progreso de 0 a 100
     */
    globalProgress: computed(() => {
      const target = store.savingsGoals().reduce((sum, g) => sum + Number(g.targetAmount), 0);
      const saved = store.savingsGoals().reduce((sum, g) => sum + Number(g.currentAmount), 0);
      if (target <= 0) return 0;
      return (saved / target) * 100;
    })
  })),
  withMethods((store, savingsService = inject(SavingsService)) => ({
    /**
     * Carga de forma asíncrona las metas de ahorro desde la API.
     * @param {boolean} forceRefresh - Determina si se ignora la caché local para forzar petición de red
     * @returns {Promise<void>} Promesa que resuelve cuando se actualiza el estado
     * @throws {Error} Si falla la comunicación con el backend
     */
    async loadSavings(forceRefresh: boolean = false): Promise<void> {
      patchState(store, { isLoading: true, error: null });
      try {
        await savingsService.loadSavingsGoals(forceRefresh);
        patchState(store, { savingsGoals: savingsService.savingsGoals(), isLoading: false });
      } catch (err: unknown) {
        const msg = (err as any)?.message || 'Error al cargar los ahorros';
        patchState(store, { error: msg, isLoading: false });
        throw err;
      }
    }
  }))
);
