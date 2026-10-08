import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, TimeoutError, catchError, map, tap, throwError, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import { normalizeUserRole, UserRole } from './user.service';

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
    type: string;
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
      timeout({ first: 15000 }),
      catchError((error: unknown) => {
        return throwError(() => new Error(this.extractLoginError(error)));
      }),
      map((response) => {
        const role = normalizeUserRole(response?.user?.type);
        if (!response?.accessToken || !response.user || !role || !Number.isSafeInteger(response.user.id)) {
          throw new Error('The login service returned an invalid account session.');
        }
        return {
          id: response.user.id,
          name: response.user.name,
          mobile: response.user.mobile,
          uniqueId: response.user.uniqueId,
          role,
          agentId: response.user.agentId ?? undefined,
          token: response.accessToken,
        };
      }),
      tap((session) => this.storeSession(session)),
    );
  }

  logout(): void {
    this.expireSession();
  }

  expireSession(): void {
    sessionStorage.removeItem(this.sessionKey);
    this.sessionSubject.next(null);
    void this.router.navigate(['/signin']);
  }

  updateCurrentUserProfile(profile: Pick<AuthenticatedUser, 'id' | 'name' | 'mobile'>): void {
    const currentUser = this.currentUser;
    if (!currentUser || currentUser.id !== profile.id) return;
    this.storeSession({ ...currentUser, name: profile.name, mobile: profile.mobile });
  }

  private extractLoginError(error: unknown): string {
    if (error instanceof TimeoutError) {
      return 'Login took too long. Check that the backend and database are responding, then try again.';
    }
    if (!(error instanceof HttpErrorResponse)) {
      return 'Unable to sign in. Please check your identifier and password.';
    }
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
      const parsed = JSON.parse(storedSession) as Partial<AuthenticatedUser>;
      const role = normalizeUserRole(parsed.role);
      if (!role || !Number.isSafeInteger(parsed.id) || typeof parsed.token !== 'string' || !parsed.token) {
        sessionStorage.removeItem(this.sessionKey);
        return null;
      }
      const session = { ...parsed, role } as AuthenticatedUser;
      if (this.isTokenExpired(session.token)) {
        sessionStorage.removeItem(this.sessionKey);
        return null;
      }
      return session;
    } catch {
      sessionStorage.removeItem(this.sessionKey);
      return null;
    }
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = token.split('.')[1];
      if (!payload) return false;
      const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
      return typeof decoded.exp === 'number' && decoded.exp * 1000 <= Date.now();
    } catch {
      return false;
    }
  }
}
