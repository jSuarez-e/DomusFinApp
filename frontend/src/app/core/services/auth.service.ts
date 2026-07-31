// frontend/src/app/core/services/auth.service.ts
import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { LoginResponseDto, RegisterDto, ForgotPasswordDto, ResetPasswordDto } from '@shared/index';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly baseUrlEnv = environment.apiUrl;
  public readonly apiUrlAuth = this.baseUrlEnv + '/auth';
  public readonly apiUrlUsers = this.baseUrlEnv + '/users';

  // Reactivity State with Signals
  private currentUserState = signal<any | null>(null);
  public currentUser = this.currentUserState.asReadonly();
  public isAuthenticated = computed(() => this.currentUserState() !== null);

  constructor(private http: HttpClient, private router: Router) {
    this.checkAutoLogin();
  }

  /**
   * Genera un hash SHA-256 en el cliente utilizando la API nativa Web Crypto.
   * Esto asegura que la contraseña viaje cifrada antes de transmitirse.
   */
  public async hashPassword(password: string): Promise<string> {
    const msgUint8 = new TextEncoder().encode(password);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Verifica al arrancar la aplicación si existen datos de sesión previamente recordados.
   */
  private checkAutoLogin(): void {
    const savedUser = localStorage.getItem('domusfin_user') || sessionStorage.getItem('domusfin_user');
    const token = localStorage.getItem('domusfin_token') || sessionStorage.getItem('domusfin_token');

    if (savedUser && token) {
      try {
        const user = JSON.parse(savedUser);
        this.currentUserState.set(user);
      } catch (e) {
        this.logout();
      }
    }
  }

  /**
   * Inicia sesión contra la API REST, aplicando hashing previo a la contraseña.
   * 
   * @param {string} usernameOrEmail Correo o usuario.
   * @param {string} password Contraseña en texto plano.
   * @param {boolean} rememberMe Bandera para recordar datos en el dispositivo.
   */
  async login(usernameOrEmail: string, password: string, rememberMe: boolean): Promise<void> {
    try {
      const encryptedPassword = await this.hashPassword(password);
      const response = await firstValueFrom(
        this.http.post<LoginResponseDto>(`${this.apiUrlAuth}/login`, {
          usernameOrEmail,
          password: encryptedPassword,
        })
      );

      this.currentUserState.set(response.user);

      if (rememberMe) {
        localStorage.setItem('domusfin_token', response.accessToken);
        localStorage.setItem('domusfin_user', JSON.stringify(response.user));
      } else {
        sessionStorage.setItem('domusfin_token', response.accessToken);
        sessionStorage.setItem('domusfin_user', JSON.stringify(response.user));
      }

      // Persist in Capacitor Preferences for native background service access
      try {
        const { Preferences } = await import('@capacitor/preferences');
        await Preferences.set({ key: 'domusfin_token', value: response.accessToken });
      } catch (e) {
        console.warn('Failed to save token to Capacitor Preferences:', e);
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Registra un nuevo usuario en la plataforma.
   */
  async register(dto: RegisterDto): Promise<void> {
    try {
      const encryptedPassword = await this.hashPassword(dto.password);
      await firstValueFrom(
        this.http.post<any>(`${this.apiUrlAuth}/register`, {
          ...dto,
          password: encryptedPassword,
        })
      );
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  }

  /**
   * Envía solicitud de recuperación de contraseña.
   */
  async forgotPassword(email: string): Promise<void> {
    try {
      const dto: ForgotPasswordDto = { email };
      await firstValueFrom(this.http.post<any>(`${this.apiUrlAuth}/forgot-password`, dto));
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  }

  /**
   * Restablece la contraseña usando el token temporal.
   */
  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    try {
      const encryptedPassword = await this.hashPassword(dto.newPassword);
      await firstValueFrom(
        this.http.post<any>(`${this.apiUrlAuth}/reset-password`, {
          token: dto.token,
          newPassword: encryptedPassword,
        })
      );
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  }

  /**
   * Cambia el hogar (Tenant) activo del usuario en el servidor y actualiza el estado reactivo local.
   * 
   * @param {number} householdId ID único del nuevo hogar a seleccionar.
   */
  async switchHousehold(householdId: number): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.post<any>(`${this.apiUrlUsers}/switch-household/${householdId}`, {})
      );

      this.currentUserState.set(response.user);

      // Si recordaba sesión, actualizamos los datos persistidos locales o de sesión
      if (localStorage.getItem('domusfin_user')) {
        localStorage.setItem('domusfin_user', JSON.stringify(response.user));
      } else if (sessionStorage.getItem('domusfin_user')) {
        sessionStorage.setItem('domusfin_user', JSON.stringify(response.user));
      }
    } catch (error) {
      console.error('Error switching household:', error);
      throw error;
    }
  }

  /**
   * Actualiza la contraseña del usuario autenticado.
   */
  async updatePassword(currentPassword: string, newPassword: string): Promise<void> {
    const encryptedCurrent = await this.hashPassword(currentPassword);
    const encryptedNew = await this.hashPassword(newPassword);
    await firstValueFrom(
      this.http.patch<any>(`${this.apiUrlUsers}/settings/password`, {
        currentPassword: encryptedCurrent,
        newPassword: encryptedNew,
      })
    );
  }

  /**
   * Actualiza el correo electrónico del usuario autenticado y su estado local.
   */
  async updateEmail(newEmail: string): Promise<void> {
    const response = await firstValueFrom(
      this.http.patch<any>(`${this.apiUrlUsers}/settings/email`, { newEmail })
    );

    this.currentUserState.set(response.user);

    if (localStorage.getItem('domusfin_user')) {
      localStorage.setItem('domusfin_user', JSON.stringify(response.user));
    } else if (sessionStorage.getItem('domusfin_user')) {
      sessionStorage.setItem('domusfin_user', JSON.stringify(response.user));
    }
  }

  /**
   * Actualiza las preferencias visuales del usuario autenticado y su estado local.
   */
  async updatePreferences(currency: string, dateFormat: string): Promise<void> {
    const response = await firstValueFrom(
      this.http.patch<any>(`${this.apiUrlUsers}/settings/preferences`, { currency, dateFormat })
    );

    this.currentUserState.set(response.user);

    if (localStorage.getItem('domusfin_user')) {
      localStorage.setItem('domusfin_user', JSON.stringify(response.user));
    } else if (sessionStorage.getItem('domusfin_user')) {
      sessionStorage.setItem('domusfin_user', JSON.stringify(response.user));
    }
  }

  /**
   * Actualiza la foto de perfil / avatar del usuario autenticado.
   */
  async updateAvatar(avatar: string): Promise<void> {
    const response = await firstValueFrom(
      this.http.patch<any>(`${this.apiUrlUsers}/settings/avatar`, { avatar })
    );

    this.currentUserState.set(response.user);

    if (localStorage.getItem('domusfin_user')) {
      localStorage.setItem('domusfin_user', JSON.stringify(response.user));
    } else if (sessionStorage.getItem('domusfin_user')) {
      sessionStorage.setItem('domusfin_user', JSON.stringify(response.user));
    }
  }

  /**
   * Cierra la sesión activa borrando credenciales persistidas.
   */
  logout(): void {
    this.currentUserState.set(null);
    localStorage.removeItem('domusfin_token');
    localStorage.removeItem('domusfin_user');
    sessionStorage.removeItem('domusfin_token');
    sessionStorage.removeItem('domusfin_user');
    
    // Clear in Capacitor Preferences
    try {
      import('@capacitor/preferences').then(({ Preferences }) => {
        Preferences.remove({ key: 'domusfin_token' });
      });
    } catch (e) {}

    this.router.navigate(['/login']);
  }
}
