import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
} from "@angular/core";

import { FormGroup, ReactiveFormsModule } from "@angular/forms";
import { IonIcon, IonInput, IonButton } from "@ionic/angular";
import { addIcons } from "ionicons";
import { lockClosedOutline, eyeOutline, eyeOffOutline } from "ionicons/icons";

/**
 * Componente reutilizable para campos de contraseña con toggle visual.
 */
@Component({
  selector: "app-password-input",
  standalone: true,
  imports: [ReactiveFormsModule, IonIcon, IonInput, IonButton],
  template: `
    <div class="input-wrapper" [formGroup]="parentForm()">
      <label class="input-label">{{ label() }}</label>
      <div class="input-field">
        <ion-icon name="lock-closed-outline" class="field-icon"></ion-icon>
        <ion-input
          [type]="showPassword() ? 'text' : 'password'"
          [placeholder]="placeholder()"
          [formControlName]="controlName()"
          class="premium-input"
          autocomplete="new-password"
        >
        </ion-input>
        <ion-button
          fill="clear"
          size="small"
          (click)="showPassword.set(!showPassword())"
          class="password-toggle-btn"
        >
          <ion-icon
            [name]="showPassword() ? 'eye-outline' : 'eye-off-outline'"
            slot="icon-only"
            class="password-toggle-icon"
          ></ion-icon>
        </ion-button>
      </div>

      @if (isInvalid()) {
      <div class="error-text">
        {{ errorMessage() }}
      </div>
      }

      <ng-content></ng-content>
    </div>
  `,
  styleUrls: ["./password-input.component.css"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordInputComponent {
  public parentForm = input.required<FormGroup>();
  public controlName = input.required<string>();
  public label = input<string>("Contraseña");
  public placeholder = input<string>("Ingresa tu contraseña");
  public errorMessage = input<string>("La contraseña es obligatoria.");

  public showPassword = signal(false);

  /**
   * Inicializa el componente y registra los íconos de Ionic requeridos para el toggle.
   */
  constructor() {
    addIcons({ lockClosedOutline, eyeOutline, eyeOffOutline });
  }

  /**
   * Verifica si el control es inválido y ha sido tocado
   * @returns {boolean}
   */
  public isInvalid(): boolean {
    const control = this.parentForm().get(this.controlName());
    return !!(control && control.invalid && control.touched);
  }
}
