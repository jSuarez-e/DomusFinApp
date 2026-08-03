import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { Expense } from '@shared/index';
import { ExpenseService } from '../../../core/services/expense.service';
import { TransactionEventService } from '../../../core/services/transaction-event.service';

type ExpensesState = {
  expenses: Expense[];
  categories: any[];
  isLoading: boolean;
  error: string | null;
};

const initialState: ExpensesState = {
  expenses: [],
  categories: [],
  isLoading: false,
  error: null
};

export const ExpensesStore = signalStore(
  withState(initialState),
  withComputed((store) => ({
    totalExpenses: computed(() => 
      store.expenses().reduce((sum, item) => sum + Number(item.amount), 0)
    )
  })),
  withMethods((store, expenseService = inject(ExpenseService), transactionEvents = inject(TransactionEventService)) => ({
    /**
     * Carga de forma asíncrona los gastos y categorías del backend.
     * @param forceRefresh Fuerza la actualización de caché si es true.
     */
    async loadExpenses(forceRefresh = false) {
      patchState(store, { isLoading: true, error: null });
      try {
        await expenseService.loadExpenses(forceRefresh);
        patchState(store, { 
          expenses: expenseService.expenses(), 
          categories: expenseService.categories(),
          isLoading: false 
        });
      } catch (err: unknown) {
        const msg = (err as any)?.message || 'Error al cargar los gastos';
        patchState(store, { error: msg, isLoading: false });
      }
    }
  }))
);
