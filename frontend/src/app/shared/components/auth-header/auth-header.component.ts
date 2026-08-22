import { ChangeDetectionStrategy, Component, input } from "@angular/core";

import { IonIcon } from "@ionic/angular";

/**
 * Componente presentacional para el encabezado de las vistas de autenticación
 */
@Component({
  selector: "app-auth-header",
  standalone: true,
  imports: [IonIcon],
  template: `
    <div class="auth-header">
      <div class="app-logo">
        <ion-icon [name]="icon()" class="logo-icon"></ion-icon>
      </div>
      <h1>{{ title() }}</h1>
      <p class="auth-subtitle">{{ subtitle() }}</p>
    </div>
  `,
  styleUrls: ["./auth-header.component.css"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthHeaderComponent {
  /** Nombre del icono (Ionicons) para el logo central */
  public icon = input.required<string>();

  /** Título principal (ej. "DomusFin", "Crear Cuenta") */
  public title = input.required<string>();

  /** Subtítulo descriptivo bajo el título principal */
  public subtitle = input.required<string>();
}
