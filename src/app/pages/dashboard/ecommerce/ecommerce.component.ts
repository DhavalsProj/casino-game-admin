import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ApplicationDataService, ApplicationDataSnapshot } from '../../../shared/services/application-data.service';
import { AuthService } from '../../../shared/services/auth.service';

interface DashboardMetric {
  label: string;
  value: number;
}

@Component({
  selector: 'app-ecommerce',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './ecommerce.component.html',
})
export class EcommerceComponent implements OnInit {
  snapshot: ApplicationDataSnapshot | null = null;
  isLoading = true;
  errorMessage = '';

  constructor(
    public readonly authService: AuthService,
    private readonly applicationData: ApplicationDataService,
    private readonly changeDetector: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.applicationData.loadSnapshot().subscribe({
      next: (snapshot) => {
        this.snapshot = snapshot;
        this.isLoading = false;
        this.changeDetector.detectChanges();
      },
      error: (error: unknown) => {
        this.errorMessage = error instanceof Error ? error.message : 'Unable to load dashboard data.';
        this.isLoading = false;
        this.changeDetector.detectChanges();
      },
    });
  }

  get metrics(): DashboardMetric[] {
    if (!this.snapshot) {
      return [];
    }

    const { users, agents, requests, transactions } = this.snapshot;
    const currentRole = this.authService.role;
    const metrics: DashboardMetric[] = [];

    if (currentRole === 'superadmin' || currentRole === 'admin') {
      metrics.push(
        { label: 'Users', value: users.length },
        { label: 'Agents', value: agents.length },
      );
    } else if (currentRole === 'agent') {
      metrics.push({ label: 'Accessible users', value: users.length });
    }

    metrics.push(
      { label: 'Wallet transfers', value: requests.length },
      { label: 'Pending transfers', value: requests.filter((request) => request.status === 'PENDING').length },
      { label: 'Completed transfers', value: requests.filter((request) => request.status === 'ACCEPTED').length },
      { label: 'Transactions', value: transactions.length },
    );
    return metrics;
  }

  get hasApplicationRecords(): boolean {
    return this.metrics.some((metric) => metric.value > 0);
  }
}
