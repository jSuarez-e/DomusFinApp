import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';

/**
 * Componente reutilizable para mostrar un estado vacío (Empty State)
 */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, IonIcon],
  template: `
    <div class="empty-state">
      <ion-icon [name]="iconName()" class="empty-state__icon"></ion-icon>
      <h3 class="empty-state__title">{{ title() }}</h3>
      <p class="empty-state__message">{{ message() }}</p>
    </div>
  `,
  styleUrls: ['./app-empty-state.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppEmptyStateComponent {
  /** Nombre del icono de Ionicons */
  public iconName = input.required<string>();
  /** Título principal del empty state */
  public title = input.required<string>();
  /** Mensaje descriptivo */
  public message = input.required<string>();
}
