import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Account, AccountType } from '@shared/index';
import { IonItemSliding, IonItem, IonItemOptions, IonItemOption, IonBadge, IonIcon, IonLabel } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { lockClosedOutline, peopleOutline, trashOutline, walletOutline, cardOutline, cashOutline, phonePortraitOutline } from 'ionicons/icons';

@Component({
  selector: 'app-account-item',
  standalone: true,
  imports: [CommonModule, IonItemSliding, IonItem, IonItemOptions, IonItemOption, IonBadge, IonIcon, IonLabel],
  template: `
    <ion-item-sliding>
      <ion-item class="dashboard-item" lines="none">
        <ion-label>
          <div style="display: flex; align-items: center; gap: 6px;">
            <h3 class="item-title">{{ account().name }}</h3>
            @if (account().isPrivate) {
              <ion-icon name="lock-closed" style="font-size: 0.8rem; color: var(--text-secondary, #64748b);"></ion-icon>
            }
          </div>
          <p class="item-subtitle">{{ getAccountTypeLabel(account().type) | uppercase }}</p>
        </ion-label>
        <span slot="end" class="item-value text-success">
          {{ account().currentBalance | currency:'COP':'symbol-narrow':'1.0-0' }}
        </span>
      </ion-item>

      <ion-item-options side="end">
        <ion-item-option color="danger" (click)="onDelete.emit(account())">
          <ion-icon name="trash-outline" slot="icon-only"></ion-icon>
        </ion-item-option>
      </ion-item-options>
    </ion-item-sliding>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountItemComponent {
  public account = input.required<Account>();
  public onDelete = output<Account>();

  constructor() {
    addIcons({ lockClosedOutline, peopleOutline, trashOutline, walletOutline, cardOutline, cashOutline, phonePortraitOutline });
  }

  getAccountTypeIcon(type: string): string {
    switch (type) {
      case AccountType.BANK: return 'card-outline';
      case AccountType.CASH: return 'cash-outline';
      case AccountType.WALLET: return 'phone-portrait-outline';
      default: return 'wallet-outline';
    }
  }

  getAccountTypeLabel(type: string): string {
    switch (type) {
      case AccountType.BANK: return 'Banco';
      case AccountType.CASH: return 'Efectivo';
      case AccountType.WALLET: return 'Billetera';
      default: return type;
    }
  }
}
