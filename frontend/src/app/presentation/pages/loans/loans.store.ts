import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { Loan } from '@shared/index';
import { LoanService } from '../../../core/services/loan.service';
import { TransactionEventService } from '../../../core/services/transaction-event.service';

type LoansState = {
  loans: Loan[];
  isLoading: boolean;
  error: string | null;
};

const initialState: LoansState = {
  loans: [],
  isLoading: false,
  error: null
};

export const LoansStore = signalStore(
  withState(initialState),
  withComputed((store) => ({
    activeLoans: computed(() => 
      store.loans().filter(l => Number(l.currentBalance) > 0)
    ),
    totalDebt: computed(() => 
      store.loans().reduce((sum, l) => sum + Number(l.currentBalance), 0)
    ),
    totalInitial: computed(() => 
      store.loans().reduce((sum, l) => sum + Number(l.initialPrincipal), 0)
    ),
    debtPaidPercent: computed(() => {
      const initial = store.loans().reduce((sum, l) => sum + Number(l.initialPrincipal), 0);
      const current = store.loans().reduce((sum, l) => sum + Number(l.currentBalance), 0);
      if (initial <= 0) return 0;
      const paid = initial - current;
      return (paid / initial) * 100;
    })
  })),
  withMethods((store, loanService = inject(LoanService), transactionEvents = inject(TransactionEventService)) => ({
    /**
     * Carga de forma asíncrona los préstamos y deudas desde la API.
     * @param forceRefresh Determina si ignora la caché local
     */
    async loadLoans(forceRefresh = false) {
      patchState(store, { isLoading: true, error: null });
      try {
        await loanService.loadLoans(forceRefresh);
        patchState(store, { loans: loanService.loans(), isLoading: false });
      } catch (err: unknown) {
        const msg = (err as any)?.message || 'Error al cargar los préstamos';
        patchState(store, { error: msg, isLoading: false });
      }
    }
  }))
);
