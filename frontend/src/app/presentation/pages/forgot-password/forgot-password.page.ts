// frontend/src/app/presentation/pages/forgot-password/forgot-password.page.ts
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
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
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { mailOutline, arrowBackOutline, keyOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.css'],
  standalone: true,
  imports: [
    CommonModule,
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
    IonLabel
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPasswordPage {
  public recoveryForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController
  ) {
    addIcons({ mailOutline, arrowBackOutline, keyOutline });

    this.recoveryForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  /**
   * Envía la solicitud de recuperación.
   */
  async handleForgotPassword() {
    if (this.recoveryForm.invalid) {
      return;
    }

    const { email } = this.recoveryForm.value;

    try {
      await this.authService.forgotPassword(email);
      await this.showSuccessAlert();
      this.router.navigate(['/login']);
    } catch (err: any) {
      const errMsg = err?.error?.message || 'No se pudo enviar la solicitud de recuperación.';
      await this.showErrorAlert(errMsg);
    }
  }

  private async showSuccessAlert() {
    const alert = await this.alertController.create({
      header: 'Correo Enviado',
      message: 'Revisa tu buzón de correo. Si tu email está registrado, recibirás un link de restablecimiento.',
      buttons: ['Entendido'],
      cssClass: 'premium-alert'
    });
    await alert.present();
  }

  private async showErrorAlert(message: string) {
    const alert = await this.alertController.create({
      header: 'Fallo al Enviar',
      message: message,
      buttons: ['Corregir'],
      cssClass: 'premium-alert'
    });
    await alert.present();
  }
}
