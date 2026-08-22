// frontend/src/app/presentation/pages/forgot-password/forgot-password.page.ts
import { ChangeDetectionStrategy, Component, inject } from "@angular/core";

import {
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
} from "@ionic/angular";
import { addIcons } from "ionicons";
import { mailOutline, arrowBackOutline, keyOutline } from "ionicons/icons";
import { AuthHeaderComponent } from "../../../shared/components/auth-header/auth-header.component";
import { ForgotPasswordStore } from "./forgot-password.store";
import { AuthService } from "@core/services/auth.service";

@Component({
  selector: "app-forgot-password",
  templateUrl: "./forgot-password.page.html",
  styleUrls: ['./forgot-password.page.scss'],
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
    AuthHeaderComponent,
  ],
  providers: [ForgotPasswordStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPasswordPage {
  public recoveryForm: FormGroup;
  public store = inject(ForgotPasswordStore);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController
  ) {
    addIcons({ mailOutline, arrowBackOutline, keyOutline });

    this.recoveryForm = this.fb.group({
      email: ["", [Validators.required, Validators.email]],
    });
  }

  /**
   * Envía la solicitud de recuperación delegando al Store local.
   * @returns {Promise<void>} Resolutor vacío
   */
  async handleForgotPassword(): Promise<void> {
    if (this.recoveryForm.invalid) {
      return;
    }

    const { email } = this.recoveryForm.value;
    await this.store.forgotPassword(email);
  }
}
