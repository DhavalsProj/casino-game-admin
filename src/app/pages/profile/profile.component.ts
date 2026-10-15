import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { AuthService } from '../../shared/services/auth.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, PageBreadcrumbComponent, ReactiveFormsModule, RouterModule],
  templateUrl: './profile.component.html',
})
export class ProfileComponent {
  readonly passwordForm: FormGroup;
  isSavingPassword = false;
  passwordMessage = '';
  passwordError = '';

  constructor(public readonly authService: AuthService, formBuilder: FormBuilder) {
    this.passwordForm = formBuilder.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.pattern(/^(?=.*[A-Z])(?=.*[a-z])(?=(?:.*\d){4})[A-Za-z\d]{6}$/)]],
      confirmPassword: ['', Validators.required],
    });
  }

  changePassword(): void {
    this.passwordMessage = '';
    this.passwordError = '';
    if (this.passwordForm.invalid || this.isSavingPassword) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    const { currentPassword, newPassword, confirmPassword } = this.passwordForm.getRawValue();
    if (newPassword !== confirmPassword) {
      this.passwordError = 'The new passwords do not match.';
      return;
    }
    this.isSavingPassword = true;
    this.authService.changePassword(currentPassword ?? '', newPassword ?? '').subscribe({
      next: (response) => {
        this.passwordMessage = response.message;
        this.passwordForm.reset();
        this.isSavingPassword = false;
      },
      error: (error: unknown) => {
        const apiMessage = error instanceof HttpErrorResponse ? error.error?.message : undefined;
        this.passwordError = Array.isArray(apiMessage)
          ? apiMessage.join(' ')
          : typeof apiMessage === 'string'
            ? apiMessage
            : error instanceof Error ? error.message : 'Unable to update the password.';
        this.isSavingPassword = false;
      },
    });
  }
}
