import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard global de autenticación.
 * Protege las rutas verificando de forma estricta el estado reactivo del usuario.
 *
 * @returns true si el usuario está autenticado, o un UrlTree para redirigir a /login en caso contrario.
 */
export const authGuard: CanActivateFn = (): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Verificación estricta mediante el Signal de currentUser
  if (authService.currentUser() !== null) {
    return true;
  }

  // Redirección al login mediante UrlTree para no romper la pila de navegación de Angular
  return router.createUrlTree(['/login']);
};
