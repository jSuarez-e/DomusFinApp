// backend/src/core/entities/user.entity.ts
import { User as IUser } from '@shared/index';

export class UserEntity implements IUser {
  id: number;
  email: string;
  name: string;
  role: string;
  householdId: number | null; // Added to implement IUser interface constraint
  createdAt: Date;
  updatedAt: Date;
  currency: string;
  dateFormat: string;
  avatar: string | null;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}
