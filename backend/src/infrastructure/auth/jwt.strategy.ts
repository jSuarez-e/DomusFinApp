// backend/src/infrastructure/auth/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { IUserRepository } from '../../core/repositories/user-repository.interface';
import { Inject } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'supersecretkey',
    });
  }

  /**
   * Valida la firma del token JWT decodificado y recupera la entidad de usuario correspondiente de la base de datos.
   * 
   * @param {object} payload El payload decodificado del JWT, que contiene el identificador de usuario `sub` y su `email`.
   * @returns {Promise<UserEntity>} La entidad del usuario autenticado y validado.
   * @throws {UnauthorizedException} Si el usuario indicado en el payload no existe en la base de datos.
   */
  async validate(payload: { sub: number; email: string }) {
    try {
      const user = await this.userRepository.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException();
      }
      return user;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Error en la validación del token');
    }
  }
}
