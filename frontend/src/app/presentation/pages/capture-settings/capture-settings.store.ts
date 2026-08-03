import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState, withHooks } from '@ngrx/signals';

/**
 * Interface del estado de captura en background
 */
type CaptureSettingsState = {
  isSmsEnabled: boolean;
  isPushEnabled: boolean;
  isBackgroundSyncEnabled: boolean;
};

const initialState: CaptureSettingsState = {
  isSmsEnabled: true,
  isPushEnabled: true,
  isBackgroundSyncEnabled: true
};

/**
 * Store reactivo para manejar la configuración nativa de captura.
 */
export const CaptureSettingsStore = signalStore(
  withState(initialState),
  withMethods((store) => ({
    /**
     * Alterna la lectura de SMS.
     * @param {boolean} enabled - Estado a fijar.
     */
    toggleSms(enabled: boolean): void {
      patchState(store, { isSmsEnabled: enabled });
      localStorage.setItem('sms_capture_enabled', String(enabled));
    },

    /**
     * Alterna la lectura de Notificaciones Push.
     * @param {boolean} enabled - Estado a fijar.
     */
    togglePush(enabled: boolean): void {
      patchState(store, { isPushEnabled: enabled });
      localStorage.setItem('push_capture_enabled', String(enabled));
    },

    /**
     * Alterna la sincronización persistente en background.
     * @param {boolean} enabled - Estado a fijar.
     */
    toggleBgSync(enabled: boolean): void {
      patchState(store, { isBackgroundSyncEnabled: enabled });
      localStorage.setItem('bg_sync_enabled', String(enabled));
    },

    /**
     * Carga el estado guardado del almacenamiento local (si existe).
     */
    loadSavedSettings(): void {
      const savedSms = localStorage.getItem('sms_capture_enabled');
      const savedPush = localStorage.getItem('push_capture_enabled');
      const savedBg = localStorage.getItem('bg_sync_enabled');

      patchState(store, {
        isSmsEnabled: savedSms !== null ? savedSms === 'true' : store.isSmsEnabled(),
        isPushEnabled: savedPush !== null ? savedPush === 'true' : store.isPushEnabled(),
        isBackgroundSyncEnabled: savedBg !== null ? savedBg === 'true' : store.isBackgroundSyncEnabled()
      });
    }
  })),
  withHooks({
    onInit(store) {
      store.loadSavedSettings();
    }
  })
);
