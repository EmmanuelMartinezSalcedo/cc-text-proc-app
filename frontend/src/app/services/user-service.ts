import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
  id: number;
  name: string;
  email: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private baseUrl = 'http://localhost:4000/users';

  constructor(private http: HttpClient) {}

  login(data: LoginRequest): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}/login`, data);
  }

  register(data: RegisterRequest): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}/register`, data);
  }

  deleteHistory(userId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/history`, {
      body: { user_id: userId },
    });
  }
}
