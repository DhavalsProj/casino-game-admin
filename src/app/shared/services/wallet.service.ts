import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';

export type WalletRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';
export type WalletRequestType = 'ADD_POINTS' | 'WITHDRAW';
export type WalletTransactionType = 'CREDIT' | 'DEBIT';

export interface WalletRequest {
  id: number;
  userId: number;
  walletId: number;
  type: WalletRequestType;
  amount: string;
  status: WalletRequestStatus;
  createdAt: string;
  updatedAt: string;
}

export interface WalletTransaction {
  id: number;
  walletId: number;
  userId: number;
  requestId: number | null;
  type: WalletTransactionType;
  source: string;
  amount: string;
  balanceBefore: string;
  balanceAfter: string;
  description: string | null;
  createdAt: string;
}

export interface TransactionHistoryEntry {
  id: number | string;
  walletId: number;
  userId: number;
  requestId: number | null;
  type: 'CREDIT' | 'DEBIT' | 'WITHDRAW' | 'ADD_POINTS';
  source: string;
  amount: string;
  balanceBefore: string | null;
  balanceAfter: string | null;
  description: string | null;
  createdAt: string;
  status?: WalletRequestStatus | 'COMPLETED';
  recordType?: 'WALLET_TRANSACTION' | 'WALLET_REQUEST';
  submittedAt?: string;
  user?: { id: number; name: string; uniqueId: string; type: 'user' | 'agent' };
}

@Injectable({ providedIn: 'root' })
export class WalletService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  createPointsRequest(
    userId: number,
    amount: string,
    type: WalletRequestType,
  ): Observable<WalletRequest> {
    return this.http.post<WalletRequest>(`${this.apiUrl}/wallet/request`, {
      userId,
      amount,
      type,
    }).pipe(timeout({ first: 15000 }));
  }

  updateRequest(
    requestId: number,
    changes: { amount?: string; type?: WalletRequestType },
  ): Observable<WalletRequest> {
    return this.http.patch<WalletRequest>(
      `${this.apiUrl}/wallet/requests/${requestId}`,
      changes,
    ).pipe(timeout({ first: 15000 }));
  }

  deleteRequest(requestId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.apiUrl}/wallet/requests/${requestId}`,
    ).pipe(timeout({ first: 15000 }));
  }

  getRequestsForUser(userId: number): Observable<WalletRequest[]> {
    return this.http.get<WalletRequest[]>(`${this.apiUrl}/wallet/requests/${userId}`)
      .pipe(timeout({ first: 15000 }));
  }

  getRequest(requestId: number): Observable<WalletRequest> {
    return this.http.get<WalletRequest>(
      `${this.apiUrl}/wallet/requests/detail/${requestId}`,
    ).pipe(timeout({ first: 15000 }));
  }

  approveRequest(requestId: number): Observable<WalletRequest> {
    return this.http.patch<WalletRequest>(
      `${this.apiUrl}/wallet/requests/${requestId}/accept`,
      {},
    ).pipe(timeout({ first: 15000 }));
  }

  declineRequest(requestId: number): Observable<WalletRequest> {
    return this.http.patch<WalletRequest>(
      `${this.apiUrl}/wallet/requests/${requestId}/reject`,
      {},
    ).pipe(timeout({ first: 15000 }));
  }

  getTransactionHistoryForAccount(accountId: number): Observable<TransactionHistoryEntry[]> {
    return this.http.get<TransactionHistoryEntry[]>(
      `${this.apiUrl}/transactions/${accountId}`,
    ).pipe(timeout({ first: 15000 }));
  }

  getTransactionsForUser(userId: number): Observable<WalletTransaction[]> {
    return this.http.get<WalletTransaction[]>(
      `${this.apiUrl}/wallet/${userId}/transactions`,
    ).pipe(timeout({ first: 15000 }));
  }
}
