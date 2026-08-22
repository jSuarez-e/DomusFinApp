// frontend/src/app/presentation/pages/reset-password/reset-password.page.ts
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  inject,
} from "@angular/core";

import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { Router, RouterModule } from "@angular/router";
import {
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonInput,
  IonText,
  IonIcon,
  IonLabel,
  AlertController,
} from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import {
  lockClosedOutline,
  checkmarkCircleOutline,
  eyeOutline,
  eyeOffOutline,
} from "ionicons/icons";
import { PasswordStrengthComponent } from "../../components/password-strength/password-strength.component";
import { AuthHeaderComponent } from "../../../shared/components/auth-header/auth-header.component";
import { PasswordInputComponent } from "../../../shared/components/password-input/password-input.component";
import { ResetPasswordStore } from "./reset-password.store";

@Component({
  selector: "app-reset-password",
  templateUrl: "./reset-password.page.html",
  styleUrls: ["./reset-password.page.css"],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterModule,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonInput,
    IonText,
    IonIcon,
    IonLabel,
    PasswordStrengthComponent,
    AuthHeaderComponent,
    PasswordInputComponent,
  ],
  providers: [ResetPasswordStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordPage implements OnInit {
  // Input route binding enabled in main.ts
  @Input() token!: string;

  public resetForm: FormGroup;
  public store = inject(ResetPasswordStore);

  constructor(private fb: FormBuilder, private router: Router) {
    addIcons({
      lockClosedOutline,
      checkmarkCircleOutline,
      eyeOutline,
      eyeOffOutline,
    });

    this.resetForm = this.fb.group(
      {
        newPassword: ["", [Validators.required, Validators.minLength(6)]],
        confirmPassword: ["", [Validators.required]],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  ngOnInit(): void {
    if (!this.token) {
      // Usar en un store global si es necesario, pero como navegamos, basta con redirigir
      this.router.navigate(["/forgot-password"]);
    }
  }

  /**
   * Validador personalizado para asegurar que las contraseñas coincidan.
   */
  private passwordMatchValidator(
    control: AbstractControl
  ): { [key: string]: boolean } | null {
    const newPassword = control.get("newPassword");
    const confirmPassword = control.get("confirmPassword");

    if (
      newPassword &&
      confirmPassword &&
      newPassword.value !== confirmPassword.value
    ) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  /**
   * Ejecuta la solicitud de cambio de contraseña delegando al Store local.
   * @returns {Promise<void>} Resolutor vacío
   */
  async handleResetPassword(): Promise<void> {
    if (this.resetForm.invalid || !this.token) {
      return;
    }

    const { newPassword } = this.resetForm.value;
    await this.store.resetPassword(this.token, newPassword);
  }
}
