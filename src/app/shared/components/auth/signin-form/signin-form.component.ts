
import { Component } from '@angular/core';
import { LabelComponent } from '../../form/label/label.component';
import { CheckboxComponent } from '../../form/input/checkbox.component';
import { ButtonComponent } from '../../ui/button/button.component';
import { InputFieldComponent } from '../../form/input/input-field.component';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signin-form',
  imports: [
    LabelComponent,
    CheckboxComponent,
    ButtonComponent,
    InputFieldComponent,
    RouterModule,
    FormsModule
],
  templateUrl: './signin-form.component.html',
  styles: ``
})
export class SigninFormComponent {

  showPassword = false;
  isChecked = false;

  identifier = '';
  password = '';
  errorMessage = '';
  isSubmitting = false;

  constructor(private authService: AuthService, private router: Router) {}

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onSignIn() {
    if (!this.identifier.trim() || !this.password) {
      this.errorMessage = 'Enter your identifier and password.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.authService.login(this.identifier, this.password).subscribe({
      next: () => {
        this.isSubmitting = false;
        void this.router.navigate(['/']);
      },
      error: (error: unknown) => {
        this.isSubmitting = false;
        this.errorMessage = error instanceof Error ? error.message : 'Unable to sign in. Please try again.';
      },
    });
  }
}
