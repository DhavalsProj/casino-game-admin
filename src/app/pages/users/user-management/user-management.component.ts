import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subscription, TimeoutError } from 'rxjs';
import { AuthService } from '../../../shared/services/auth.service';
import { UserService, ManagedUser, ManagedUserType } from '../../../shared/services/user.service';
import { UserFeedbackService } from '../../../shared/services/user-feedback.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './user-management.component.html',
})
export class UserManagementComponent implements OnInit, OnDestroy {
  users: ManagedUser[] = [];
  filteredUsers: ManagedUser[] = [];
  filter: 'all' | ManagedUserType = 'all';
  search = '';
  readonly pageSize = 10;
  currentPage = 1;
  isLoading = true;
  errorMessage = '';
  successMessage = '';
  createdCredentials: { user: ManagedUser; password: string } | null = null;
  selectedUser: ManagedUser | null = null;
  userToDelete: ManagedUser | null = null;
  deletingUserId: number | null = null;
  private usersRequest: Subscription | null = null;

  constructor(
    public userService: UserService,
    private readonly authService: AuthService,
    private readonly userFeedbackService: UserFeedbackService,
    private readonly changeDetector: ChangeDetectorRef,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    const navigationState = this.router.getCurrentNavigation()?.extras.state ?? window.history.state;
    this.successMessage = navigationState['successMessage'] ?? '';
    const creationFeedback = this.userFeedbackService.consumeCreationFeedback();
    const createdUser = creationFeedback?.user ?? navigationState['createdUser'] as ManagedUser | undefined;
    if (creationFeedback) {
      this.successMessage = 'User created successfully.';
      this.createdCredentials = creationFeedback;
    }
    if (createdUser) {
      this.users = [createdUser];
      this.updateFilteredUsers();
      this.isLoading = false;
    }
    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.usersRequest?.unsubscribe();
  }

  get isAdmin(): boolean {
    return this.userService.canManage;
  }

  get isManagementPage(): boolean {
    const path = this.router.url.split('?')[0];
    return path === '/users' || path === '/user-profile';
  }

  get isReadOnlyGrid(): boolean {
    return this.router.url.split('?')[0] === '/users/grid';
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
    this.isLoading = this.users.length === 0;
    this.errorMessage = '';
    const userType = this.userService.role === 'agent' ? 'user' : this.filter;
    this.usersRequest = this.userService.getUsers(userType).subscribe({
      next: (users) => {
        this.users = this.isReadOnlyGrid && this.authService.role === 'agent'
          ? users.filter((user) => user.agentId === this.authService.currentUser?.id)
          : users;
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

  closeCreatedCredentials(): void {
    this.createdCredentials = null;
  }

  viewUser(user: ManagedUser): void {
    this.selectedUser = user;
  }

  editUser(user: ManagedUser): void {
    void this.router.navigate(['/users/edit', user.id], { state: { previewUser: user } });
  }

  deleteUser(user: ManagedUser): void {
    if (!this.userService.canDeleteUsers || this.deletingUserId !== null) return;
    this.errorMessage = '';
    this.userToDelete = user;
  }

  cancelDeleteUser(): void {
    if (this.deletingUserId !== null) return;
    this.userToDelete = null;
    this.errorMessage = '';
  }

  confirmDeleteUser(): void {
    const user = this.userToDelete;
    if (!user || !this.userService.canDeleteUsers || this.deletingUserId !== null) return;
    this.errorMessage = '';
    this.successMessage = '';
    this.deletingUserId = user.id;
    this.userService.deleteUser(user.id).subscribe({
      next: () => {
        this.userToDelete = null;
        this.deletingUserId = null;
        this.successMessage = `${user.name} was deleted successfully.`;
        this.loadUsers();
      },
      error: (error: unknown) => {
        this.errorMessage = error instanceof HttpErrorResponse && typeof error.error?.message === 'string'
          ? error.error.message
          : 'Unable to delete this user. Please try again.';
        this.deletingUserId = null;
        this.changeDetector.detectChanges();
      },
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
