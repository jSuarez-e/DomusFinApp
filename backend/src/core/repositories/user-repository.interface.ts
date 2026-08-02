// backend/src/core/repositories/user-repository.interface.ts
import { UserEntity } from '../entities/user.entity';

/**
 * Core repository interface for User entities.
 * Defines strict asynchronous persistence operations for the domain.
 */
export interface IUserRepository {
  /**
   * Finds a user by their unique identifier.
   * @param {number} id - The ID of the user.
   * @returns {Promise<UserEntity | null>} The user entity if found, otherwise null.
   */
  findById(id: number): Promise<UserEntity | null>;

  /**
   * Finds a user by their email address.
   * @param {string} email - The email address of the user.
   * @returns {Promise<UserEntity | null>} The user entity if found, otherwise null.
   */
  findByEmail(email: string): Promise<UserEntity | null>;

  /**
   * Saves a new or existing user entity.
   * @param {UserEntity} user - The user entity to save.
   * @returns {Promise<UserEntity>} The saved user entity.
   */
  save(user: UserEntity): Promise<UserEntity>;
}
