import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular/standalone';

/** Interface del estado local de Recuperación de Contraseña */
type ForgotPasswordState = {
  isLoading: boolean;
  error: string | null;
};

const initialState: ForgotPasswordState = {
  isLoading: false,
  error: null
};

/** Store reactivo de la vista de Recuperación */
export const ForgotPasswordStore = signalStore(
  withState(initialState),
  withMethods((
    store,
    authService = inject(AuthService),
    router = inject(Router),
    alertController = inject(AlertController)
  ) => ({
    /**
     * Procesa la solicitud de recuperación
     * @param {string} email - Correo del usuario
     * @returns {Promise<void>}
     */
    async forgotPassword(email: string): Promise<void> {
      patchState(store, { isLoading: true, error: null });
      try {
        await authService.forgotPassword(email);
        patchState(store, { isLoading: false });
        
        const alert = await alertController.create({
          header: 'Correo Enviado',
          message: 'Revisa tu buzón de correo. Si tu email está registrado, recibirás un link de restablecimiento.',
          buttons: ['Entendido'],
          cssClass: 'premium-alert'
        });
        await alert.present();
        router.navigate(['/login']);
      } catch (err: unknown) {
        const error = err as { error?: { message?: string } };
        const errMsg = error?.error?.message || 'No se pudo enviar la solicitud de recuperación.';
        patchState(store, { isLoading: false, error: errMsg });
        
        const alert = await alertController.create({
          header: 'Fallo al Enviar',
          message: errMsg,
          buttons: ['Corregir'],
          cssClass: 'premium-alert'
        });
        await alert.present();
      }
    }
  }))
);
