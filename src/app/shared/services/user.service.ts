import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';

export type UserRole = 'superadmin' | 'admin' | 'agent' | 'user';
export type ManagedUserType = 'user' | 'agent';

export interface ManagedUser {
  id: number;
  name: string;
  mobile: string;
  type: ManagedUserType;
  agentId: string | null;
  agentName: string | null;
  uniqueId: string;
  createdAt: string;
  status: 'Active' | 'Inactive';
}

export interface CreateUserRequest {
  name: string;
  mobile: string;
  type?: ManagedUserType;
  agentId?: string;
}

export interface CreateUserResponse {
  user: ManagedUser;
  password: string;
}

interface ApiUser {
  id: number;
  name: string;
  mobile: string;
  type: ManagedUserType;
  agentId: string | null;
  agentName?: string | null;
  uniqueId: string;
  createdAt: string;
}

interface ApiCreateResponse {
  user: ApiUser;
  credentials: { password: string };
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  get role(): UserRole {
    return this.readSession()?.role ?? 'user';
  }

  get currentUserId(): string | null {
    return this.readSession()?.uniqueId ?? null;
  }

  get canCreate(): boolean {
    return this.role === 'admin' || this.role === 'superadmin' || this.role === 'agent';
  }

  get canManage(): boolean {
    return this.role === 'admin' || this.role === 'superadmin';
  }

  getUsers(type: 'all' | ManagedUserType = 'all'): Observable<ManagedUser[]> {
    let params = new HttpParams();
    if (type !== 'all' && this.canManage) {
      params = params.set('type', type);
    }
    return this.http.get<ApiUser[]>(`${this.apiUrl}/users`, { params }).pipe(
      map((users) => users.map((user) => this.toManagedUser(user))),
    );
  }

  getAgents(): Observable<ManagedUser[]> {
    return this.http.get<ApiUser[]>(`${this.apiUrl}/users/agents`).pipe(
      map((users) => users.map((user) => this.toManagedUser(user))),
    );
  }

  getUserById(id: number): Observable<ManagedUser> {
    return this.http.post<ApiUser>(`${this.apiUrl}/users/get-by-id`, { id }).pipe(
      map((user) => this.toManagedUser(user)),
    );
  }

  createUser(request: CreateUserRequest): Observable<CreateUserResponse> {
    return this.http.post<ApiCreateResponse>(`${this.apiUrl}/users/create`, request).pipe(
      timeout({ each: 15000 }),
      map((response) => ({
        user: this.toManagedUser(response.user),
        password: response.credentials.password,
      })),
    );
  }

  updateUser(id: number, changes: Pick<ManagedUser, 'name' | 'mobile' | 'status'>): Observable<ManagedUser> {
    return this.http.patch<ApiUser>(`${this.apiUrl}/users/${id}`, {
      name: changes.name,
      mobile: changes.mobile,
    }).pipe(map((user) => this.toManagedUser(user)));
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/users/${id}`);
  }

  private toManagedUser(user: ApiUser): ManagedUser {
    return {
      ...user,
      agentName: user.agentName ?? null,
      status: 'Active',
    };
  }

  private readSession(): { role: UserRole; uniqueId: string } | null {
    const storedSession = sessionStorage.getItem('casino-auth-session');
    if (!storedSession) {
      return null;
    }
    try {
      return JSON.parse(storedSession) as { role: UserRole; uniqueId: string };
    } catch {
      return null;
    }
  }
}
