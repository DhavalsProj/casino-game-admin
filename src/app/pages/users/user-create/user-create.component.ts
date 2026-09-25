import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { UserService, ManagedUser, ManagedUserType } from '../../../shared/services/user.service';

@Component({
  selector: 'app-user-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './user-create.component.html',
})
export class UserCreateComponent implements OnInit {
  agents: ManagedUser[] = [];
  isLoading = false;
  errorMessage = '';
  createdCredentials: { name: string; uniqueId: string; password: string } | null = null;

  readonly userForm: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    public userService: UserService,
    private router: Router,
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
    if (!this.userService.canCreate) {
      this.router.navigate(['/users']);
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
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    this.errorMessage = '';
    const rawValue = this.userForm.getRawValue();
    this.userService.createUser({
      name: rawValue.name ?? '',
      mobile: rawValue.mobile ?? '',
      type: rawValue.type as ManagedUserType,
      agentId: rawValue.agentId ?? undefined,
    }).pipe(
      finalize(() => this.isLoading = false),
    ).subscribe({
      next: (result) => {
        this.createdCredentials = {
          name: result.user.name,
          uniqueId: result.user.uniqueId,
          password: result.password,
        };
      },
      error: (error: Error) => {
        this.errorMessage = error.name === 'TimeoutError'
          ? 'The server took too long to respond. Please try again.'
          : error.message;
      },
    });
  }

  closeSuccess(): void {
    this.createdCredentials = null;
    this.router.navigate(['/users']);
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
}
