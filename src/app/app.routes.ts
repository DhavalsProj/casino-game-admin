import { Routes } from '@angular/router';
import { EcommerceComponent } from './pages/dashboard/ecommerce/ecommerce.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { FormElementsComponent } from './pages/forms/form-elements/form-elements.component';
import { BasicTablesComponent } from './pages/tables/basic-tables/basic-tables.component';
import { BlankComponent } from './pages/blank/blank.component';
import { NotFoundComponent } from './pages/other-page/not-found/not-found.component';
import { AppLayoutComponent } from './shared/layout/app-layout/app-layout.component';
import { InvoicesComponent } from './pages/invoices/invoices.component';
import { LineChartComponent } from './pages/charts/line-chart/line-chart.component';
import { BarChartComponent } from './pages/charts/bar-chart/bar-chart.component';
import { AlertsComponent } from './pages/ui-elements/alerts/alerts.component';
import { AvatarElementComponent } from './pages/ui-elements/avatar-element/avatar-element.component';
import { BadgesComponent } from './pages/ui-elements/badges/badges.component';
import { ButtonsComponent } from './pages/ui-elements/buttons/buttons.component';
import { ImagesComponent } from './pages/ui-elements/images/images.component';
import { VideosComponent } from './pages/ui-elements/videos/videos.component';
import { SignInComponent } from './pages/auth-pages/sign-in/sign-in.component';
import { SignUpComponent } from './pages/auth-pages/sign-up/sign-up.component';
import { CalenderComponent } from './pages/calender/calender.component';
import { UserManagementComponent } from './pages/users/user-management/user-management.component';
import { UserCreateComponent } from './pages/users/user-create/user-create.component';
import { WalletManagementComponent } from './pages/wallet/wallet-management/wallet-management.component';
import { WalletTransferListComponent } from './pages/wallet/wallet-transfer-list/wallet-transfer-list.component';
import { TransactionHistoryComponent } from './pages/transactions/transaction-history/transaction-history.component';
import { authGuard } from './shared/guards/auth.guard';

export const routes: Routes = [
  {
    path:'',
    component:AppLayoutComponent,
    canActivate: [authGuard],
    children:[
      {
        path: '',
        component: EcommerceComponent,
        pathMatch: 'full',
        title: 'CasinoAdmin',
      },
      {
        path:'calendar',
        component:CalenderComponent,
        title: 'CasinoAdmin'
      },
      {
        path:'profile',
        component:ProfileComponent,
        title: 'CasinoAdmin'
      },
      {
        path: 'profile/edit',
        component: UserCreateComponent,
        canActivate: [authGuard],
        title: 'CasinoAdmin'
      },
      {
        path:'users',
        component:UserManagementComponent,
        canActivate: [authGuard],
        data: { roles: ['superadmin', 'admin', 'agent'] },
        title: 'CasinoAdmin'
      },
      {
        path:'user-profile',
        component:UserManagementComponent,
        canActivate: [authGuard],
        data: { roles: ['superadmin', 'admin', 'agent'] },
        title: 'CasinoAdmin'
      },
      {
        path:'wallet-transfer/manage',
        component:WalletTransferListComponent,
        canActivate: [authGuard],
        data: { roles: ['superadmin', 'admin', 'agent'] },
        title: 'CasinoAdmin'
      },
      {
        path:'users/create',
        component:UserCreateComponent,
        canActivate: [authGuard],
        data: { roles: ['superadmin', 'admin', 'agent'] },
        title: 'CasinoAdmin'
      },
      {
        path:'user-profile/create',
        component:UserCreateComponent,
        canActivate: [authGuard],
        data: { roles: ['superadmin', 'admin', 'agent'] },
        title: 'CasinoAdmin'
      },
      {
        path:'users/edit/:id',
        component:UserCreateComponent,
        canActivate: [authGuard],
        data: { roles: ['superadmin', 'admin'] },
        title: 'CasinoAdmin'
      },
      {
        path:'user-profile/edit/:id',
        component:UserCreateComponent,
        canActivate: [authGuard],
        data: { roles: ['superadmin', 'admin'] },
        title: 'CasinoAdmin'
      },
      {
        path:'wallet-transfer/create',
        component:WalletManagementComponent,
        canActivate: [authGuard],
        data: { roles: ['superadmin', 'admin', 'agent'] },
        title: 'CasinoAdmin'
      },
      {
        path:'wallet-transfer',
        component:WalletTransferListComponent,
        canActivate: [authGuard],
        data: { roles: ['superadmin', 'admin', 'agent', 'user'] },
        title: 'CasinoAdmin'
      },
      {
        path: 'wallet',
        component: WalletManagementComponent,
        canActivate: [authGuard],
        data: { roles: ['superadmin', 'admin', 'agent', 'user'] },
        title: 'CasinoAdmin',
      },
      {
        path: 'transactions/manage',
        component: TransactionHistoryComponent,
        canActivate: [authGuard],
        data: { roles: ['superadmin', 'admin', 'agent', 'user'] },
        title: 'CasinoAdmin',
      },
      {
        path: 'transactions',
        component: TransactionHistoryComponent,
        canActivate: [authGuard],
        data: { roles: ['superadmin', 'admin', 'agent', 'user'] },
        title: 'CasinoAdmin',
      },
      {
        path:'form-elements',
        component:FormElementsComponent,
        title: 'CasinoAdmin'
      },
      {
        path:'basic-tables',
        component:BasicTablesComponent,
        title: 'CasinoAdmin'
      },
      {
        path:'blank',
        component:BlankComponent,
        title: 'CasinoAdmin'
      },
      // support tickets
      {
        path:'invoice',
        component:InvoicesComponent,
        title: 'CasinoAdmin'
      },
      {
        path:'line-chart',
        component:LineChartComponent,
        title: 'CasinoAdmin'
      },
      {
        path:'bar-chart',
        component:BarChartComponent,
        title: 'CasinoAdmin'
      },
      {
        path:'alerts',
        component:AlertsComponent,
        title: 'CasinoAdmin'
      },
      {
        path:'avatars',
        component:AvatarElementComponent,
        title: 'CasinoAdmin'
      },
      {
        path:'badge',
        component:BadgesComponent,
        title: 'CasinoAdmin'
      },
      {
        path:'buttons',
        component:ButtonsComponent,
        title: 'CasinoAdmin'
      },
      {
        path:'images',
        component:ImagesComponent,
        title: 'CasinoAdmin'
      },
      {
        path:'videos',
        component:VideosComponent,
        title: 'CasinoAdmin'
      },
    ]
  },
  // auth pages
  {
    path:'signin',
    component:SignInComponent,
    title: 'CasinoAdmin'
  },
  {
    path:'signup',
    component:SignUpComponent,
    title: 'CasinoAdmin'
  },
  // error pages
  {
    path:'**',
    component:NotFoundComponent,
    title: 'CasinoAdmin'
  },
];
