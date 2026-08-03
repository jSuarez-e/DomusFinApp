import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CreditCard } from '@shared/index';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cardOutline } from 'ionicons/icons';

/**
 * Componente presentacional para la tarjeta de crédito física.
 * Renderiza la interfaz visual del plástico reutilizable.
 */
@Component({
  selector: 'app-credit-card-ui',
  standalone: true,
  imports: [CommonModule, IonIcon],
  template: `
    <div class="cc-physical-card__glass"></div>
    <div class="cc-physical-card__header">
      <span class="cc-physical-card__bank">
        DOMUSFIN PREMIUM 
        <span class="cc-physical-card__secure-badge">🔒 Privada y Segura</span>
      </span>
      <ion-icon name="card-outline" class="cc-physical-card__logo"></ion-icon>
    </div>
    <div class="cc-physical-card__chip"></div>
    <div class="cc-physical-card__number">•••• •••• •••• {{ creditCard().lastFourDigits }}</div>
    <div class="cc-physical-card__footer">
      <div>
        <div class="cc-physical-card__label">TARJETA</div>
        <div class="cc-physical-card__val">{{ creditCard().aliasName }}</div>
      </div>
      <div class="cc-physical-card__align-right">
        <div class="cc-physical-card__label">DEUDA ACTUAL</div>
        <div class="cc-physical-card__debt">{{ creditCard().currentDebt | currency:'COP':'symbol-narrow':'1.0-0' }}</div>
      </div>
    </div>
  `,
  styleUrls: ['./credit-card-ui.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreditCardUiComponent {
  /** Tarjeta de crédito a renderizar */
  public creditCard = input.required<CreditCard>();

  constructor() {
    addIcons({ cardOutline });
  }
}
