// backend/src/infrastructure/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

/**
 * Servicio SRP encargado de la generación y firma de JSON Web Tokens (JWT).
 */
@Injectable()
export class AuthService {
  /**
   * Inicializa el servicio de autenticación con sus dependencias requeridas.
   * @param {JwtService} jwtService - Servicio de NestJS para la emisión y verificación de JSON Web Tokens.
   */
  constructor(private readonly jwtService: JwtService) {}

  /**
   * Genera un token JWT firmado para un usuario.
   * @param {number} userId ID único del usuario.
   * @param {string} email Correo electrónico del usuario.
   * @returns {string} Token JWT firmado.
   */
  generateToken(userId: number, email: string): string {
    const payload = { sub: userId, email };
    return this.jwtService.sign(payload);
  }
}
