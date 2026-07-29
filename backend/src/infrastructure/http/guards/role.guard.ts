// backend/src/infrastructure/http/guards/role.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { User } from '@shared/index';

@Injectable()
export class RoleGuard implements CanActivate {
  /**
   * Determina si la petición actual puede proceder verificando el rol del usuario.
   * Solo permite acceso a usuarios con rol 'admin'.
   * 
   * @param {ExecutionContext} context El contexto de ejecución actual de NestJS.
   * @returns {boolean} Verdadero si el usuario tiene rol 'admin', falso de lo contrario.
   * @throws {ForbiddenException} Si el usuario no está autenticado o no tiene privilegios de administrador.
   */
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user?: User }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuario no autenticado.');
    }

    if (user.role !== 'admin') {
      throw new ForbiddenException('Acceso denegado. Se requieren privilegios de Administrador.');
    }

    return true;
  }
}
