import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonItem, IonIcon, IonLabel, IonToggle } from '@ionic/angular/standalone';

/**
 * Componente presentacional para un canal de captura.
 */
@Component({
  selector: 'app-capture-channel-item',
  standalone: true,
  imports: [CommonModule, IonItem, IonIcon, IonLabel, IonToggle],
  template: `
    <ion-item class="capture-item">
      <ion-icon [name]="icon()" slot="start" class="capture-item__icon"></ion-icon>
      <ion-label class="capture-item__label">
        <h3>{{ title() }}</h3>
        <p>{{ description() }}</p>
      </ion-label>
      <ion-toggle 
        [checked]="enabled()" 
        (ionChange)="toggle.emit($event)" 
        slot="end" 
        class="premium-toggle">
      </ion-toggle>
    </ion-item>
  `,
  styleUrls: ['./capture-channel-item.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CaptureChannelItemComponent {
  /** Nombre del icono (Ionicons) */
  public icon = input.required<string>();
  
  /** Título principal de la opción */
  public title = input.required<string>();
  
  /** Descripción del canal de escucha */
  public description = input.required<string>();
  
  /** Estado activado/desactivado */
  public enabled = input.required<boolean>();

  /** Evento emitido cuando se alterna el toggle */
  public toggle = output<any>();
}
