import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IonItem, IonIcon, IonLabel } from '@ionic/angular';

/**
 * Componente reutilizable para opciones del menú lateral.
 */
@Component({
  selector: 'app-menu-option-item',
  standalone: true,
  imports: [CommonModule, RouterModule, IonItem, IonIcon, IonLabel],
  template: `
    <ion-item button [routerLink]="routerLink()" routerLinkActive="active-item" (click)="itemClick.emit()" class="menu-option-item" [ngClass]="customClass()">
      <ion-icon [name]="iconName()" slot="start" class="option-icon" [ngClass]="iconClass()"></ion-icon>
      <ion-label>{{ label() }}</ion-label>
    </ion-item>
  `,
  styleUrls: ['./menu-option-item.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MenuOptionItemComponent {
  /** Ruta a la que navega la opción (opcional si solo ejecuta una acción) */
  public routerLink = input<string | null>(null);
  /** Nombre del icono de Ionicons */
  public iconName = input.required<string>();
  /** Etiqueta de texto de la opción */
  public label = input.required<string>();
  /** Clase CSS adicional para el item */
  public customClass = input<string>('');
  /** Clase CSS adicional para el icono */
  public iconClass = input<string>('');
  
  /** Evento emitido al hacer clic en la opción */
  public itemClick = output<void>();
}
