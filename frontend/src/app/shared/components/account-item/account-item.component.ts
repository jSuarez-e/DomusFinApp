import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Account, AccountType } from '@shared/index';
import { IonItemSliding, IonItem, IonItemOptions, IonItemOption, IonBadge, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { lockClosedOutline, peopleOutline, trashOutline, walletOutline, cardOutline, cashOutline, phonePortraitOutline } from 'ionicons/icons';

@Component({
  selector: 'app-account-item',
  standalone: true,
  imports: [CommonModule, IonItemSliding, IonItem, IonItemOptions, IonItemOption, IonBadge, IonIcon],
  template: `
    <ion-item-sliding>
      <ion-item class="accounts-item">
        <div class="accounts-item__icon-wrapper" slot="start">
          <ion-icon [name]="getAccountTypeIcon(account().type)" class="accounts-item__icon"></ion-icon>
        </div>
        <div class="accounts-item__content">
          <div>
            <div class="accounts-item__name">{{ account().name }}</div>
            <div class="accounts-item__balance">
              {{ account().currentBalance | currency:'COP':'symbol-narrow':'1.0-0' }}
            </div>
          </div>
          <div class="accounts-item__meta">
            <ion-badge class="accounts-item__type-badge" color="medium">
              {{ getAccountTypeLabel(account().type) }}
            </ion-badge>
            @if (account().isPrivate) {
              <ion-badge class="accounts-item__privacy-badge accounts-item__privacy-badge--private">
                🔒 Privada
              </ion-badge>
            } @else {
              <ion-badge class="accounts-item__privacy-badge accounts-item__privacy-badge--shared">
                <ion-icon name="people-outline" class="accounts-item__privacy-icon"></ion-icon>
              </ion-badge>
            }
          </div>
        </div>
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
