import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonItem, IonLabel, IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personOutline, swapHorizontalOutline, trashOutline } from 'ionicons/icons';

export interface MemberData {
  id: number;
  name: string;
  email: string;
  role: string;
}

/**
 * Componente presentacional para renderizar un miembro del hogar en una lista.
 */
@Component({
  selector: 'app-member-item',
  standalone: true,
  imports: [CommonModule, IonItem, IonLabel, IonButton, IonIcon],
  template: `
    <ion-item class="category-item">
      <div class="category-item__icon-wrapper">
        <ion-icon name="person-outline" class="category-item__icon"></ion-icon>
      </div>
      <ion-label>
        <span class="category-item__name">{{ member().name }}</span>
        <p class="category-item__desc">
          {{ member().email }} • Rol: <strong class="category-item__badge category-item__badge--role">{{ member().role | uppercase }}</strong>
        </p>
      </ion-label>

      @if (member().id !== currentUserId()) {
        <div slot="end" class="category-item__actions">
          <ion-button fill="clear" (click)="toggleRole.emit(member())" class="category-item__btn category-item__btn--edit" title="Cambiar Rol">
            <ion-icon name="swap-horizontal-outline" slot="icon-only"></ion-icon>
          </ion-button>
          <ion-button fill="clear" (click)="delete.emit(member())" class="category-item__btn category-item__btn--delete" title="Eliminar Miembro">
            <ion-icon name="trash-outline" slot="icon-only"></ion-icon>
          </ion-button>
        </div>
      }
    </ion-item>
  `,
  styleUrls: ['../category-list-item/category-list-item.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class MemberItemComponent {
  public member = input.required<MemberData>();
  public currentUserId = input.required<number | undefined>();
  public toggleRole = output<MemberData>();
  public delete = output<MemberData>();

  /**
   * Inicializa el componente registrando los íconos de Ionic requeridos.
   */
  constructor() {
    addIcons({ personOutline, swapHorizontalOutline, trashOutline });
  }
}
