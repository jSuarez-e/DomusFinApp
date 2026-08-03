import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Expense, User } from '@shared/index';
import {
  IonItem,
  IonLabel,
  IonBadge,
  IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { lockClosedOutline, eyeOffOutline, globeOutline } from 'ionicons/icons';

/**
 * Componente presentacional para la lista de gastos.
 * Delega toda la lógica de estado a los Signals provistos.
 */
@Component({
  selector: 'app-expense-item',
  templateUrl: './expense-item.component.html',
  styleUrls: ['./expense-item.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    IonItem,
    IonLabel,
    IonBadge,
    IonIcon
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpenseItemComponent {
  /** Gasto a renderizar */
  public expense = input.required<Expense>();
  /** Nombre formateado de la categoría */
  public categoryName = input.required<string>();
  /** Usuario logueado para validación de privacidad y formatos */
  public currentUser = input.required<User>();

  constructor() {
    addIcons({ lockClosedOutline, eyeOffOutline, globeOutline });
  }
}
