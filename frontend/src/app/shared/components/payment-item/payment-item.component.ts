import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from "@angular/core";

import {
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
} from "@ionic/angular";
import { addIcons } from "ionicons";
import { pencilOutline, trashOutline, cardOutline } from "ionicons/icons";
import { PaymentMethod } from "@shared/index";

/**
 * Componente presentacional para renderizar un medio de pago en una lista.
 */
@Component({
  selector: "app-payment-item",
  standalone: true,
  imports: [IonItem, IonLabel, IonButton, IonIcon],
  template: `
    <ion-item class="category-item">
      <div class="category-item__icon-wrapper">
        <ion-icon name="card-outline" class="category-item__icon"></ion-icon>
      </div>
      <ion-label>
        <span class="category-item__name">{{ paymentMethod().name }}</span>
      </ion-label>

      @if (paymentMethod().householdId !== null) {
      <div slot="end" class="category-item__actions">
        <ion-button
          fill="clear"
          (click)="edit.emit(paymentMethod())"
          class="category-item__btn category-item__btn--edit"
        >
          <ion-icon name="pencil-outline" slot="icon-only"></ion-icon>
        </ion-button>
        <ion-button
          fill="clear"
          (click)="delete.emit(paymentMethod())"
          class="category-item__btn category-item__btn--delete"
        >
          <ion-icon name="trash-outline" slot="icon-only"></ion-icon>
        </ion-button>
      </div>
      }
    </ion-item>
  `,
  styleUrls: ['../category-list-item/category-list-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentItemComponent {
  public paymentMethod = input.required<PaymentMethod>();
  public edit = output<PaymentMethod>();
  public delete = output<PaymentMethod>();

  /**
   * Inicializa el componente registrando los íconos necesarios de Ionic.
   */
  constructor() {
    addIcons({ pencilOutline, trashOutline, cardOutline });
  }
}
