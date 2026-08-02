// backend/src/core/entities/user.entity.ts
import { User as IUser } from '@shared/index';

/**
 * Domain entity representing a User within the system core.
 * Ensures data immutability for domain operations.
 */
export class UserEntity implements IUser {
  readonly id: number;
  readonly email: string;
  readonly name: string;
  readonly role: string;
  readonly householdId: number | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly currency: string;
  readonly dateFormat: string;
  readonly avatar: string | null;

  /**
   * Initializes a new instance of the UserEntity.
   * @param {Partial<UserEntity>} partial - Partial user data to initialize the entity.
   */
  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}
