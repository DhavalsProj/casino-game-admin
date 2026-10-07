import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, of, Subscription, TimeoutError } from 'rxjs';
import { AuthService } from '../../../shared/services/auth.service';
import { ManagedUser, UserService } from '../../../shared/services/user.service';
import { WalletService, WalletTransaction } from '../../../shared/services/wallet.service';

type TransactionTargetType = 'user' | 'agent';

@Component({
  selector: 'app-transaction-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transaction-history.component.html',
})
export class TransactionHistoryComponent implements OnInit, OnDestroy {
  users: ManagedUser[] = [];
  agents: ManagedUser[] = [];
  transactions: WalletTransaction[] = [];
  targetType: TransactionTargetType = 'user';
  selectedAgentId = '';
  selectedTargetId = '';
  transactionType: 'all' | 'CREDIT' | 'DEBIT' = 'all';
  search = '';
  isLoadingTargets = false;
  isLoadingTransactions = false;
  errorMessage = '';
  private readonly subscriptions = new Subscription();

  constructor(
    public authService: AuthService,
    public userService: UserService,
    private readonly walletService: WalletService,
    private readonly changeDetector: ChangeDetectorRef,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.currentUser;
    if (!currentUser) {
      this.errorMessage = 'Your session has expired. Please sign in again.';
      return;
    }

    if (this.authService.role === 'user') {
      this.loadTransactions(currentUser.id);
      return;
    }

    this.loadTargets();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get isAdmin(): boolean {
    return this.userService.canManage;
  }

  get isUser(): boolean {
    return this.authService.role === 'user';
  }

  get isManagementPage(): boolean {
    return this.router.url.split('?')[0] === '/transactions/manage';
  }

  get filteredTransactions(): WalletTransaction[] {
    if (!this.isManagementPage) {
      return this.transactions;
    }
    const query = this.search.trim().toLowerCase();
    return this.transactions.filter((transaction) => {
      const matchesType = this.transactionType === 'all' || transaction.type === this.transactionType;
      const matchesSearch = !query || [
        String(transaction.id),
        String(transaction.userId),
        this.targetName,
        transaction.type,
        transaction.source,
        transaction.amount,
        transaction.balanceBefore,
        transaction.balanceAfter,
        transaction.description ?? '',
        String(transaction.requestId ?? ''),
      ].some((value) => value.toLowerCase().includes(query));
      return matchesType && matchesSearch;
    });
  }

  get availableUsers(): ManagedUser[] {
    if (this.isAdmin && this.selectedAgentId) {
      return this.users.filter((user) => user.agentId === this.selectedAgentId);
    }
    return this.users;
  }

  get availableTargets(): ManagedUser[] {
    return this.targetType === 'agent' ? this.agents : this.availableUsers;
  }

  get selectedTarget(): ManagedUser | null {
    const targetId = Number(this.selectedTargetId);
    return this.availableTargets.find((target) => target.id === targetId) ?? null;
  }

  get targetName(): string {
    return this.isUser
      ? this.authService.currentUser?.name ?? 'Your account'
      : this.selectedTarget?.name ?? '';
  }

  onTargetTypeChange(): void {
    this.selectedAgentId = '';
    this.selectedTargetId = '';
    this.transactions = [];
    this.errorMessage = '';
  }

  onAgentChange(): void {
    this.selectedTargetId = '';
    this.transactions = [];
    this.errorMessage = '';
  }

  onTargetChange(): void {
    this.transactions = [];
    this.errorMessage = '';
    if (this.selectedTarget) {
      this.loadTransactions(this.selectedTarget.id);
    }
  }

  refreshTransactions(): void {
    const userId = this.isUser
      ? this.authService.currentUser?.id
      : this.selectedTarget?.id;
    if (userId) {
      this.loadTransactions(userId);
    }
  }

  formatSource(source: string): string {
    return source.toLowerCase().split('_').map((part) =>
      part.charAt(0).toUpperCase() + part.slice(1),
    ).join(' ');
  }

  private loadTargets(): void {
    this.isLoadingTargets = true;
    const agents$ = this.isAdmin ? this.userService.getAgents() : of([] as ManagedUser[]);
    this.subscriptions.add(forkJoin({
      users: this.userService.getUsers('user'),
      agents: agents$,
    }).subscribe({
      next: ({ users, agents }) => {
        this.users = users;
        this.agents = agents;
        this.isLoadingTargets = false;
        this.changeDetector.detectChanges();
      },
      error: (error: unknown) => {
        this.errorMessage = this.getErrorMessage(error, 'Unable to load accounts.');
        this.isLoadingTargets = false;
        this.changeDetector.detectChanges();
      },
    }));
  }

  private loadTransactions(userId: number): void {
    this.isLoadingTransactions = true;
    this.errorMessage = '';
    this.subscriptions.add(this.walletService.getTransactionsForUser(userId).subscribe({
      next: (transactions) => {
        this.transactions = transactions;
        this.isLoadingTransactions = false;
        this.changeDetector.detectChanges();
      },
      error: (error: unknown) => {
        this.errorMessage = this.getErrorMessage(error, 'Unable to load transaction history.');
        this.isLoadingTransactions = false;
        this.changeDetector.detectChanges();
      },
    }));
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof TimeoutError) {
      return 'The wallet service took too long to respond. Please try again.';
    }
    if (error instanceof HttpErrorResponse && error.status === 0) {
      return 'Unable to connect to the wallet service. Check that the backend is running.';
    }
    if (error instanceof HttpErrorResponse && typeof error.error?.message === 'string') {
      return error.error.message;
    }
    return fallback;
  }
}
