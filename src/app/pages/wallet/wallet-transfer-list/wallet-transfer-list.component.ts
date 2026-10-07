import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { forkJoin, Subscription, TimeoutError } from 'rxjs';
import { AuthService } from '../../../shared/services/auth.service';
import { ManagedUser, UserService } from '../../../shared/services/user.service';
import { WalletRequest, WalletService } from '../../../shared/services/wallet.service';

interface WalletRequestRow extends WalletRequest {
  accountName: string;
  accountUniqueId: string;
}

@Component({
  selector: 'app-wallet-transfer-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './wallet-transfer-list.component.html',
})
export class WalletTransferListComponent implements OnInit, OnDestroy {
  requests: WalletRequestRow[] = [];
  isLoading = true;
  errorMessage = '';
  successMessage = '';
  search = '';
  currentPage = 1;
  readonly pageSize = 20;
  selectedRequest: WalletRequestRow | null = null;
  private readonly subscriptions = new Subscription();

  constructor(
    public readonly authService: AuthService,
    public readonly userService: UserService,
    private readonly walletService: WalletService,
    private readonly router: Router,
    private readonly changeDetector: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const state = this.router.getCurrentNavigation()?.extras.state ?? window.history.state;
    this.successMessage = state['successMessage'] ?? '';
    this.loadRequests();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get filteredRequests(): WalletRequestRow[] {
    const query = this.search.trim().toLowerCase();
    return this.requests.filter((request) => !query || [
      request.accountName,
      request.accountUniqueId,
      request.type,
      request.status,
      request.amount,
      request.id.toString(),
    ].some((value) => value.toLowerCase().includes(query)));
  }

  get pageCount(): number {
    return Math.max(1, Math.ceil(this.filteredRequests.length / this.pageSize));
  }

  get isManagementPage(): boolean {
    return this.router.url.split('?')[0] === '/wallet-transfer/manage';
  }

  viewRequest(request: WalletRequestRow): void {
    this.selectedRequest = request;
  }

  get pagedRequests(): WalletRequestRow[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredRequests.slice(start, start + this.pageSize);
  }

  onSearchChange(): void {
    this.currentPage = 1;
  }

  previousPage(): void {
    this.currentPage = Math.max(1, this.currentPage - 1);
  }

  nextPage(): void {
    this.currentPage = Math.min(this.pageCount, this.currentPage + 1);
  }

  loadRequests(): void {
    this.isLoading = this.requests.length === 0;
    this.errorMessage = '';
    const currentUser = this.authService.currentUser;
    if (!currentUser) {
      this.errorMessage = 'Your session has expired. Please sign in again.';
      this.isLoading = false;
      return;
    }

    if (this.authService.role === 'user') {
      this.subscriptions.add(this.walletService.getRequestsForUser(currentUser.id).subscribe({
        next: (requests) => this.setRequests(requests, [{
          id: currentUser.id,
          name: currentUser.name,
          uniqueId: currentUser.uniqueId,
        }]),
        error: (error: unknown) => this.failLoading(error),
      }));
      return;
    }

    const accounts$ = this.userService.getUsers('user');
    this.subscriptions.add(accounts$.subscribe({
      next: (users) => {
        const accounts: Pick<ManagedUser, 'id' | 'name' | 'uniqueId'>[] = [...users];
        if (this.authService.role === 'superadmin' || this.authService.role === 'admin') {
          this.subscriptions.add(this.userService.getAgents().subscribe({
            next: (agents) => this.loadAccountRequests([...accounts, ...agents]),
            error: (error: unknown) => this.failLoading(error),
          }));
          return;
        }
        if (this.authService.role === 'agent') {
          accounts.push({
            id: currentUser.id,
            name: currentUser.name,
            uniqueId: currentUser.uniqueId,
          });
        }
        this.loadAccountRequests(accounts);
      },
      error: (error: unknown) => this.failLoading(error),
    }));
  }

  private loadAccountRequests(accounts: Pick<ManagedUser, 'id' | 'name' | 'uniqueId'>[]): void {
    const uniqueAccounts = [...new Map(accounts.map((account) => [account.id, account])).values()];
    if (uniqueAccounts.length === 0) {
      this.setRequests([], []);
      return;
    }
    this.subscriptions.add(forkJoin(uniqueAccounts.map((account) => this.walletService.getRequestsForUser(account.id))).subscribe({
      next: (requestGroups) => {
        const requests = requestGroups.flat();
        this.requests = requests.map((request) => {
          const account = uniqueAccounts.find((item) => item.id === request.userId);
          return {
            ...request,
            accountName: account?.name ?? `Account ${request.userId}`,
            accountUniqueId: account?.uniqueId ?? '—',
          };
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        this.currentPage = 1;
        this.isLoading = false;
        this.changeDetector.detectChanges();
      },
      error: (error: unknown) => this.failLoading(error),
    }));
  }

  private setRequests(
    requests: WalletRequest[],
    accounts: Pick<ManagedUser, 'id' | 'name' | 'uniqueId'>[],
  ): void {
    const account = accounts[0];
    this.requests = requests.map((request) => ({
      ...request,
      accountName: account?.name ?? `Account ${request.userId}`,
      accountUniqueId: account?.uniqueId ?? '—',
    })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    this.isLoading = false;
    this.changeDetector.detectChanges();
  }

  private failLoading(error: unknown): void {
    this.errorMessage = this.getErrorMessage(error, 'Unable to load wallet transfer requests.');
    this.isLoading = false;
    this.changeDetector.detectChanges();
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
