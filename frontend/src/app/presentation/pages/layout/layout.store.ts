import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { ExpenseService } from '../../../core/services/expense.service';
import { HouseholdService } from '../../../core/services/household.service';

/** Interface del estado local del Layout */
type LayoutState = {
  households: any[];
  membersCount: number;
  isAboutModalOpen: boolean;
};

const initialState: LayoutState = {
  households: [],
  membersCount: 0,
  isAboutModalOpen: false
};

/** Store reactivo de la vista de Layout Global */
export const LayoutStore = signalStore(
  withState(initialState),
  withMethods((
    store,
    http = inject(HttpClient),
    authService = inject(AuthService),
    expenseService = inject(ExpenseService),
    householdService = inject(HouseholdService)
  ) => ({
    /**
     * Carga los datos iniciales del layout (hogares y miembros)
     * @returns {Promise<void>}
     */
    async loadInitialData(): Promise<void> {
      try {
        const list = await firstValueFrom(http.get<any[]>(`${authService.apiUrlUsers}/households`));
        const members = await firstValueFrom(http.get<any[]>(`${authService.apiUrlUsers}/members`));
        
        patchState(store, { 
          households: list || [],
          membersCount: members?.length || 1
        });
      } catch (err) {
        console.warn('No se pudo cargar la lista de hogares del backend, usando mock para demo.', err);
        patchState(store, {
          households: [
            { id: 1, name: 'Hogar Familiar Principal' },
            { id: 2, name: 'Hogar Secundario (Trabajo)' }
          ],
          membersCount: 1
        });
      }
    },

    /**
     * Alterna el estado del modal 'Acerca de'
     * @param {boolean} isOpen - Indica si se debe abrir o cerrar.
     */
    setAboutModalOpen(isOpen: boolean): void {
      patchState(store, { isAboutModalOpen: isOpen });
    },

    /**
     * Cambia el hogar (tenant) activo y recarga servicios asociados
     * @param {number} selectedId - ID del hogar
     * @returns {Promise<void>}
     */
    async switchHousehold(selectedId: number): Promise<void> {
      try {
        await authService.switchHousehold(selectedId);
        await householdService.loadHousehold(selectedId, true);
        await expenseService.loadExpenses(true);

        const members = await firstValueFrom(http.get<any[]>(`${authService.apiUrlUsers}/members`));
        patchState(store, { membersCount: members?.length || 1 });
      } catch (err) {
        console.error('Error switching tenant:', err);
      }
    }
  }))
);
