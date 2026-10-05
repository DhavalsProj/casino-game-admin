import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, catchError, map, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserRole } from './user.service';

export interface AuthenticatedUser {
  id: number;
  name: string;
  mobile: string;
  uniqueId: string;
  role: UserRole;
  agentId?: string;
  token: string;
}

interface LoginResponse {
  accessToken: string;
  user: {
    id: number;
    name: string;
    mobile: string;
    type: UserRole;
    agentId: string | null;
    uniqueId: string;
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = environment.apiUrl;
  private readonly sessionKey = 'casino-auth-session';
  private readonly sessionSubject = new BehaviorSubject<AuthenticatedUser | null>(this.readSession());
  readonly session$ = this.sessionSubject.asObservable();

  constructor(private readonly router: Router, private readonly http: HttpClient) {}

  get currentUser(): AuthenticatedUser | null {
    return this.sessionSubject.value;
  }

  get role(): UserRole | null {
    return this.currentUser?.role ?? null;
  }

  get isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  login(identifier: string, password: string): Observable<AuthenticatedUser> {
    const normalizedIdentifier = identifier.trim();

    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, {
      id: normalizedIdentifier,
      password,
    }).pipe(
      catchError((error: HttpErrorResponse) => {
        return throwError(() => new Error(this.extractLoginError(error)));
      }),
      map((response) => ({
        id: response.user.id,
        name: response.user.name,
        mobile: response.user.mobile,
        uniqueId: response.user.uniqueId,
        role: response.user.type,
        agentId: response.user.agentId ?? undefined,
        token: response.accessToken,
      })),
      tap((session) => this.storeSession(session)),
    );
  }

  logout(): void {
    sessionStorage.removeItem(this.sessionKey);
    this.sessionSubject.next(null);
    void this.router.navigate(['/signin']);
  }

  private extractLoginError(error: HttpErrorResponse): string {
    if (error?.error && typeof error.error === 'object' && 'message' in error.error) {
      const message = error.error.message;
      if (typeof message === 'string' && message.trim()) {
        return message;
      }
    }

    if (error?.status === 0) {
      return 'The login service is not available. Please try again later.';
    }

    return 'Unable to sign in. Please check your identifier and password.';
  }

  private storeSession(session: AuthenticatedUser): void {
    sessionStorage.setItem(this.sessionKey, JSON.stringify(session));
    this.sessionSubject.next(session);
  }

  private readSession(): AuthenticatedUser | null {
    const storedSession = sessionStorage.getItem(this.sessionKey);
    if (!storedSession) {
      return null;
    }
    try {
      return JSON.parse(storedSession) as AuthenticatedUser;
    } catch {
      sessionStorage.removeItem(this.sessionKey);
      return null;
    }
  }
}
