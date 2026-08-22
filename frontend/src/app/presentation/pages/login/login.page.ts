// frontend/src/app/presentation/pages/login/login.page.ts
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
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
  IonLabel,
  IonIcon,
  ViewWillEnter
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logInOutline, personOutline, lockClosedOutline, eyeOutline, eyeOffOutline } from 'ionicons/icons';
import { AuthHeaderComponent } from '../../../shared/components/auth-header/auth-header.component';
import { PasswordInputComponent } from '../../../shared/components/password-input/password-input.component';
import { LoginStore } from './login.store';

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
    IonLabel,
    AuthHeaderComponent,
    PasswordInputComponent
  ],
  providers: [LoginStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage implements ViewWillEnter {
  public loginForm!: FormGroup;
  public store = inject(LoginStore);

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    // Si ya está autenticado, redirigir (se asume que AuthService u otro guard lo maneja globalmente, pero por seguridad temporal)
    const token = localStorage.getItem('access_token');
    if (token) {
      this.router.navigate(['/dashboard']);
      return;
    }

    addIcons({ logInOutline, personOutline, lockClosedOutline, eyeOutline, eyeOffOutline });

    // Validate alphanumeric, dots, underscores, hyphens or email pattern for username/email
    const userOrEmailPattern = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,4}$|^[a-zA-Z0-9._\-]+$/;

    this.loginForm = this.fb.group({
      usernameOrEmail: ['', [Validators.required, Validators.pattern(userOrEmailPattern)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  ionViewWillEnter(): void {
    if (this.loginForm) {
      this.loginForm.reset({ rememberMe: false });
    }
  }

  /**
   * Procesa la solicitud de login delegando al Store local.
   * @returns {Promise<void>} Resolutor vacío
   */
  async handleLogin(): Promise<void> {
    if (this.loginForm.invalid) {
      return;
    }

    const { usernameOrEmail, password, rememberMe } = this.loginForm.value;
    await this.store.login(usernameOrEmail, password, rememberMe);
  }
}
