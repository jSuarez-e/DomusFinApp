// frontend/src/app/presentation/pages/reset-password/reset-password.page.ts
import { ChangeDetectionStrategy, Component, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { lockClosedOutline, checkmarkCircleOutline, eyeOutline, eyeOffOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';
import { PasswordStrengthComponent } from '../../components/password-strength/password-strength.component';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.page.html',
  styleUrls: ['./reset-password.page.css'],
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
    IonLabel,
    PasswordStrengthComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordPage implements OnInit {
  // Input route binding enabled in main.ts
  @Input() token!: string;

  public resetForm: FormGroup;
  public showPassword = signal(false);
  public showConfirmPassword = signal(false);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController
  ) {
    addIcons({ lockClosedOutline, checkmarkCircleOutline, eyeOutline, eyeOffOutline });

    this.resetForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    if (!this.token) {
      this.showErrorAlert('Token de restablecimiento no detectado en el enlace. Por favor, solicita uno nuevo.');
      this.router.navigate(['/forgot-password']);
    }
  }

  /**
   * Validador personalizado para asegurar que las contraseñas coincidan.
   */
  private passwordMatchValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const newPassword = control.get('newPassword');
    const confirmPassword = control.get('confirmPassword');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  /**
   * Ejecuta la solicitud de cambio de contraseña.
   */
  async handleResetPassword() {
    if (this.resetForm.invalid || !this.token) {
      return;
    }

    const { newPassword } = this.resetForm.value;

    try {
      await this.authService.resetPassword({
        token: this.token,
        newPassword
      });
      await this.showSuccessAlert();
      this.router.navigate(['/login']);
    } catch (err: any) {
      const errMsg = err?.error?.message || 'No se pudo restablecer la contraseña.';
      await this.showErrorAlert(errMsg);
    }
  }

  private async showSuccessAlert() {
    const alert = await this.alertController.create({
      header: 'Contraseña Actualizada',
      message: 'Tu contraseña ha sido cambiada. Ya puedes ingresar con tu nueva clave.',
      buttons: ['Ok'],
      cssClass: 'premium-alert'
    });
    await alert.present();
  }

  private async showErrorAlert(message: string) {
    const alert = await this.alertController.create({
      header: 'Fallo al Restablecer',
      message: message,
      buttons: ['Ok'],
      cssClass: 'premium-alert'
    });
    await alert.present();
  }
}
