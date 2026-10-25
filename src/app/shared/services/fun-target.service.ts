import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, forkJoin, map, of, switchMap, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';

export type GameStatus = 'ACTIVE' | 'INACTIVE';
export type ResultMode = 'MANUAL' | 'RANDOM';
export type RoundStatus = 'UPCOMING' | 'OPEN' | 'CLOSED' | 'COMPLETED';
export type JokerScheduleStatus = 'SCHEDULED' | 'ACTIVE' | 'COMPLETED';
export interface FunTargetConfiguration {
  id?: number; gameName: string; minimumBetPerNumber: number; maximumBetPerNumber: number;
  availableBetOptions: number[]; resultMinimum: number; resultMaximum: number; resultMode: ResultMode;
  jokerEnabled: boolean; jokerMultiplier: number; jokerFrequency: number;
  adminSharePercentage: number; winningAllocationPercentage: number; status: GameStatus;
}
export interface GameRound {
  id: string; roundNumber: number; status: RoundStatus; totalBetAmount: number; winningNumber: number | null;
  jokerStatus: JokerScheduleStatus | 'DISABLED'; scheduledAt: string; openedAt: string | null;
  closedAt: string | null; createdAt: string; resultMode: ResultMode;
}
export interface NumberBetSummary { number: number; totalBets: number; totalAmount: number; estimatedPayout: number | null; }
export interface RoundSummary {
  roundId: string; totalBetAmount: number; winningNumber: number | null; winningAllocationPercentage: number;
  adminReportingShare: number; winningAllocationReporting: number; jokerMultiplier: number; jokerActive: boolean;
  estimatedWinningPayout: number | null; payoutNote: string; numbers: NumberBetSummary[];
}
export interface JokerSchedule { id: string; roundId: string; roundNumber: number; multiplier: number; status: JokerScheduleStatus; scheduledAt: string; }
export interface UserGameWallet {
  userId: number; userName: string; uniqueId: string; mainBalance: number | null;
  temporaryWinningBalance: number | null; blockedFromBetting: boolean | null;
  pendingRequests: { id: number; type: string; amount: number; status: string; createdAt: string }[];
  transactions: { id: number; type: string; source: string; amount: number; createdAt: string; description: string | null }[];
}
interface ApiConfiguration {
  id: number; gameName: string; minBet: string | number; maxBet: string | number; denominations: number[];
  resultMode: ResultMode; jokerEnabled: boolean; jokerMultiplier: number; jokerFrequency: number;
  adminSharePercent: string | number; winningAllocationPercent: string | number; active: boolean;
}
interface ApiRound {
  id: number; status: RoundStatus; scheduledAt: string; openedAt: string | null; closedAt: string | null;
  resultMode: ResultMode; jokerEnabled: boolean; jokerMultiplier: number; winningNumber: number | null; createdAt: string;
}
interface ApiRoundPage { data: ApiRound[]; total: number; page: number; limit: number; }
interface ApiRoundSummary {
  perNumber: { number: number; total: string | number; bets: number }[]; total: string | number;
  adminReportingShare: string | number; winningAllocationReporting: string | number; payout: number | null;
  payoutNote: string; joker: { enabled: boolean; multiplier: number };
}
interface ApiJokerSchedule { id: number; roundId: number; multiplier: number; active: boolean; createdAt: string; }

@Injectable({ providedIn: 'root' })
export class FunTargetService {
  private readonly apiUrl = environment.apiUrl;
  private readonly gameUrl = `${this.apiUrl}/admin/games/fun-target`;
  constructor(private readonly http: HttpClient) {}

  getConfiguration(): Observable<FunTargetConfiguration> {
    return this.request(this.http.get<ApiConfiguration>(`${this.gameUrl}/config`)).pipe(map((config) => this.toConfiguration(config)));
  }
  saveConfiguration(config: FunTargetConfiguration): Observable<FunTargetConfiguration> {
    return this.request(this.http.patch<ApiConfiguration>(`${this.gameUrl}/config`, {
      gameName: config.gameName, minBet: config.minimumBetPerNumber, maxBet: config.maximumBetPerNumber,
      denominations: config.availableBetOptions, resultMode: config.resultMode, jokerEnabled: config.jokerEnabled,
      jokerMultiplier: config.jokerMultiplier, jokerFrequency: config.jokerFrequency,
      adminSharePercent: config.adminSharePercentage, winningAllocationPercent: config.winningAllocationPercentage,
      active: config.status === 'ACTIVE',
    })).pipe(map((saved) => this.toConfiguration(saved)));
  }
  getRounds(): Observable<GameRound[]> {
    return this.request(this.http.get<ApiRoundPage>(`${this.gameUrl}/rounds`)).pipe(
      switchMap(({ data }) => data.length
        ? forkJoin(data.map((round) => this.getRoundSummary(String(round.id)).pipe(map((summary) => this.toRound(round, summary.totalBetAmount)))))
        : of([] as GameRound[])),
    );
  }
  createRound(scheduledAt: string): Observable<GameRound> {
    return this.request(this.http.post<ApiRound>(`${this.gameUrl}/rounds`, { scheduledAt })).pipe(map((round) => this.toRound(round, 0)));
  }
  updateRound(roundId: string, action: 'open' | 'close' | 'publish', body?: { winningNumber?: number }): Observable<GameRound> {
    const id = encodeURIComponent(roundId);
    if (action === 'publish') {
      return this.request(this.http.post<ApiRound>(`${this.gameUrl}/rounds/${id}/result`, body ?? null)).pipe(
        switchMap(() => this.request(this.http.post<ApiRound>(`${this.gameUrl}/rounds/${id}/finalize`, {}))),
        map((round) => this.toRound(round, 0)),
      );
    }
    return this.request(this.http.post<ApiRound>(`${this.gameUrl}/rounds/${id}/${action}`, {})).pipe(map((round) => this.toRound(round, 0)));
  }
  getRoundSummary(roundId: string): Observable<RoundSummary> {
    return this.request(this.http.get<ApiRoundSummary>(`${this.gameUrl}/rounds/${encodeURIComponent(roundId)}/bets/summary`))
      .pipe(map((summary) => this.toSummary(roundId, summary)));
  }
  getJokerSchedules(): Observable<JokerSchedule[]> {
    return this.request(this.http.get<ApiJokerSchedule[]>(`${this.gameUrl}/joker/schedules`)).pipe(map((schedules) => schedules.map((schedule) => ({
      id: String(schedule.id), roundId: String(schedule.roundId), roundNumber: schedule.roundId,
      multiplier: schedule.multiplier, status: schedule.active ? 'SCHEDULED' : 'COMPLETED', scheduledAt: schedule.createdAt,
    }))));
  }
  scheduleJoker(roundId: number, multiplier: number): Observable<JokerSchedule> {
    return this.request(this.http.post<ApiJokerSchedule>(`${this.gameUrl}/joker/schedules`, { roundId, multiplier })).pipe(map((schedule) => ({
      id: String(schedule.id), roundId: String(schedule.roundId), roundNumber: schedule.roundId,
      multiplier: schedule.multiplier, status: 'SCHEDULED', scheduledAt: schedule.createdAt,
    })));
  }
  cancelJokerSchedule(id: string): Observable<void> {
    return this.request(this.http.post<void>(`${this.gameUrl}/joker/schedules/${encodeURIComponent(id)}/cancel`, {}));
  }
  getUserWallet(userId: number): Observable<UserGameWallet> {
    const user$ = this.http.post<{ id: number; name: string; uniqueId: string }>(`${this.apiUrl}/users/get-by-id`, { id: userId });
    const wallet$ = this.http.get<{ balance: string | number } | null>(`${this.apiUrl}/wallet/${userId}`);
    const transactions$ = this.http.get<{ id: number; type: string; source: string; amount: string | number; createdAt: string; description: string | null }[]>(`${this.apiUrl}/wallet/${userId}/transactions`);
    const requests$ = this.http.get<{ id: number; type: string; amount: string | number; status: string; createdAt: string }[]>(`${this.apiUrl}/wallet/requests/${userId}`);
    return this.request(forkJoin({ user: user$, wallet: wallet$, transactions: transactions$, requests: requests$ })).pipe(map(({ user, wallet, transactions, requests }) => ({
      userId: user.id, userName: user.name, uniqueId: user.uniqueId,
      mainBalance: wallet ? Number(wallet.balance) : null, temporaryWinningBalance: null, blockedFromBetting: null,
      pendingRequests: requests.filter((request) => request.status === 'PENDING').map((request) => ({ ...request, amount: Number(request.amount) })),
      transactions: transactions.map((transaction) => ({ ...transaction, amount: Number(transaction.amount) })),
    })));
  }
  private toConfiguration(config: ApiConfiguration): FunTargetConfiguration {
    return {
      id: config.id, gameName: config.gameName, minimumBetPerNumber: Number(config.minBet), maximumBetPerNumber: Number(config.maxBet),
      availableBetOptions: config.denominations, resultMinimum: 1, resultMaximum: 9, resultMode: config.resultMode,
      jokerEnabled: config.jokerEnabled, jokerMultiplier: config.jokerMultiplier, jokerFrequency: config.jokerFrequency,
      adminSharePercentage: Number(config.adminSharePercent), winningAllocationPercentage: Number(config.winningAllocationPercent),
      status: config.active ? 'ACTIVE' : 'INACTIVE',
    };
  }
  private toRound(round: ApiRound, totalBetAmount: number): GameRound {
    return {
      id: String(round.id), roundNumber: round.id, status: round.status, totalBetAmount,
      winningNumber: round.winningNumber, jokerStatus: round.jokerEnabled ? 'ACTIVE' : 'DISABLED',
      scheduledAt: round.scheduledAt, openedAt: round.openedAt, closedAt: round.closedAt,
      createdAt: round.createdAt, resultMode: round.resultMode,
    };
  }
  private toSummary(roundId: string, summary: ApiRoundSummary): RoundSummary {
    return {
      roundId, totalBetAmount: Number(summary.total), winningNumber: null, winningAllocationPercentage: 0,
      adminReportingShare: Number(summary.adminReportingShare), winningAllocationReporting: Number(summary.winningAllocationReporting),
      jokerMultiplier: summary.joker.multiplier, jokerActive: summary.joker.enabled,
      estimatedWinningPayout: summary.payout, payoutNote: summary.payoutNote,
      numbers: summary.perNumber.map((item) => ({ number: item.number, totalBets: item.bets, totalAmount: Number(item.total), estimatedPayout: null })),
    };
  }
  private request<T>(request: Observable<T>): Observable<T> { return request.pipe(timeout({ first: 15000 })); }
}
