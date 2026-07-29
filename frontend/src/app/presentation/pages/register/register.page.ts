// frontend/src/app/presentation/pages/register/register.page.ts
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { 
  IonContent, 
  IonCard, 
  IonCardHeader, 
  IonCardTitle, 
  IonCardContent, 
  IonButton, 
  IonInput, 
  IonItem, 
  IonText, 
  IonIcon, 
  IonLabel,
  IonToggle,
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personOutline, mailOutline, lockClosedOutline, keyOutline, arrowBackOutline, eyeOutline, eyeOffOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';
import { PasswordStrengthComponent } from '../../components/password-strength/password-strength.component';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.css'],
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
    IonItem,
    IonText,
    IonIcon,
    IonLabel,
    IonToggle,
    PasswordStrengthComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterPage {
  public registerForm: FormGroup;
  public showPassword = signal(false);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController,
    private route: ActivatedRoute
  ) {
    addIcons({ personOutline, mailOutline, lockClosedOutline, keyOutline, arrowBackOutline, eyeOutline, eyeOffOutline });

    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      isInvited: [false],
      invitationCode: ['']
    });

    // Listen to changes on isInvited to dynamically update validation requirements
    this.registerForm.get('isInvited')?.valueChanges.subscribe((isInvited) => {
      const codeControl = this.registerForm.get('invitationCode');
      if (isInvited) {
        codeControl?.setValidators([Validators.required]);
      } else {
        codeControl?.clearValidators();
        codeControl?.setValue('');
      }
      codeControl?.updateValueAndValidity();
    });

    // Auto-fill invitation code from URL query parameters (magic link)
    this.route.queryParams.subscribe((params) => {
      const code = params['code'];
      if (code) {
        this.registerForm.patchValue({
          isInvited: true,
          invitationCode: code
        });
      }
    });
  }

  /**
   * Procesa la creación de la cuenta.
   */
  async handleRegister() {
    if (this.registerForm.invalid) {
      return;
    }

    const { username, email, password, isInvited, invitationCode } = this.registerForm.value;

    const payload = {
      username,
      email,
      password,
      invitationCode: isInvited ? invitationCode.trim() : undefined
    };

    try {
      await this.authService.register(payload);
      await this.showSuccessAlert();
      this.router.navigate(['/login']);
    } catch (err: any) {
      const errMsg = err?.error?.message || 'No se pudo completar el registro.';
      await this.showErrorAlert(errMsg);
    }
  }

  private async showSuccessAlert() {
    const alert = await this.alertController.create({
      header: 'Registro Exitoso',
      message: 'Tu cuenta ha sido creada. Ahora puedes iniciar sesión.',
      buttons: ['Ok'],
      cssClass: 'premium-alert'
    });
    await alert.present();
  }

  private async showErrorAlert(message: string) {
    const alert = await this.alertController.create({
      header: 'Fallo al Registrar',
      message: message,
      buttons: ['Corregir'],
      cssClass: 'premium-alert'
    });
    await alert.present();
  }
}
