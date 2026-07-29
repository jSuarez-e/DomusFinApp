// frontend/src/app/presentation/pages/login/login.page.ts
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar, 
  IonCard, 
  IonCardHeader, 
  IonCardTitle, 
  IonCardContent, 
  IonButton, 
  IonInput, 
  IonItem, 
  IonCheckbox, 
  IonText, 
  IonIcon, 
  IonLabel,
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logInOutline, personOutline, lockClosedOutline, eyeOutline, eyeOffOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonInput,
    IonItem,
    IonCheckbox,
    IonText,
    IonIcon,
    IonLabel
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  public loginForm!: FormGroup;
  public showPassword = signal(false);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController
  ) {
    // Auto-redirect to dashboard if already authenticated (Remember Me logic)
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
      return;
    }

    addIcons({ logInOutline, personOutline, lockClosedOutline, eyeOutline, eyeOffOutline });

    // Validate alphanumeric or email pattern for username/email
    const userOrEmailPattern = '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,4}$|^[a-zA-Z0-9]+$';

    this.loginForm = this.fb.group({
      usernameOrEmail: ['', [Validators.required, Validators.pattern(userOrEmailPattern)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  /**
   * Procesa la solicitud de login.
   */
  async handleLogin() {
    if (this.loginForm.invalid) {
      return;
    }

    const { usernameOrEmail, password, rememberMe } = this.loginForm.value;

    try {
      await this.authService.login(usernameOrEmail, password, rememberMe);
      this.router.navigate(['/dashboard']);
    } catch (err: any) {
      const errMsg = err?.error?.message || 'Error de red o servidor no disponible';
      await this.showErrorAlert(errMsg);
    }
  }

  /**
   * Muestra ventana emergente de error de autenticación (estilo Swal).
   */
  private async showErrorAlert(message: string) {
    const alert = await this.alertController.create({
      header: 'Fallo de Autenticación',
      subHeader: 'No se pudo iniciar sesión',
      message: message,
      buttons: ['Entendido'],
      cssClass: 'premium-alert'
    });
    await alert.present();
  }
}
