import { CommonModule } from "@angular/common";
import { HttpErrorResponse } from "@angular/common/http";
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { forkJoin, of, Subscription, TimeoutError } from "rxjs";
import { AuthService } from "../../../shared/services/auth.service";
import {
  ManagedUser,
  UserService,
} from "../../../shared/services/user.service";
import {
  WalletService,
  TransactionHistoryEntry,
} from "../../../shared/services/wallet.service";

type TransactionTargetType = "user" | "agent";

@Component({
  selector: "app-transaction-history",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./transaction-history.component.html",
})
export class TransactionHistoryComponent implements OnInit, OnDestroy {
  users: ManagedUser[] = [];
  agents: ManagedUser[] = [];
  transactions: TransactionHistoryEntry[] = [];
  totalTransactions = 0;
  readonly pageSize = 10;
  currentPage = 1;
  targetType: TransactionTargetType = "user";
  selectedAgentId = "";
  selectedTargetId = "";
  transactionType: "all" | "CREDIT" | "DEBIT" = "all";
  search = "";
  isLoadingTargets = false;
  isLoadingTransactions = false;
  errorMessage = "";
  private readonly subscriptions = new Subscription();
  private transactionRequest?: Subscription;

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
      this.errorMessage = "Your session has expired. Please sign in again.";
      return;
    }

    if (this.authService.role === "user") {
      this.loadTransactions(currentUser.id);
      return;
    }

    this.loadTargets();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.transactionRequest?.unsubscribe();
  }

  get isAdmin(): boolean {
    return this.userService.canManage;
  }

  get isUser(): boolean {
    return this.authService.role === "user";
  }

  get isManagementPage(): boolean {
    return this.router.url.split("?")[0] === "/transactions/manage";
  }

  get isGridPage(): boolean {
    return this.router.url.split("?")[0] === "/transactions/grid";
  }

  get filteredTransactions(): TransactionHistoryEntry[] {
    return this.transactions;
  }

  get pagedTransactions(): TransactionHistoryEntry[] {
    return this.filteredTransactions;
  }

  get pageCount(): number {
    return Math.max(1, Math.ceil(this.totalTransactions / this.pageSize));
  }

  get pageStart(): number {
    return this.totalTransactions === 0
      ? 0
      : (this.currentPage - 1) * this.pageSize + 1;
  }

  get pageEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalTransactions);
  }

  onFiltersChange(): void {
    this.currentPage = 1;
    this.refreshTransactions();
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage -= 1;
      this.refreshTransactions();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.pageCount) {
      this.currentPage += 1;
      this.refreshTransactions();
    }
  }

  get availableUsers(): ManagedUser[] {
    if (this.isAdmin && this.selectedAgentId) {
      return this.users.filter(
        (user) => user.agentId === Number(this.selectedAgentId),
      );
    }
    return this.users;
  }

  get availableTargets(): ManagedUser[] {
    return this.targetType === "agent" ? this.agents : this.availableUsers;
  }

  get selectedTarget(): ManagedUser | null {
    const targetId = Number(this.selectedTargetId);
    return (
      this.availableTargets.find((target) => target.id === targetId) ?? null
    );
  }

  get targetName(): string {
    return this.isUser
      ? (this.authService.currentUser?.name ?? "Your account")
      : (this.selectedTarget?.name ?? "");
  }

  onTargetTypeChange(): void {
    this.currentPage = 1;
    this.selectedAgentId = "";
    this.selectedTargetId = "";
    this.transactions = [];
    this.totalTransactions = 0;
    this.errorMessage = "";
  }

  onAgentChange(): void {
    this.currentPage = 1;
    this.selectedTargetId = "";
    this.transactions = [];
    this.totalTransactions = 0;
    this.errorMessage = "";
  }

  onTargetChange(): void {
    this.currentPage = 1;
    this.transactions = [];
    this.totalTransactions = 0;
    this.errorMessage = "";
    if (this.selectedTarget) {
      this.loadTransactions(this.selectedTarget.id);
    }
  }

  refreshTransactions(): void {
    const userId = this.isUser
      ? this.authService.currentUser?.id
      : this.selectedTarget?.id;
    if (userId) {
      this.loadTransactions(userId, this.currentPage);
    }
  }

  formatSource(source: string): string {
    return source
      .toLowerCase()
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  private loadTargets(): void {
    this.isLoadingTargets = true;
    const agents$ = this.isAdmin
      ? this.userService.getAgents()
      : of([] as ManagedUser[]);
    this.subscriptions.add(
      forkJoin({
        users: this.userService.getUsers("user"),
        agents: agents$,
      }).subscribe({
        next: ({ users, agents }) => {
          this.users =
            this.isGridPage && this.authService.role === "agent"
              ? users.filter(
                  (user) => user.agentId === this.authService.currentUser?.id,
                )
              : users;
          this.agents = agents;
          this.isLoadingTargets = false;
          this.changeDetector.detectChanges();
        },
        error: (error: unknown) => {
          this.errorMessage = this.getErrorMessage(
            error,
            "Unable to load accounts.",
          );
          this.isLoadingTargets = false;
          this.changeDetector.detectChanges();
        },
      }),
    );
  }

  private loadTransactions(userId: number, page = this.currentPage): void {
    this.isLoadingTransactions = true;
    this.errorMessage = "";
    this.transactionRequest?.unsubscribe();
    const searchEnabled = this.isManagementPage || this.isGridPage;
    this.transactionRequest = this.walletService
      .getTransactionHistoryForAccount(userId, {
        page,
        limit: this.pageSize,
        ...(searchEnabled && this.search.trim()
          ? { search: this.search.trim() }
          : {}),
        ...(searchEnabled && this.transactionType !== "all"
          ? { type: this.transactionType }
          : {}),
      })
      .subscribe({
        next: (transactions) => {
          this.transactions = transactions.data;
          this.totalTransactions = transactions.total;
          this.isLoadingTransactions = false;
          this.changeDetector.detectChanges();
        },
        error: (error: unknown) => {
          this.errorMessage = this.getErrorMessage(
            error,
            "Unable to load transaction history.",
          );
          this.isLoadingTransactions = false;
          this.changeDetector.detectChanges();
        },
      });
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof TimeoutError) {
      return "The wallet service took too long to respond. Please try again.";
    }
    if (error instanceof HttpErrorResponse && error.status === 0) {
      return "Unable to connect to the wallet service. Check that the backend is running.";
    }
    if (
      error instanceof HttpErrorResponse &&
      typeof error.error?.message === "string"
    ) {
      return error.error.message;
    }
    return fallback;
  }
}
