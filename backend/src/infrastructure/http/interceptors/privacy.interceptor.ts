// backend/src/infrastructure/http/interceptors/privacy.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { User } from '@shared/index';

@Injectable()
export class PrivacyInterceptor implements NestInterceptor {
  /**
   * Intercepta las respuestas HTTP para aplicar políticas de visibilidad estrictas en Cuentas, Ahorros, Créditos y Tarjetas.
   * Filtra por completo los listados si son privados de otro usuario, o redacta transacciones.
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{ user?: User }>();
    const currentUser = request.user;
    if (!currentUser) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => this.processPayload(data, currentUser.id))
    );
  }

  private processPayload(data: unknown, currentUserId: number): unknown {
    if (!data) {
      return data;
    }

    // Si es un arreglo, filtramos los elementos privados ajenos
    if (Array.isArray(data)) {
      return data
        .filter((item) => this.shouldKeep(item, currentUserId))
        .map((item) => this.processItem(item, currentUserId));
    }

    // Si es un objeto, procesamos sus claves
    if (typeof data === 'object') {
      if (!this.shouldKeep(data, currentUserId)) {
        return null; // Ocultar por completo objeto único no autorizado
      }

      const payload = data as Record<string, unknown>;
      const result: Record<string, unknown> = {};

      for (const key of Object.keys(payload)) {
        result[key] = this.processPayload(payload[key], currentUserId);
      }
      return result;
    }

    return data;
  }

  /**
   * Evalúa si un objeto debe mantenerse en la respuesta o si es privado y pertenece a otro usuario.
   */
  private shouldKeep(item: unknown, currentUserId: number): boolean {
    if (!item || typeof item !== 'object') {
      return true;
    }

    const obj = item as Record<string, unknown>;

    // Si es un movimiento (Movement), siempre lo mantenemos en los listados (se redactará en processItem)
    const isMovement = 'transactionDate' in obj || ('amount' in obj && 'type' in obj);
    if (isMovement) {
      return true;
    }

    const isPrivate = obj['isPrivate'] === true || obj['is_private'] === true;

    // Si no es privado, es visible
    if (!isPrivate) {
      return true;
    }

    // Si es privado, validar creador
    const rawCreatorId = 
      obj['userId'] ?? 
      obj['user_id'] ?? 
      (obj['user'] as Record<string, unknown>)?.['id'] ??
      obj['creatorId'] ?? 
      obj['creator_id'] ??
      (obj['creator'] as Record<string, unknown>)?.['id'];

    const creatorId = rawCreatorId ? Number(rawCreatorId) : null;
    if (!creatorId) {
      return true; // Mantener por defecto si no hay metadato de creador
    }

    return creatorId === currentUserId;
  }

  /**
   * Procesa un ítem individual para aplicar redacciones en caso de ser un movimiento privado ajeno.
   */
  private processItem(item: unknown, currentUserId: number): unknown {
    if (!item || typeof item !== 'object') {
      return item;
    }

    const obj = item as Record<string, unknown>;
    
    // Validar si el objeto es un movimiento (Movement)
    const isMovement = 'transactionDate' in obj || ('amount' in obj && 'type' in obj);
    
    if (isMovement) {
      const isPrivate = obj['isPrivate'] === true || obj['is_private'] === true;
      const rawCreatorId = 
        obj['userId'] ?? 
        obj['user_id'] ?? 
        (obj['user'] as Record<string, unknown>)?.['id'] ??
        obj['creatorId'] ?? 
        obj['creator_id'] ??
        (obj['creator'] as Record<string, unknown>)?.['id'];

      const creatorId = rawCreatorId ? Number(rawCreatorId) : null;
      
      if (isPrivate && creatorId !== currentUserId) {
        const creatorName = (obj['user'] as Record<string, unknown>)?.['name'] || 'Miembro';
        return {
          ...obj,
          description: obj['type'] === 'Gasto' ? 'Gasto Privado' : `Movimiento de ${creatorName}`,
          categoryId: null,
          category: null,
          isPrivateRedacted: true,
        };
      }
    }

    return obj;
  }
}
