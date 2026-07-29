// backend/src/core/repositories/user-repository.interface.ts
import { UserEntity } from '../entities/user.entity';

export interface IUserRepository {
  findById(id: number): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  save(user: UserEntity): Promise<UserEntity>;
}
