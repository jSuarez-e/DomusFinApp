// frontend/src/app/core/domain/user-repository.interface.ts
import { Observable } from 'rxjs';
import { User } from './user.model';

export interface IUserRepository {
  getUserProfile(id: number): Observable<User>;
}
