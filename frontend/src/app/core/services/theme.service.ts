// frontend/src/app/core/services/theme.service.ts
import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private isDarkTheme = signal<boolean>(false);
  public isDark = this.isDarkTheme.asReadonly();

  constructor() {
    this.loadTheme();
  }

  /**
   * Carga el tema guardado en las preferencias del usuario o en localStorage.
   */
  public async loadTheme(): Promise<void> {
    let mode = 'light';
    try {
      const { Preferences } = await import('@capacitor/preferences');
      const { value } = await Preferences.get({ key: 'theme-preference' });
      if (value) {
        mode = value;
      } else {
        mode = localStorage.getItem('theme-preference') || 'light';
      }
    } catch {
      mode = localStorage.getItem('theme-preference') || 'light';
    }

    const dark = mode === 'dark';
    this.isDarkTheme.set(dark);
    this.updateBodyClass(dark);
  }

  /**
   * Cambia el tema de la aplicación.
   */
  public async toggleTheme(dark: boolean): Promise<void> {
    this.isDarkTheme.set(dark);
    this.updateBodyClass(dark);
    const mode = dark ? 'dark' : 'light';

    try {
      const { Preferences } = await import('@capacitor/preferences');
      await Preferences.set({ key: 'theme-preference', value: mode });
    } catch {
      localStorage.setItem('theme-preference', mode);
    }
  }

  private updateBodyClass(dark: boolean): void {
    if (dark) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }
}
