import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState, withComputed } from '@ngrx/signals';
import { computed } from '@angular/core';
import { SavingsService } from '../../../core/services/savings.service';
import { LoanService } from '../../../core/services/loan.service';
import { CreditCardService } from '../../../core/services/credit-card.service';

/** Interface del estado local de Archivo */
type ArchiveState = {
  activeSegment: 'savings' | 'loans' | 'cc';
  isLoading: boolean;
};

const initialState: ArchiveState = {
  activeSegment: 'savings',
  isLoading: false
};

/** Store reactivo de la vista de Archivo Histórico */
export const ArchiveStore = signalStore(
  withState(initialState),
  withComputed((
    store,
    savingsService = inject(SavingsService),
    loanService = inject(LoanService),
    creditCardService = inject(CreditCardService)
  ) => ({
    completedSavings: computed(() => {
      return savingsService.savingsGoals().filter(s => Number(s.currentAmount) >= Number(s.targetAmount));
    }),
    completedLoans: computed(() => {
      return loanService.loans().filter(l => Number(l.currentBalance) <= 0);
    }),
    completedCreditCards: computed(() => {
      return creditCardService.creditCards().filter(c => Number(c.currentDebt) <= 0);
    })
  })),
  withMethods((
    store,
    savingsService = inject(SavingsService),
    loanService = inject(LoanService),
    creditCardService = inject(CreditCardService)
  ) => ({
    /**
     * Carga todos los datos históricos necesarios para el archivo
     * @returns {Promise<void>}
     */
    async loadArchiveData(): Promise<void> {
      patchState(store, { isLoading: true });
      try {
        await Promise.all([
          savingsService.loadSavingsGoals(true),
          loanService.loadLoans(true),
          creditCardService.loadCreditCards(true)
        ]);
      } catch (err) {
        console.error('Failed to load archive data:', err);
        throw err;
      } finally {
        patchState(store, { isLoading: false });
      }
    },
    
    /**
     * Cambia la pestaña activa (savings, loans, cc)
     * @param {'savings' | 'loans' | 'cc'} segment - Pestaña destino
     */
    setActiveSegment(segment: 'savings' | 'loans' | 'cc'): void {
      patchState(store, { activeSegment: segment });
    }
  }))
);
