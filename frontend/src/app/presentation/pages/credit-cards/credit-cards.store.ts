import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { CreditCard } from '@shared/index';
import { CreditCardService } from '../../../core/services/credit-card.service';
import { TransactionEventService } from '../../../core/services/transaction-event.service';

type CreditCardsState = {
  creditCards: CreditCard[];
  isLoading: boolean;
  error: string | null;
};

const initialState: CreditCardsState = {
  creditCards: [],
  isLoading: false,
  error: null
};

export const CreditCardsStore = signalStore(
  withState(initialState),
  withComputed((store) => ({
    totalDebt: computed(() => 
      store.creditCards().reduce((sum, cc) => sum + Number(cc.currentDebt), 0)
    )
  })),
  withMethods((store, creditCardService = inject(CreditCardService), transactionEvents = inject(TransactionEventService)) => ({
    /**
     * Carga de forma asíncrona las tarjetas de crédito.
     */
    async loadCreditCards(forceRefresh = false) {
      patchState(store, { isLoading: true, error: null });
      try {
        await creditCardService.loadCreditCards(forceRefresh);
        patchState(store, { creditCards: creditCardService.creditCards(), isLoading: false });
      } catch (err: unknown) {
        const msg = (err as any)?.message || 'Error al cargar las tarjetas de crédito';
        patchState(store, { error: msg, isLoading: false });
      }
    }
  }))
);
