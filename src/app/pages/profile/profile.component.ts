import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, PageBreadcrumbComponent],
  templateUrl: './profile.component.html',
})
export class ProfileComponent {
  constructor(public readonly authService: AuthService) {}
}
