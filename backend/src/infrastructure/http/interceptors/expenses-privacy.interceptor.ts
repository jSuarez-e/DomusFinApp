// backend/src/infrastructure/http/interceptors/expenses-privacy.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { User } from '@shared/index';

@Injectable()
export class ExpensesPrivacyInterceptor implements NestInterceptor {
  /**
   * Intercepta la respuesta HTTP para aplicar políticas de privacidad a los gastos resultantes.
   * Redacta información sensible si un gasto es privado y el usuario autenticado no es el propietario del gasto.
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
   * Procesa la carga útil devuelta para verificar si es un único gasto o un arreglo de gastos.
   * 
   * @param {unknown} data Datos crudos devueltos por el controlador.
   * @param {number} currentUserId ID del usuario autenticado que realiza la solicitud.
   * @returns {unknown} Los mismos datos estructurados pero con políticas de privacidad aplicadas.
   * @private
   */
  private processPayload(data: unknown, currentUserId: number): unknown {
    if (Array.isArray(data)) {
      return data.map((item) => this.redactExpenseIfPrivate(item, currentUserId));
    }
    return this.redactExpenseIfPrivate(data, currentUserId);
  }

  /**
   * Evalúa un único objeto de gasto y, si es privado y no pertenece al usuario actual, redacta su descripción y categoría.
   * 
   * @param {unknown} expense El objeto del gasto a evaluar.
   * @param {number} currentUserId ID del usuario autenticado.
   * @returns {unknown} El objeto del gasto con descripciones redactadas si aplica la restricción de privacidad.
   * @private
   */
  private redactExpenseIfPrivate(expense: unknown, currentUserId: number): unknown {
    if (!expense || typeof expense !== 'object') {
      return expense;
    }

    const exp = expense as Record<string, unknown>;

    if (exp['isPrivate'] === true || exp['is_private'] === true) {
      const creatorId = Number(exp['userId'] || exp['user_id']);
      
      if (creatorId !== currentUserId) {
        return {
          ...exp,
          description: 'Gasto Privado',
          categoryId: null,
          category: null,
        };
      }
    }

    return expense;
  }
}
