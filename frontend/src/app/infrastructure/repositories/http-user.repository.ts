// frontend/src/app/infrastructure/repositories/http-user.repository.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IUserRepository } from '../../core/domain/user-repository.interface';
import { User } from '../../core/domain/user.model';

@Injectable({
  providedIn: 'root',
})
export class HttpUserRepository implements IUserRepository {
  private readonly apiUrl = 'api/users';

  constructor(private http: HttpClient) {}

  getUserProfile(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }
}
