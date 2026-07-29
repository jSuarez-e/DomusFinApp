// backend/src/infrastructure/http/interceptors/movements-privacy.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { User } from '@shared/index';

@Injectable()
export class MovementsPrivacyInterceptor implements NestInterceptor {
  /**
   * Intercepta la respuesta HTTP para aplicar políticas de privacidad y mapeos adicionales a los movimientos.
   * Redacta información sensible si un movimiento es privado y el usuario autenticado no es el propietario del movimiento.
   * 
   * @param {ExecutionContext} context El contexto de ejecución actual de NestJS.
   * @param {CallHandler} next El manejador de la petición/respuesta para continuar la tubería.
   * @returns {Observable<unknown>} Un flujo observable con los datos de respuesta modificados.
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{ user?: User }>();
    const currentUser = request.user;

    return next.handle().pipe(
      map((data) => {
        if (!currentUser) {
          return data;
        }
        return this.processPayload(data, currentUser.id);
      }),
    );
  }

  /**
   * Procesa la carga útil devuelta para verificar si es un único movimiento, un arreglo o el resumen del mes.
   * 
   * @param {unknown} data Datos crudos devueltos por el controlador.
   * @param {number} currentUserId ID del usuario autenticado.
   * @returns {unknown} Los mismos datos estructurados pero con políticas de privacidad aplicadas.
   * @private
   */
  private processPayload(data: unknown, currentUserId: number): unknown {
    if (!data) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.redactMovementIfPrivate(item, currentUserId));
    }

    const payload = data as Record<string, unknown>;

    if (payload['recentMovements'] && Array.isArray(payload['recentMovements'])) {
      return {
        ...payload,
        recentMovements: payload['recentMovements'].map((item) =>
          this.redactMovementIfPrivate(item, currentUserId)
        ),
      };
    }

    return this.redactMovementIfPrivate(data, currentUserId);
  }

  /**
   * Evalúa un único objeto de movimiento y aplica la regla de Privacidad Parcial si corresponde.
   * 
   * @param {unknown} movement El objeto del movimiento a evaluar.
   * @param {number} currentUserId ID del usuario autenticado.
   * @returns {unknown} El objeto del movimiento con descripciones redactadas si aplica.
   * @private
   */
  private redactMovementIfPrivate(movement: unknown, currentUserId: number): unknown {
    if (!movement || typeof movement !== 'object') {
      return movement;
    }

    const mov = movement as Record<string, unknown>;
    const isAutoCaptured = mov['sourceApp'] === 'NativeCapture';
    
    let result: Record<string, any> = {
      ...mov,
      is_auto_captured: isAutoCaptured,
    };

    const isPrivate = result['isPrivate'] === true || result['is_private'] === true;

    if (isPrivate) {
      const creatorId = Number(result['userId'] || result['user_id']);
      if (creatorId !== currentUserId) {
        const creatorName = (result['user'] as Record<string, unknown>)?.['name'] || 'Usuario';
        return {
          ...result,
          description: result['type'] === 'Gasto' ? 'Gasto Privado' : `Movimiento de ${creatorName}`,
          categoryId: null,
          category: null,
        };
      }
    }

    return result;
  }
}
