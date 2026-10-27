import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, timeout } from "rxjs";
import { environment } from "../../../environments/environment";

export interface ApiLog {
  id: string;
  requestId: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  userId: number | null;
  userType: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  requestHeaders: Record<string, unknown>;
  requestQuery: Record<string, unknown>;
  requestBody: unknown;
  responseBody: unknown;
  createdAt: string;
}

export interface ApiLogPage {
  data: ApiLog[];
  page: number;
  limit: number;
  total: number;
}

export interface ApiLogFilters {
  page: number;
  limit: number;
  statusCode?: number;
  method?: string;
  userId?: number;
  search?: string;
}

@Injectable({ providedIn: "root" })
export class ApiLogsService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  list(filters: ApiLogFilters): Observable<ApiLogPage> {
    let params = new HttpParams()
      .set("page", filters.page)
      .set("limit", filters.limit);
    if (filters.statusCode) params = params.set("statusCode", filters.statusCode);
    if (filters.method) params = params.set("method", filters.method);
    if (filters.userId) params = params.set("userId", filters.userId);
    if (filters.search) params = params.set("search", filters.search);

    return this.http
      .get<ApiLogPage>(`${this.apiUrl}/admin/api-logs`, { params })
      .pipe(timeout({ first: 15000 }));
  }

  getById(id: string): Observable<ApiLog> {
    return this.http
      .get<ApiLog>(`${this.apiUrl}/admin/api-logs/${encodeURIComponent(id)}`)
      .pipe(timeout({ first: 15000 }));
  }
}
