import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { Account } from '@shared/index';
import { AccountService } from '../../../core/services/account.service';
import { TransactionEventService } from '../../../core/services/transaction-event.service';

type AccountsState = {
  accounts: Account[];
  isLoading: boolean;
  error: string | null;
};

const initialState: AccountsState = {
  accounts: [],
  isLoading: false,
  error: null
};

export const AccountsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    totalBalance: computed(() => 
      store.accounts().reduce((sum, acc) => sum + Number(acc.currentBalance), 0)
    )
  })),
  withMethods((store, accountService = inject(AccountService), transactionEvents = inject(TransactionEventService)) => ({
    /**
     * Carga las cuentas desde el backend de forma asíncrona.
     * @param forceRefresh Indica si se debe forzar la actualización desde el servidor.
     */
    async loadAccounts(forceRefresh = false) {
      patchState(store, { isLoading: true, error: null });
      try {
        await accountService.loadAccounts(forceRefresh);
        patchState(store, { accounts: accountService.accounts(), isLoading: false });
      } catch (err: unknown) {
        const msg = (err as any)?.message || 'Error loading accounts';
        patchState(store, { error: msg, isLoading: false });
      }
    },
    /**
     * Crea una nueva cuenta y actualiza la tienda.
     * @param data Datos de la cuenta a crear.
     */
    async createAccount(data: any) {
      patchState(store, { isLoading: true, error: null });
      try {
        await accountService.createAccount(data);
        await this.loadAccounts(true);
        transactionEvents.emitTransactionSaved();
      } catch (err: unknown) {
        const msg = (err as any)?.message || 'Error creating account';
        patchState(store, { error: msg, isLoading: false });
        throw err;
      }
    },
    /**
     * Elimina una cuenta existente.
     * @param id ID de la cuenta a eliminar.
     */
    async deleteAccount(id: number) {
      patchState(store, { isLoading: true, error: null });
      try {
        await accountService.deleteAccount(id);
        await this.loadAccounts(true);
        transactionEvents.emitTransactionSaved();
      } catch (err: unknown) {
        const msg = (err as any)?.message || 'Error deleting account';
        patchState(store, { error: msg, isLoading: false });
        throw err;
      }
    }
  }))
);
