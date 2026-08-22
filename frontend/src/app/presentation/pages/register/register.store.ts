import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { RegisterDto } from '@shared/index';

/** Interface del estado local de Registro */
type RegisterState = {
  isLoading: boolean;
  error: string | null;
};

const initialState: RegisterState = {
  isLoading: false,
  error: null
};

/** Store reactivo de la vista de Registro */
export const RegisterStore = signalStore(
  withState(initialState),
  withMethods((
    store,
    authService = inject(AuthService),
    router = inject(Router),
    alertController = inject(AlertController)
  ) => ({
    /**
     * Procesa la creación de una cuenta
     * @param {RegisterDto} payload - Datos del registro.
     * @returns {Promise<void>}
     */
    async register(payload: RegisterDto): Promise<void> {
      patchState(store, { isLoading: true, error: null });
      try {
        await authService.register(payload);
        patchState(store, { isLoading: false });
        
        const alert = await alertController.create({
          header: 'Registro Exitoso',
          message: 'Tu cuenta ha sido creada. Ahora puedes iniciar sesión.',
          buttons: ['Ok'],
          cssClass: 'premium-alert'
        });
        await alert.present();
        router.navigate(['/login']);
      } catch (err: unknown) {
        const error = err as { error?: { message?: string } };
        const errMsg = error?.error?.message || 'No se pudo completar el registro.';
        patchState(store, { isLoading: false, error: errMsg });
        
        const alert = await alertController.create({
          header: 'Fallo al Registrar',
          message: errMsg,
          buttons: ['Corregir'],
          cssClass: 'premium-alert'
        });
        await alert.present();
      }
    }
  }))
);
