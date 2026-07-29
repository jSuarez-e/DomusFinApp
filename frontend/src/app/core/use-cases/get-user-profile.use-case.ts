// frontend/src/app/core/use-cases/get-user-profile.use-case.ts
import { Injectable, Inject } from '@angular/core';
import { Observable } from 'rxjs';
import { IUserRepository } from '../domain/user-repository.interface';
import { User } from '../domain/user.model';

@Injectable({
  providedIn: 'root',
})
export class GetUserProfileUseCase {
  constructor(
    @Inject('IUserRepository') private userRepository: IUserRepository
  ) {}

  execute(id: number): Observable<User> {
    return this.userRepository.getUserProfile(id);
  }
}
