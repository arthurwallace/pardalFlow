import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { User, AuthResponse } from '../models';

function resolveAuthApi(): string {
  if (typeof window !== 'undefined' && window.location) {
    if (window.location.port === '4200') {
      return `http://${window.location.hostname}:8000/api/v1/auth`;
    }
    return `${window.location.origin}/api/v1/auth`;
  }
  return 'http://localhost:8000/api/v1/auth';
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = resolveAuthApi();
  private tokenKey = 'pardal_auth_token';
  private userKey = 'pardal_user_data';

  currentUser = signal<User | null>(null);
  isAuthenticated = computed(() => !!this.currentUser());

  constructor(private http: HttpClient, private router: Router) {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    const savedUser = localStorage.getItem(this.userKey);
    const token = localStorage.getItem(this.tokenKey);
    if (savedUser && token) {
      try {
        this.currentUser.set(JSON.parse(savedUser));
      } catch {
        this.logout();
      }
    }
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  login(credentials: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(res => this.setSession(res))
    );
  }

  register(data: { email: string; full_name: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data).pipe(
      tap(res => this.setSession(res))
    );
  }

  private setSession(authRes: AuthResponse) {
    localStorage.setItem(this.tokenKey, authRes.access_token);
    localStorage.setItem(this.userKey, JSON.stringify(authRes.user));
    this.currentUser.set(authRes.user);
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }
}
