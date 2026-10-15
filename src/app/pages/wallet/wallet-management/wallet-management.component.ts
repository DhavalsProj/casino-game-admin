import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { forkJoin, of, Subscription, TimeoutError } from 'rxjs';
import { AuthService } from '../../../shared/services/auth.service';
import { ManagedUser, UserService } from '../../../shared/services/user.service';
import { WalletRequest, WalletRequestType, WalletService } from '../../../shared/services/wallet.service';

type RequestAction = 'approve' | 'decline';

@Component({
  selector: 'app-wallet-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './wallet-management.component.html',
})
export class WalletManagementComponent implements OnInit, OnDestroy {
  users: ManagedUser[] = [];
  agents: ManagedUser[] = [];
  requests: WalletRequest[] = [];
  readonly pageSize = 10;
  currentPage = 1;
  readonly targetType = 'user';
  selectedAgentId = '';
  selectedTargetId = '';
  requestType: WalletRequestType = 'ADD_POINTS';
  amount = '';
  editingRequest: WalletRequest | null = null;
  isLoadingEditRequest = false;
  isLoadingTargets = false;
  isLoadingRequests = false;
  isSubmitting = false;
  processingRequestId: number | null = null;
  errorMessage = '';
  successMessage = '';
  private readonly subscriptions = new Subscription();

  constructor(
    public authService: AuthService,
    public userService: UserService,
    private readonly walletService: WalletService,
    private readonly changeDetector: ChangeDetectorRef,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.currentUser;
    if (!currentUser) {
      this.errorMessage = 'Your session has expired. Please sign in again.';
      return;
    }

    if (this.isEditPage) {
      this.loadEditRequest();
      return;
    }

    if (this.authService.role === 'user') {
      this.loadRequests(currentUser.id);
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

  get isCreatePage(): boolean {
    return this.router.url.startsWith('/wallet-transfer/create');
  }

  get isEditPage(): boolean {
    return this.router.url.startsWith('/wallet-transfer/edit/');
  }

  get isRequestFormPage(): boolean {
    return this.isCreatePage || this.isEditPage;
  }

  get returnPath(): string {
    return this.route.snapshot.queryParamMap.get('returnTo') === 'manage'
      ? '/wallet-transfer/manage'
      : '/wallet-transfer';
  }

  get availableUsers(): ManagedUser[] {
    if (this.isAdmin && this.selectedAgentId) {
      return this.users.filter((user) => user.agentId === Number(this.selectedAgentId));
    }
    return this.users;
  }

  get availableTargets(): ManagedUser[] {
    return this.availableUsers;
  }

  get selectedTarget(): ManagedUser | null {
    const targetId = Number(this.selectedTargetId);
    return this.availableTargets.find((target) => target.id === targetId) ?? null;
  }

  get pagedRequests(): WalletRequest[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.requests.slice(start, start + this.pageSize);
  }

  get pageCount(): number {
    return Math.max(1, Math.ceil(this.requests.length / this.pageSize));
  }

  get pageStart(): number {
    return this.requests.length === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  get pageEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.requests.length);
  }

  previousPage(): void {
    this.currentPage = Math.max(1, this.currentPage - 1);
  }

  nextPage(): void {
    this.currentPage = Math.min(this.pageCount, this.currentPage + 1);
  }

  onAgentChange(): void {
    this.currentPage = 1;
    this.selectedTargetId = '';
    this.requests = [];
  }

  onTargetChange(): void {
    this.currentPage = 1;
    if (this.selectedTarget) {
      this.loadRequests(this.selectedTarget.id);
    } else {
      this.requests = [];
    }
  }

  submitPointsRequest(): void {
    const recipient = this.selectedTarget;
    const amountValue = Number(this.amount);
    if ((!this.isEditPage && !recipient) || !/^\d+(?:\.\d{1,2})?$/.test(this.amount) || amountValue <= 0) {
      this.errorMessage = this.isEditPage
        ? 'Enter a point amount greater than zero, with at most two decimal places.'
        : 'Select an account and enter a point amount greater than zero, with at most two decimal places.';
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.isSubmitting = true;
    if (this.isEditPage) {
      const requestId = Number(this.route.snapshot.paramMap.get('id'));
      this.subscriptions.add(this.walletService.updateRequest(requestId, {
        amount: this.amount,
        type: this.requestType,
      }).subscribe({
        next: () => {
          void this.router.navigate([this.returnPath], {
            state: { successMessage: 'The wallet transfer request was updated successfully.' },
          });
          this.isSubmitting = false;
        },
        error: (error: unknown) => {
          this.errorMessage = this.getErrorMessage(error, 'Unable to update the wallet transfer request.');
          this.isSubmitting = false;
        },
      }));
      return;
    }

    if (!recipient) return;

    this.subscriptions.add(
      this.walletService.createPointsRequest(recipient.id, this.amount, this.requestType).subscribe({
        next: () => {
          const action = this.requestType === 'ADD_POINTS' ? 'add' : 'redeem';
          this.amount = '';
          if (this.isCreatePage) {
            void this.router.navigate([this.returnPath], {
              state: { successMessage: 'The wallet transfer request was submitted successfully.' },
            });
            this.isSubmitting = false;
            return;
          }
          this.successMessage = `The request to ${action} ${recipient.name}'s points was submitted and is pending approval.`;
          this.loadRequests(recipient.id);
          this.isSubmitting = false;
        },
        error: (error: unknown) => {
          this.errorMessage = this.getErrorMessage(error, 'Unable to submit the points request.');
          this.isSubmitting = false;
        },
      }),
    );
  }

  processRequest(request: WalletRequest, action: RequestAction): void {
    const verb = action === 'approve' ? 'approve' : 'decline';
    if (!window.confirm(`Are you sure you want to ${verb} ${request.amount} points?`)) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.processingRequestId = request.id;
    const operation = action === 'approve'
      ? this.walletService.approveRequest(request.id)
      : this.walletService.declineRequest(request.id);
    this.subscriptions.add(operation.subscribe({
      next: () => {
        this.successMessage = `The points request was ${action === 'approve' ? 'approved' : 'declined'}.`;
        this.processingRequestId = null;
        this.loadRequests(request.userId);
      },
      error: (error: unknown) => {
        this.errorMessage = this.getErrorMessage(error, `Unable to ${verb} this points request.`);
        this.processingRequestId = null;
      },
    }));
  }

  refreshRequests(): void {
    const userId = this.isUser
      ? this.authService.currentUser?.id
      : this.selectedTarget?.id;
    if (userId) {
      this.loadRequests(userId);
    }
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

  private loadEditRequest(): void {
    const requestId = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isSafeInteger(requestId) || requestId < 1) {
      this.errorMessage = 'Wallet request ID is invalid.';
      return;
    }

    this.isLoadingEditRequest = true;
    this.subscriptions.add(this.walletService.getRequest(requestId).subscribe({
      next: (request) => {
        this.editingRequest = request;
        this.isLoadingEditRequest = false;
        if (request.status !== 'PENDING') {
          this.errorMessage = 'Only pending wallet requests can be edited.';
          this.changeDetector.detectChanges();
          return;
        }
        this.requestType = request.type;
        this.amount = request.amount;
        this.changeDetector.detectChanges();
      },
      error: (error: unknown) => {
        this.errorMessage = this.getErrorMessage(error, 'Unable to load this wallet transfer request.');
        this.isLoadingEditRequest = false;
        this.changeDetector.detectChanges();
      },
    }));
  }

  private loadRequests(userId: number): void {
    this.isLoadingRequests = true;
    this.errorMessage = '';
    this.subscriptions.add(this.walletService.getRequestsForUser(userId).subscribe({
      next: (requests) => {
        this.requests = requests;
        this.currentPage = 1;
        this.isLoadingRequests = false;
        this.changeDetector.detectChanges();
      },
      error: (error: unknown) => {
        this.errorMessage = this.getErrorMessage(error, 'Unable to load wallet requests.');
        this.isLoadingRequests = false;
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
