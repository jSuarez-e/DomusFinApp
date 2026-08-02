// backend/src/infrastructure/auth/hashing.service.ts
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

/**
 * Servicio encargado exclusivamente del cifrado y validación de contraseñas (SRP).
 */
@Injectable()
export class HashingService {
  private readonly saltRounds = 10;

  /**
   * Genera un hash seguro para la contraseña proporcionada.
   * @param {string} password Contraseña en texto plano.
   * @returns {Promise<string>} Hash bcrypt generado.
   */
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  /**
   * Compara una contraseña en texto plano con un hash almacenado.
   * @param {string} password Contraseña en texto plano.
   * @param {string} hash Hash almacenado.
   * @returns {Promise<boolean>} Verdadero si coinciden.
   */
  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
