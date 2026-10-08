import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { finalize, TimeoutError } from 'rxjs';
import { AuthService } from '../../../shared/services/auth.service';
import { UserService, ManagedUser, ManagedUserType } from '../../../shared/services/user.service';
import { UserFeedbackService } from '../../../shared/services/user-feedback.service';

@Component({
  selector: 'app-user-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './user-create.component.html',
})
export class UserCreateComponent implements OnInit {
  agents: ManagedUser[] = [];
  isLoading = false;
  isLoadingUser = false;
  userLoadFailed = false;
  isProfileEdit = false;
  isLoadingAgents = false;
  editUserId: number | null = null;
  editingUser: ManagedUser | null = null;
  errorMessage = '';
  readonly userForm: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private readonly authService: AuthService,
    public userService: UserService,
    private readonly userFeedbackService: UserFeedbackService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.userForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
      mobile: ['', [Validators.required, Validators.pattern(/^[0-9]{10,15}$/)]],
      type: ['user' as ManagedUserType, Validators.required],
      agentId: ['', Validators.required],
    });
  }

  get isAdmin(): boolean {
    return this.userService.canManage;
  }

  get isAgent(): boolean {
    return this.userService.role === 'agent';
  }

  ngOnInit(): void {
    this.isProfileEdit = this.route.snapshot.routeConfig?.path === 'profile/edit';
    if (this.isProfileEdit) {
      const currentUser = this.authService.currentUser;
      if (!currentUser) {
        void this.router.navigate(['/signin']);
        return;
      }
      this.editUserId = currentUser.id;
      this.userForm.get('agentId')?.clearValidators();
      this.userForm.get('agentId')?.updateValueAndValidity({ emitEvent: false });
      this.isLoadingUser = true;
      this.userService.getUserById(currentUser.id).subscribe({
        next: (user) => {
          this.editingUser = user;
          this.patchUserForm(user);
          this.isLoadingUser = false;
        },
        error: (error: unknown) => {
          this.errorMessage = error instanceof TimeoutError
            ? 'Loading your profile took longer than 15 seconds. Check the user service and try again.'
            : error instanceof Error
              ? error.message
              : 'Unable to load your profile.';
          this.isLoadingUser = false;
          this.userLoadFailed = true;
        },
      });
      return;
    }

    if (!this.userService.canCreate) {
      this.router.navigate(['/users']);
      return;
    }
    const routeId = this.route.snapshot.paramMap.get('id');
    if (routeId !== null) {
      const id = Number(routeId);
      if (!Number.isSafeInteger(id) || id <= 0 || !this.userService.canEditUsers) {
        this.router.navigate(['/users']);
        return;
      }
      this.editUserId = id;
      this.userForm.get('type')?.disable({ emitEvent: false });
      if (this.isAdmin) {
        this.userForm.get('agentId')?.clearValidators();
        this.userForm.get('agentId')?.enable({ emitEvent: false });
        this.isLoadingAgents = true;
        this.userService.getAgents().subscribe({
          next: (agents) => {
            this.agents = agents;
            this.isLoadingAgents = false;
          },
          error: () => {
            this.errorMessage = 'Unable to load the agent list. Please refresh and try again.';
            this.isLoadingAgents = false;
          },
        });
      } else {
        this.userForm.get('agentId')?.disable({ emitEvent: false });
      }
      const navigationState = this.router.getCurrentNavigation()?.extras.state ?? window.history.state;
      const previewUser = navigationState['previewUser'] as ManagedUser | undefined;
      if (previewUser?.id === id) {
        this.editingUser = previewUser;
        this.patchUserForm(previewUser);
      }
      this.isLoadingUser = true;
      this.userService.getUserById(id).subscribe({
        next: (user) => {
          this.editingUser = user;
          this.patchUserForm(user);
          this.isLoadingUser = false;
        },
        error: (error: unknown) => {
          this.errorMessage = error instanceof TimeoutError
            ? 'Loading this user took longer than 15 seconds. Check the user service and try again.'
            : error instanceof Error
              ? error.message
              : 'Unable to load this user.';
          this.isLoadingUser = false;
          this.userLoadFailed = true;
        },
      });
      return;
    }
    if (this.isAgent) {
      this.userForm.patchValue({ type: 'user' });
      this.userForm.get('type')?.disable();
      this.userForm.get('agentId')?.disable();
      return;
    }
    this.userService.getAgents().subscribe((agents) => this.agents = agents);
    this.updateAgentRequirement();
  }

  onTypeChange(): void {
    this.updateAgentRequirement();
  }

  submit(): void {
    if (this.isLoadingUser || this.isLoadingAgents || this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    this.errorMessage = '';
    const rawValue = this.userForm.getRawValue();
    if (this.editUserId !== null) {
      this.userService.updateUser(this.editUserId, {
        name: rawValue.name ?? '',
        mobile: rawValue.mobile ?? '',
        ...(this.isAdmin && this.editingUser?.type === 'user'
          ? { agentId: rawValue.agentId || null }
          : {}),
      }).pipe(finalize(() => this.isLoading = false)).subscribe({
        next: (updatedUser) => {
          if (this.isProfileEdit) {
            this.authService.updateCurrentUserProfile(updatedUser);
            void this.router.navigate(['/profile']);
            return;
          }
          void this.router.navigate(['/users'], { state: { successMessage: 'User updated successfully.' } });
        },
        error: (error: Error) => this.errorMessage = error.message || 'Unable to update this user.',
      });
      return;
    }
    this.userService.createUser({
      name: rawValue.name ?? '',
      mobile: rawValue.mobile ?? '',
      type: rawValue.type as ManagedUserType,
      ...(rawValue.type === 'user' && rawValue.agentId
        ? { agentId: rawValue.agentId }
        : {}),
    }).pipe(
      finalize(() => this.isLoading = false),
    ).subscribe({
      next: (result) => {
        this.userFeedbackService.setCreationFeedback({ user: result.user, password: result.password });
        void this.router.navigate(['/users']);
      },
      error: (error: Error) => {
        this.errorMessage = error.name === 'TimeoutError'
          ? 'The server took too long to respond. Please try again.'
          : error.message;
      },
    });
  }

  private updateAgentRequirement(): void {
    const agentControl = this.userForm.get('agentId');
    if (this.userForm.getRawValue().type === 'user') {
      agentControl?.setValidators(Validators.required);
    } else {
      agentControl?.clearValidators();
      agentControl?.setValue('');
    }
    agentControl?.updateValueAndValidity();
  }

  private patchUserForm(user: ManagedUser): void {
    this.userForm.patchValue({
      name: user.name,
      mobile: user.mobile,
      type: user.type,
      agentId: user.agentId ?? '',
    });
  }
}
