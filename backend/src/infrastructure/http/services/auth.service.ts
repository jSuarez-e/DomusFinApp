// backend/src/infrastructure/http/services/auth.service.ts
import { ConflictException, Injectable, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = crypto.scryptSync('domus-fin-secret-magic-key-2026', 'salt-domus', 32);

export function encryptInvitationCode(code: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(code, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

export function decryptInvitationCode(encryptedCode: string): string {
  try {
    const parts = encryptedCode.split(':');
    if (parts.length !== 2) {
      throw new Error('Formato inválido');
    }
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = Buffer.from(parts[1], 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString('utf8');
  } catch (e) {
    throw new BadRequestException('Código de invitación corrupto o inválido.');
  }
}

import { UserDbEntity } from '../../database/entities/user.entity';
import { HouseholdDbEntity } from '../../database/entities/household.entity';
import { RegisterDto } from '../dtos/register.dto';
import { LoginResponseDto } from '@shared/index';

/**
 * Utilidad nativa de hashing seguro utilizando scrypt (Node Crypto).
 */
export class PasswordHasher {
  static hash(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
  }

  static verify(password: string, storedValue: string): boolean {
    const parts = storedValue.split(':');
    if (parts.length !== 2) return false;
    const [salt, storedHash] = parts;
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return hash === storedHash;
  }
}

@Injectable()
export class AuthService {
  // Caché en memoria para tokens temporales de recuperación de contraseña (token -> email)
  private resetTokens = new Map<string, string>();

  constructor(
    @InjectRepository(UserDbEntity)
    private readonly userRepository: Repository<UserDbEntity>,
    @InjectRepository(HouseholdDbEntity)
    private readonly householdRepository: Repository<HouseholdDbEntity>,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Autentica a un usuario verificando su contraseña cifrada y retorna un JWT.
   * 
   * @param {string} usernameOrEmail Correo o nombre de usuario.
   * @param {string} password Contraseña cifrada en cliente (SHA-256).
   * @returns {Promise<LoginResponseDto>} Respuesta con token JWT y datos de perfil.
   */
  async login(usernameOrEmail: string, password: string): Promise<LoginResponseDto> {
    // Buscar usuario seleccionando explícitamente el campo contraseña
    const user = await this.userRepository.createQueryBuilder('user')
      .addSelect('user.password')
      .leftJoinAndSelect('user.household', 'household')
      .where('(user.email = :val OR user.name = :val) AND user.is_active = true', { val: usernameOrEmail })
      .getOne();

    if (!user || !user.password) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isValid = PasswordHasher.verify(password, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        householdId: user.householdId,
        currency: user.currency,
        dateFormat: user.dateFormat,
        avatar: user.avatar,
      } as any,
    };
  }

  /**
   * Registra un nuevo usuario. Si se provee código de invitación, se asocia al hogar existente.
   * Si no, crea un nuevo hogar raíz independiente (Tenant padre).
   * 
   * @param {RegisterDto} dto Datos del formulario de registro.
   * @returns {Promise<any>} Objeto de confirmación del registro.
   */
  async register(dto: RegisterDto): Promise<any> {
    const existing = await this.userRepository.findOneBy({ email: dto.email });
    if (existing) {
      throw new ConflictException('El correo ya se encuentra registrado');
    }

    let householdId: number | null = null;

    if (dto.invitationCode) {
      let decryptedCode: string;
      if (dto.invitationCode.startsWith('HOGAR-')) {
        // Soporte legado para pruebas con código plano
        decryptedCode = dto.invitationCode;
      } else {
        // Descifrar código cifrado simétrico
        decryptedCode = decryptInvitationCode(dto.invitationCode);
      }

      const match = decryptedCode.match(/^HOGAR-(\d+)$/i);
      if (!match) {
        throw new NotFoundException('Código de invitación inválido.');
      }
      const parsedId = parseInt(match[1], 10);
      const household = await this.householdRepository.findOneBy({ id: parsedId });
      if (!household) {
        throw new NotFoundException(`No se encontró el hogar correspondiente.`);
      }
      householdId = household.id;
    } else {
      // Crear hogar padre por defecto
      const newHousehold = this.householdRepository.create({
        name: `Hogar de ${dto.username}`,
      });
      const savedHousehold = await this.householdRepository.save(newHousehold);
      householdId = savedHousehold.id;
    }

    const hashedPassword = PasswordHasher.hash(dto.password);
    const newUser = this.userRepository.create({
      name: dto.username,
      email: dto.email,
      password: hashedPassword,
      householdId,
      role: dto.invitationCode ? 'user' : 'admin',
    });

    await this.userRepository.save(newUser);

    return {
      status: 'success',
      message: 'Usuario registrado exitosamente',
    };
  }

  /**
   * Genera un token temporal para restablecer contraseña y simula el envío del correo de enlace.
   * 
   * @param {string} email Correo a validar en base de datos.
   */
  async forgotPassword(email: string): Promise<any> {
    const user = await this.userRepository.findOneBy({ email });
    if (!user) {
      throw new NotFoundException('No existe un usuario activo asociado a este correo');
    }

    const token = crypto.randomBytes(32).toString('hex');
    this.resetTokens.set(token, email);

    // Simulación del correo en consola del servidor
    console.log(`\n==================================================`);
    console.log(`[MAIL-SIMULATOR] Enlace de restablecimiento generado:`);
    console.log(`URL: http://localhost:8100/reset-password?token=${token}`);
    console.log(`==================================================\n`);

    return {
      status: 'success',
      message: 'Se ha enviado un correo con instrucciones para restablecer su contraseña',
    };
  }

  /**
   * Valida el token temporal y aplica el cambio de contraseña.
   * 
   * @param {string} token Token temporal generado en forgotPassword.
   * @param {string} newPassword Nueva contraseña cifrada en cliente.
   */
  async resetPassword(token: string, newPassword: string): Promise<any> {
    const email = this.resetTokens.get(token);
    if (!email) {
      throw new UnauthorizedException('El token ha expirado o es inválido');
    }

    const user = await this.userRepository.findOneBy({ email });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    user.password = PasswordHasher.hash(newPassword);
    await this.userRepository.save(user);

    // Eliminar token tras el uso
    this.resetTokens.delete(token);

    return {
      status: 'success',
      message: 'Su contraseña ha sido actualizada exitosamente',
    };
  }
}
