import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular/standalone';

/** Interface del estado local del Login */
type LoginState = {
  isLoading: boolean;
  error: string | null;
};

const initialState: LoginState = {
  isLoading: false,
  error: null
};

/** Store reactivo de la vista de Login */
export const LoginStore = signalStore(
  withState(initialState),
  withMethods((
    store,
    authService = inject(AuthService),
    router = inject(Router),
    alertController = inject(AlertController)
  ) => ({
    /**
     * Procesa la solicitud de login contra la API
     * @param {string} usernameOrEmail - El usuario o email.
     * @param {string} password - Contraseña ingresada.
     * @param {boolean} rememberMe - Flag de recordar sesión.
     * @returns {Promise<void>}
     */
    async login(usernameOrEmail: string, password: string, rememberMe: boolean): Promise<void> {
      patchState(store, { isLoading: true, error: null });
      try {
        await authService.login(usernameOrEmail, password, rememberMe);
        patchState(store, { isLoading: false });
        router.navigate(['/dashboard']);
      } catch (err: unknown) {
        const error = err as { error?: { message?: string } };
        const errMsg = error?.error?.message || 'Error de red o servidor no disponible';
        patchState(store, { isLoading: false, error: errMsg });
        
        const alert = await alertController.create({
          header: 'Fallo de Autenticación',
          subHeader: 'No se pudo iniciar sesión',
          message: errMsg,
          buttons: ['Entendido'],
          cssClass: 'premium-alert'
        });
        await alert.present();
      }
    }
  }))
);
