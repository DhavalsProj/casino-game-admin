import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription, TimeoutError } from 'rxjs';
import { UserService, ManagedUser, ManagedUserType } from '../../../shared/services/user.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './user-management.component.html',
})
export class UserManagementComponent implements OnInit, OnDestroy {
  users: ManagedUser[] = [];
  filteredUsers: ManagedUser[] = [];
  selectedUser: ManagedUser | null = null;
  filter: 'all' | ManagedUserType = 'all';
  search = '';
  readonly pageSize = 25;
  currentPage = 1;
  isLoading = true;
  errorMessage = '';
  successMessage = '';
  private usersRequest: Subscription | null = null;

  constructor(
    public userService: UserService,
    private readonly changeDetector: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.usersRequest?.unsubscribe();
  }

  get isAdmin(): boolean {
    return this.userService.canManage;
  }

  get pageCount(): number {
    return Math.ceil(this.filteredUsers.length / this.pageSize);
  }

  get pagedUsers(): ManagedUser[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredUsers.slice(start, start + this.pageSize);
  }

  get pageStart(): number {
    return this.filteredUsers.length === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  get pageEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredUsers.length);
  }

  onSearchChange(): void {
    this.currentPage = 1;
    this.updateFilteredUsers();
  }

  previousPage(): void {
    this.currentPage = Math.max(1, this.currentPage - 1);
  }

  nextPage(): void {
    this.currentPage = Math.min(this.pageCount, this.currentPage + 1);
  }

  loadUsers(): void {
    this.usersRequest?.unsubscribe();
    this.isLoading = true;
    this.errorMessage = '';
    this.usersRequest = this.userService.getUsers(this.filter).subscribe({
      next: (users) => {
        this.users = users;
        this.currentPage = 1;
        this.updateFilteredUsers();
        this.isLoading = false;
        this.usersRequest = null;
        this.changeDetector.detectChanges();
      },
      error: (error: unknown) => {
        this.errorMessage = this.getLoadErrorMessage(error);
        this.isLoading = false;
        this.usersRequest = null;
        this.changeDetector.detectChanges();
      },
    });
  }

  viewUser(user: ManagedUser): void {
    this.selectedUser = { ...user };
  }

  closeDetails(): void {
    this.selectedUser = null;
  }

  editUser(user: ManagedUser): void {
    const name = window.prompt('Name', user.name);
    const mobile = window.prompt('Mobile number', user.mobile);
    if (!name || !mobile) {
      return;
    }
    this.userService.updateUser(user.id, { name, mobile, status: user.status }).subscribe({
      next: () => {
        this.successMessage = 'User updated successfully.';
        this.loadUsers();
      },
      error: (error: Error) => this.errorMessage = error.message,
    });
  }

  deleteUser(user: ManagedUser): void {
    if (!window.confirm(`Delete ${user.name}? This action cannot be undone.`)) {
      return;
    }
    this.userService.deleteUser(user.id).subscribe({
      next: () => {
        this.successMessage = 'User deleted successfully.';
        this.loadUsers();
      },
      error: (error: Error) => this.errorMessage = error.message,
    });
  }

  private getLoadErrorMessage(error: unknown): string {
    if (error instanceof TimeoutError) {
      return 'Loading users took longer than 15 seconds. Check the user service and try again.';
    }

    if (error instanceof HttpErrorResponse && error.status === 0) {
      return 'Unable to connect to the user service. Check that it is running and try again.';
    }

    if (error instanceof HttpErrorResponse && typeof error.error?.message === 'string') {
      return error.error.message;
    }

    return 'Unable to load users. Please try again.';
  }

  private updateFilteredUsers(): void {
    const query = this.search.trim().toLowerCase();
    this.filteredUsers = this.users.filter((user) => !query || [
      user.name,
      user.mobile,
      user.type,
      user.uniqueId,
      user.agentName ?? '',
    ].some((value) => value.toLowerCase().includes(query)));
  }
}
