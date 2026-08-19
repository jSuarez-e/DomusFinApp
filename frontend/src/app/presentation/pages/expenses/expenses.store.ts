import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { Expense } from '@shared/index';
import { MovementService } from '../../../core/services/movement.service';
import { ExpenseService } from '../../../core/services/expense.service';
import { TransactionEventService } from '../../../core/services/transaction-event.service';
import { firstValueFrom } from 'rxjs';

type ExpensesState = {
  expenses: any[]; // Using any to tolerate both Movement and Expense temporarily
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
  withMethods((store, movementService = inject(MovementService), expenseService = inject(ExpenseService), transactionEvents = inject(TransactionEventService)) => ({
    /**
     * Carga de forma asíncrona los movimientos (ingresos y gastos) del backend.
     * @param forceRefresh Fuerza la actualización de caché si es true.
     */
    async loadExpenses(forceRefresh = false) {
      patchState(store, { isLoading: true, error: null });
      try {
        const movements = await firstValueFrom(movementService.getMovementList());
        await expenseService.loadCategories();
        
        patchState(store, { 
          expenses: movements, // Use movements for the list
          categories: expenseService.categories(),
          isLoading: false 
        });
      } catch (err: unknown) {
        const msg = (err as any)?.message || 'Error al cargar los movimientos';
        patchState(store, { error: msg, isLoading: false });
      }
    }
  }))
);
