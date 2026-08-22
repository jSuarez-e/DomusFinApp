import { ChangeDetectionStrategy, Component, input } from "@angular/core";

import { IonIcon } from "@ionic/angular";

@Component({
  selector: "app-list-header",
  standalone: true,
  imports: [IonIcon],
  template: `
    <div class="list-header" [class.list-header--spaced]="spaced()">
      @if (icon()) {
      <ion-icon [name]="icon()" class="list-header__icon card-icon"></ion-icon>
      }
      <span class="list-header__title card-title">{{ title() }}</span>
    </div>
  `,
  styles: [
    `
      .list-header {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .list-header--spaced {
        margin-top: 32px;
      }
      .list-header__title {
        font-size: 0.8rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--text-secondary, #64748b);
      }
      .list-header__icon {
        font-size: 1.2rem;
        color: var(--ion-color-success, #2dd36f);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListHeaderComponent {
  public title = input.required<string>();
  public icon = input<string>();
  public spaced = input<boolean>(false);
}
