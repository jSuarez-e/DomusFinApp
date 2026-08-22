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
import {
  listOutline,
  pencilOutline,
  trashOutline,
  fastFoodOutline,
  flashOutline,
  carOutline,
  cameraOutline,
  helpCircleOutline,
  walletOutline,
  cardOutline,
  cashOutline,
} from "ionicons/icons";
import { Category } from "@shared/index";

/**
 * Componente presentacional para renderizar una categoría en una lista de ajustes.
 */
@Component({
  selector: "app-category-list-item",
  standalone: true,
  imports: [IonItem, IonLabel, IonButton, IonIcon],
  template: `
    <ion-item class="category-item">
      <div class="category-item__icon-wrapper">
        <ion-icon
          [name]="category().icon || 'list-outline'"
          class="category-item__icon"
        ></ion-icon>
      </div>
      <ion-label>
        <span class="category-item__name">{{ category().name }}</span>
        @if (category().isGlobal) {
        <span class="category-item__badge">Global</span>
        }
      </ion-label>

      @if (isAdmin() && !category().isGlobal) {
      <div slot="end" class="category-item__actions">
        <ion-button
          fill="clear"
          (click)="edit.emit(category())"
          class="category-item__btn category-item__btn--edit"
        >
          <ion-icon name="pencil-outline" slot="icon-only"></ion-icon>
        </ion-button>
        <ion-button
          fill="clear"
          (click)="delete.emit(category())"
          class="category-item__btn category-item__btn--delete"
        >
          <ion-icon name="trash-outline" slot="icon-only"></ion-icon>
        </ion-button>
      </div>
      }
    </ion-item>
  `,
  styleUrls: ["./category-list-item.component.css"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryListItemComponent {
  /** Objeto de categoría a renderizar */
  public category = input.required<Category>();

  /** Indica si el usuario es administrador */
  public isAdmin = input.required<boolean>();

  /** Evento emitido al querer editar */
  public edit = output<Category>();

  /** Evento emitido al querer eliminar */
  public delete = output<Category>();

  constructor() {
    addIcons({
      listOutline,
      pencilOutline,
      trashOutline,
      fastFoodOutline,
      flashOutline,
      carOutline,
      cameraOutline,
      helpCircleOutline,
      walletOutline,
      cardOutline,
      cashOutline,
    });
  }
}
