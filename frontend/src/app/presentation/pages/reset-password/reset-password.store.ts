import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';

/** Interface del estado local de Restablecimiento de Contraseña */
type ResetPasswordState = {
  isLoading: boolean;
  error: string | null;
};

const initialState: ResetPasswordState = {
  isLoading: false,
  error: null
};

/** Store reactivo de la vista de Restablecimiento */
export const ResetPasswordStore = signalStore(
  withState(initialState),
  withMethods((
    store,
    authService = inject(AuthService),
    router = inject(Router),
    alertController = inject(AlertController)
  ) => ({
    /**
     * Procesa la solicitud de cambio de contraseña
     * @param {string} token - Token validado desde email.
     * @param {string} newPassword - Nueva contraseña.
     * @returns {Promise<void>}
     */
    async resetPassword(token: string, newPassword: string): Promise<void> {
      patchState(store, { isLoading: true, error: null });
      try {
        await authService.resetPassword({ token, newPassword });
        patchState(store, { isLoading: false });
        
        const alert = await alertController.create({
          header: 'Contraseña Actualizada',
          message: 'Tu contraseña ha sido cambiada. Ya puedes ingresar con tu nueva clave.',
          buttons: ['Ok'],
          cssClass: 'premium-alert'
        });
        await alert.present();
        router.navigate(['/login']);
      } catch (err: unknown) {
        const error = err as { error?: { message?: string } };
        const errMsg = error?.error?.message || 'No se pudo restablecer la contraseña.';
        patchState(store, { isLoading: false, error: errMsg });
        
        const alert = await alertController.create({
          header: 'Fallo al Restablecer',
          message: errMsg,
          buttons: ['Ok'],
          cssClass: 'premium-alert'
        });
        await alert.present();
      }
    }
  }))
);
