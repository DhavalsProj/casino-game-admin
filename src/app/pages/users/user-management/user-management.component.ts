import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UserService, ManagedUser, ManagedUserType } from '../../../shared/services/user.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './user-management.component.html',
})
export class UserManagementComponent implements OnInit {
  users: ManagedUser[] = [];
  selectedUser: ManagedUser | null = null;
  filter: 'all' | ManagedUserType = 'all';
  search = '';
  isLoading = true;
  errorMessage = '';
  successMessage = '';

  constructor(public userService: UserService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  get isAdmin(): boolean {
    return this.userService.canManage;
  }

  get filteredUsers(): ManagedUser[] {
    const query = this.search.trim().toLowerCase();
    return this.users.filter((user) => !query || [user.name, user.mobile, user.type, user.uniqueId, user.agentName ?? '']
      .some((value) => value.toLowerCase().includes(query)));
  }

  loadUsers(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.userService.getUsers(this.filter).subscribe({
      next: (users) => {
        this.users = users;
        this.isLoading = false;
      },
      error: (error: Error) => {
        this.errorMessage = error.message;
        this.isLoading = false;
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
}
