import { Routes } from "@angular/router";
import { AppLayoutComponent } from "./shared/layout/app-layout/app-layout.component";
import { authGuard } from "./shared/guards/auth.guard";

export const routes: Routes = [
  {
    path: "",
    component: AppLayoutComponent,
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    data: { roles: ["superadmin", "admin", "agent", "user"] },
    children: [
      {
        path: "",
        loadComponent: () =>
          import("./pages/dashboard/ecommerce/ecommerce.component").then(
            (m) => m.EcommerceComponent,
          ),
        pathMatch: "full",
        data: { roles: ["superadmin", "admin", "agent", "user"] },
        title: "Dashboard | CasinoAdmin",
      },
      {
        path: "calendar",
        loadComponent: () =>
          import("./pages/calender/calender.component").then(
            (m) => m.CalenderComponent,
          ),
        data: { roles: ["superadmin", "admin", "agent"] },
        title: "CasinoAdmin",
      },
      {
        path: "profile",
        loadComponent: () =>
          import("./pages/profile/profile.component").then(
            (m) => m.ProfileComponent,
          ),
        data: { roles: ["superadmin", "admin", "agent", "user"] },
        title: "CasinoAdmin",
      },
      {
        path: "profile/edit",
        loadComponent: () =>
          import("./pages/users/user-create/user-create.component").then(
            (m) => m.UserCreateComponent,
          ),
        canActivate: [authGuard],
        data: { roles: ["superadmin", "admin", "agent", "user"], profileEdit: true },
        title: "CasinoAdmin",
      },
      {
        path: "users",
        loadComponent: () =>
          import("./pages/users/user-management/user-management.component").then(
            (m) => m.UserManagementComponent,
          ),
        canActivate: [authGuard],
        data: { roles: ["superadmin", "admin", "agent"] },
        title: "CasinoAdmin",
      },
      {
        path: "users/grid",
        loadComponent: () =>
          import("./pages/users/user-management/user-management.component").then(
            (m) => m.UserManagementComponent,
          ),
        canActivate: [authGuard],
        data: { roles: ["superadmin", "admin", "agent"] },
        title: "CasinoAdmin",
      },
      {
        path: "user-profile",
        loadComponent: () =>
          import("./pages/users/user-management/user-management.component").then(
            (m) => m.UserManagementComponent,
          ),
        canActivate: [authGuard],
        data: { roles: ["superadmin", "admin", "agent"] },
        title: "CasinoAdmin",
      },
      {
        path: "wallet-transfer/manage",
        loadComponent: () =>
          import("./pages/wallet/wallet-transfer-list/wallet-transfer-list.component").then(
            (m) => m.WalletTransferListComponent,
          ),
        canActivate: [authGuard],
        data: { roles: ["superadmin", "admin", "agent"] },
        title: "CasinoAdmin",
      },
      {
        path: "wallet-transfer/grid",
        loadComponent: () =>
          import("./pages/wallet/wallet-transfer-list/wallet-transfer-list.component").then(
            (m) => m.WalletTransferListComponent,
          ),
        canActivate: [authGuard],
        data: { roles: ["superadmin", "admin", "agent"] },
        title: "CasinoAdmin",
      },
      {
        path: "users/create",
        loadComponent: () =>
          import("./pages/users/user-create/user-create.component").then(
            (m) => m.UserCreateComponent,
          ),
        canActivate: [authGuard],
        data: { roles: ["superadmin", "admin", "agent"] },
        title: "CasinoAdmin",
      },
      {
        path: "user-profile/create",
        loadComponent: () =>
          import("./pages/users/user-create/user-create.component").then(
            (m) => m.UserCreateComponent,
          ),
        canActivate: [authGuard],
        data: { roles: ["superadmin", "admin", "agent"] },
        title: "CasinoAdmin",
      },
      {
        path: "users/edit/:id",
        loadComponent: () =>
          import("./pages/users/user-create/user-create.component").then(
            (m) => m.UserCreateComponent,
          ),
        canActivate: [authGuard],
        data: { roles: ["superadmin", "admin", "agent"] },
        title: "CasinoAdmin",
      },
      {
        path: "user-profile/edit/:id",
        loadComponent: () =>
          import("./pages/users/user-create/user-create.component").then(
            (m) => m.UserCreateComponent,
          ),
        canActivate: [authGuard],
        data: { roles: ["superadmin", "admin", "agent"] },
        title: "CasinoAdmin",
      },
      {
        path: "wallet-transfer/create",
        loadComponent: () =>
          import("./pages/wallet/wallet-management/wallet-management.component").then(
            (m) => m.WalletManagementComponent,
          ),
        canActivate: [authGuard],
        data: { roles: ["superadmin", "admin", "agent"] },
        title: "CasinoAdmin",
      },
      {
        path: "wallet-transfer/edit/:id",
        loadComponent: () =>
          import("./pages/wallet/wallet-management/wallet-management.component").then(
            (m) => m.WalletManagementComponent,
          ),
        canActivate: [authGuard],
        data: { roles: ["superadmin", "admin", "agent", "user"] },
        title: "CasinoAdmin",
      },
      {
        path: "wallet-transfer",
        loadComponent: () =>
          import("./pages/wallet/wallet-transfer-list/wallet-transfer-list.component").then(
            (m) => m.WalletTransferListComponent,
          ),
        canActivate: [authGuard],
        data: { roles: ["superadmin", "admin", "agent", "user"] },
        title: "CasinoAdmin",
      },
      {
        path: "wallet",
        loadComponent: () =>
          import("./pages/wallet/wallet-management/wallet-management.component").then(
            (m) => m.WalletManagementComponent,
          ),
        canActivate: [authGuard],
        data: { roles: ["superadmin", "admin", "agent", "user"] },
        title: "CasinoAdmin",
      },
      {
        path: "transactions/manage",
        loadComponent: () =>
          import("./pages/transactions/transaction-history/transaction-history.component").then(
            (m) => m.TransactionHistoryComponent,
          ),
        canActivate: [authGuard],
        data: { roles: ["superadmin", "admin", "agent"] },
        title: "CasinoAdmin",
      },
      {
        path: "transactions/grid",
        loadComponent: () =>
          import("./pages/transactions/transaction-history/transaction-history.component").then(
            (m) => m.TransactionHistoryComponent,
          ),
        canActivate: [authGuard],
        data: { roles: ["superadmin", "admin", "agent"] },
        title: "CasinoAdmin",
      },
      {
        path: "transactions",
        loadComponent: () =>
          import("./pages/transactions/transaction-history/transaction-history.component").then(
            (m) => m.TransactionHistoryComponent,
          ),
        canActivate: [authGuard],
        data: { roles: ["superadmin", "admin", "agent", "user"] },
        title: "CasinoAdmin",
      },
      {
        path: "games/fun-target",
        loadComponent: () =>
          import("./pages/games/fun-target/fun-target.component").then(
            (m) => m.FunTargetComponent,
          ),
        canActivate: [authGuard],
        data: { roles: ["superadmin"] },
        title: "Fun Target Game",
      },
      {
        path: "admin/api-logs",
        loadComponent: () =>
          import("./pages/admin/api-logs/api-logs.component").then(
            (m) => m.ApiLogsComponent,
          ),
        canActivate: [authGuard],
        data: { roles: ["superadmin", "admin"] },
        title: "API Logs | CasinoAdmin",
      },
      {
        path: "basic-tables",
        loadComponent: () =>
          import("./pages/tables/basic-tables/basic-tables.component").then(
            (m) => m.BasicTablesComponent,
          ),
        data: { roles: ["superadmin", "admin"] },
        title: "CasinoAdmin",
      },
      // support tickets
      {
        path: "invoice",
        loadComponent: () =>
          import("./pages/invoices/invoices.component").then(
            (m) => m.InvoicesComponent,
          ),
        data: { roles: ["superadmin", "admin"] },
        title: "CasinoAdmin",
      },
      {
        path: "line-chart",
        loadComponent: () =>
          import("./pages/charts/line-chart/line-chart.component").then(
            (m) => m.LineChartComponent,
          ),
        data: { roles: ["superadmin", "admin"] },
        title: "CasinoAdmin",
      },
      {
        path: "bar-chart",
        loadComponent: () =>
          import("./pages/charts/bar-chart/bar-chart.component").then(
            (m) => m.BarChartComponent,
          ),
        data: { roles: ["superadmin", "admin"] },
        title: "CasinoAdmin",
      },
      {
        path: "alerts",
        loadComponent: () =>
          import("./pages/ui-elements/alerts/alerts.component").then(
            (m) => m.AlertsComponent,
          ),
        data: { roles: ["superadmin", "admin"] },
        title: "CasinoAdmin",
      },
      {
        path: "avatars",
        loadComponent: () =>
          import("./pages/ui-elements/avatar-element/avatar-element.component").then(
            (m) => m.AvatarElementComponent,
          ),
        data: { roles: ["superadmin", "admin"] },
        title: "CasinoAdmin",
      },
      {
        path: "badge",
        loadComponent: () =>
          import("./pages/ui-elements/badges/badges.component").then(
            (m) => m.BadgesComponent,
          ),
        data: { roles: ["superadmin", "admin"] },
        title: "CasinoAdmin",
      },
      {
        path: "buttons",
        loadComponent: () =>
          import("./pages/ui-elements/buttons/buttons.component").then(
            (m) => m.ButtonsComponent,
          ),
        data: { roles: ["superadmin", "admin"] },
        title: "CasinoAdmin",
      },
      {
        path: "images",
        loadComponent: () =>
          import("./pages/ui-elements/images/images.component").then(
            (m) => m.ImagesComponent,
          ),
        data: { roles: ["superadmin", "admin"] },
        title: "CasinoAdmin",
      },
      {
        path: "videos",
        loadComponent: () =>
          import("./pages/ui-elements/videos/videos.component").then(
            (m) => m.VideosComponent,
          ),
        data: { roles: ["superadmin", "admin"] },
        title: "CasinoAdmin",
      },
    ],
  },
  // auth pages
  {
    path: "signin",
    loadComponent: () =>
      import("./pages/auth-pages/sign-in/sign-in.component").then(
        (m) => m.SignInComponent,
      ),
    title: "CasinoAdmin",
  },
  {
    path: "signup",
    loadComponent: () =>
      import("./pages/auth-pages/sign-up/sign-up.component").then(
        (m) => m.SignUpComponent,
      ),
    title: "CasinoAdmin",
  },
  // error pages
  {
    path: "**",
    loadComponent: () =>
      import("./pages/other-page/not-found/not-found.component").then(
        (m) => m.NotFoundComponent,
      ),
    title: "CasinoAdmin",
  },
];
