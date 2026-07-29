// backend/src/infrastructure/database/repositories/typeorm-user.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IUserRepository } from '../../../core/repositories/user-repository.interface';
import { UserEntity } from '../../../core/entities/user.entity';
import { UserDbEntity } from '../entities/user.entity';

@Injectable()
export class TypeOrmUserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserDbEntity)
    private readonly repository: Repository<UserDbEntity>,
  ) {}

  /**
   * Busca un usuario por su identificador único.
   * 
   * @param {number} id ID único del usuario.
   * @returns {Promise<UserEntity | null>} El usuario de dominio mapeado o null si no se encuentra.
   */
  async findById(id: number): Promise<UserEntity | null> {
    const user = await this.repository.findOneBy({ id });
    return user ? new UserEntity(user) : null;
  }

  /**
   * Busca un usuario por su dirección de correo electrónico.
   * 
   * @param {string} email Correo electrónico único del usuario.
   * @returns {Promise<UserEntity | null>} El usuario de dominio mapeado o null si no se encuentra.
   */
  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.repository.findOneBy({ email });
    return user ? new UserEntity(user) : null;
  }

  /**
   * Crea o actualiza un registro de usuario en la base de datos y lo devuelve mapeado como entidad de dominio.
   * 
   * @param {UserEntity} user Entidad de dominio con los datos del usuario.
   * @returns {Promise<UserEntity>} La entidad de dominio del usuario guardado.
   */
  async save(user: UserEntity): Promise<UserEntity> {
    const dbEntity = this.repository.create(user);
    const saved = await this.repository.save(dbEntity);
    return new UserEntity(saved);
  }
}
