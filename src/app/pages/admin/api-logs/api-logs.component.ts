import { CommonModule } from "@angular/common";
import { HttpErrorResponse } from "@angular/common/http";
import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TimeoutError } from "rxjs";
import { ApiLog, ApiLogsService } from "../../../shared/services/api-logs.service";

@Component({
  selector: "app-api-logs",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./api-logs.component.html",
})
export class ApiLogsComponent implements OnInit {
  logs: ApiLog[] = [];
  total = 0;
  page = 1;
  readonly pageSize = 25;
  statusCode = "";
  method = "";
  userId = "";
  search = "";
  selectedLog: ApiLog | null = null;
  isLoading = false;
  errorMessage = "";

  constructor(
    private readonly apiLogsService: ApiLogsService,
    private readonly changeDetector: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadLogs();
  }

  get pageCount(): number {
    return Math.max(1, Math.ceil(this.total / this.pageSize));
  }

  get pageEnd(): number {
    return Math.min(this.page * this.pageSize, this.total);
  }

  applyFilters(): void {
    this.page = 1;
    this.loadLogs();
  }

  refresh(): void {
    this.loadLogs();
  }

  previousPage(): void {
    if (this.page > 1) {
      this.page -= 1;
      this.loadLogs();
    }
  }

  nextPage(): void {
    if (this.page < this.pageCount) {
      this.page += 1;
      this.loadLogs();
    }
  }

  openLog(log: ApiLog): void {
    this.selectedLog = log;
  }

  closeLog(): void {
    this.selectedLog = null;
  }

  formatJson(value: unknown): string {
    if (value === null || value === undefined) return "—";
    return typeof value === "string" ? value : JSON.stringify(value, null, 2);
  }

  statusClass(status: number): string {
    if (status >= 500) return "bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400";
    if (status >= 400) return "bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400";
    return "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400";
  }

  private loadLogs(): void {
    this.isLoading = true;
    this.errorMessage = "";
    const parsedStatus = this.statusCode ? Number(this.statusCode) : undefined;
    const parsedUser = this.userId ? Number(this.userId) : undefined;
    if (
      (parsedStatus !== undefined && (!Number.isInteger(parsedStatus) || parsedStatus < 100 || parsedStatus > 599)) ||
      (parsedUser !== undefined && (!Number.isSafeInteger(parsedUser) || parsedUser < 1))
    ) {
      this.errorMessage = "Enter a valid HTTP status code and positive user ID.";
      this.isLoading = false;
      return;
    }

    this.apiLogsService.list({
      page: this.page,
      limit: this.pageSize,
      ...(parsedStatus ? { statusCode: parsedStatus } : {}),
      ...(this.method ? { method: this.method } : {}),
      ...(parsedUser ? { userId: parsedUser } : {}),
      ...(this.search.trim() ? { search: this.search.trim() } : {}),
    }).subscribe({
      next: (result) => {
        this.logs = result.data;
        this.total = result.total;
        this.isLoading = false;
        this.changeDetector.detectChanges();
      },
      error: (error: unknown) => {
        this.errorMessage = this.getErrorMessage(error);
        this.logs = [];
        this.total = 0;
        this.isLoading = false;
        this.changeDetector.detectChanges();
      },
    });
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof TimeoutError) return "Loading API logs timed out. Please try again.";
    if (error instanceof HttpErrorResponse && error.status === 0) {
      return "Unable to connect to the backend. Check that it is running.";
    }
    if (error instanceof HttpErrorResponse && typeof error.error?.message === "string") {
      return error.error.message;
    }
    return "Unable to load API logs.";
  }
}
