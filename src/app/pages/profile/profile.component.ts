import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { AuthService } from '../../shared/services/auth.service';
import { RouterModule } from '@angular/router';
import { UserFeedbackService } from '../../shared/services/user-feedback.service';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, PageBreadcrumbComponent, RouterModule],
  templateUrl: './profile.component.html',
})
export class ProfileComponent {
  readonly profileUpdated: boolean;

  constructor(
    public readonly authService: AuthService,
    userFeedbackService: UserFeedbackService,
  ) {
    this.profileUpdated = userFeedbackService.consumeProfileUpdateFeedback();
  }
}
