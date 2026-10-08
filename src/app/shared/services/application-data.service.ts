import { Injectable } from '@angular/core';
import { forkJoin, map, Observable, of, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { ManagedUser, UserService } from './user.service';
import { WalletRequest, WalletService, WalletTransaction } from './wallet.service';

export interface ApplicationAccount {
  id: number;
  name: string;
  uniqueId: string;
  type: 'user' | 'agent';
  agentName?: string | null;
  createdAt?: string;
}

export interface ApplicationDataSnapshot {
  users: ManagedUser[];
  agents: ManagedUser[];
  accounts: ApplicationAccount[];
  requests: WalletRequest[];
  transactions: WalletTransaction[];
}

@Injectable({ providedIn: 'root' })
export class ApplicationDataService {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly walletService: WalletService,
  ) {}

  loadSnapshot(): Observable<ApplicationDataSnapshot> {
    const currentUser = this.authService.currentUser;
    if (!currentUser) {
      return throwError(() => new Error('Your session has expired. Please sign in again.'));
    }

    const isAdministrator = currentUser.role === 'superadmin' || currentUser.role === 'admin';
    const usersAndAgents$ = isAdministrator
      ? forkJoin({ users: this.userService.getUsers('user'), agents: this.userService.getAgents() })
      : currentUser.role === 'agent'
        ? this.userService.getUsers('user').pipe(map((users) => ({
            // The authenticated API must scope this list to the current agent.
            users,
            agents: [] as ManagedUser[],
          })))
        : of({ users: [] as ManagedUser[], agents: [] as ManagedUser[] });

    return usersAndAgents$.pipe(
      map(({ users, agents }) => {
        const accounts: ApplicationAccount[] = [
          ...users.map((user) => this.toAccount(user)),
          ...agents.map((agent) => this.toAccount(agent)),
        ];
        if (currentUser.role === 'agent' || currentUser.role === 'user') {
          accounts.push({
            id: currentUser.id,
            name: currentUser.name,
            uniqueId: currentUser.uniqueId,
            type: currentUser.role,
          });
        }

        return { users, agents, accounts: [...new Map(accounts.map((account) => [account.id, account])).values()] };
      }),
      switchMap(({ users, agents, accounts }) => {
        const requests$ = accounts.length
          ? forkJoin(accounts.map((account) => this.walletService.getRequestsForUser(account.id)))
          : of([] as WalletRequest[][]);
        const transactions$ = accounts.length
          ? forkJoin(accounts.map((account) => this.walletService.getTransactionsForUser(account.id)))
          : of([] as WalletTransaction[][]);

        return forkJoin({ requests: requests$, transactions: transactions$ }).pipe(
          map(({ requests, transactions }) => ({
            users,
            agents,
            accounts,
            requests: requests.flat(),
            transactions: transactions.flat(),
          })),
        );
      }),
    );
  }

  private toAccount(user: ManagedUser): ApplicationAccount {
    return {
      id: user.id,
      name: user.name,
      uniqueId: user.uniqueId,
      type: user.type,
      agentName: user.agentName,
      createdAt: user.createdAt,
    };
  }
}
