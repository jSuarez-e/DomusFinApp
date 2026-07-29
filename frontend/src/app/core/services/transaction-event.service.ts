// frontend/src/app/core/services/transaction-event.service.ts
import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TransactionEventService {
  public transactionSaved = signal<number>(0);

  emitTransactionSaved() {
    this.transactionSaved.update(v => v + 1);
  }
}
