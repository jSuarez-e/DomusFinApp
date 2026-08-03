import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

/**
 * Interceptor HTTP Global
 * Inyecta el token JWT en las cabeceras de cada petición y captura errores de red centralizados.
 *
 * @param req - La petición HTTP original.
 * @param next - El manejador de la petición HTTP delegada.
 * @returns Un observable del evento HTTP interceptado.
 * @throws {HttpErrorResponse} Relanza el error después de procesarlo localmente.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem('domusfin_token') || sessionStorage.getItem('domusfin_token');

  let clonedReq = req;
  if (token) {
    clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(clonedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 || error.status === 403) {
        // Redirigir limpiamente si el token es inválido o no hay permisos
        localStorage.removeItem('domusfin_token');
        sessionStorage.removeItem('domusfin_token');
        router.navigate(['/login']);
      } else if (error.status === 500) {
        // Podríamos enviar a un servicio de log o mostrar tostadas globales si hubiera un manejador
        console.error('Error interno del servidor capturado por interceptor:', error);
      }
      return throwError(() => error);
    })
  );
};

