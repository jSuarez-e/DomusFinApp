import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./presentation/pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () => import('./presentation/pages/register/register.page').then((m) => m.RegisterPage),
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./presentation/pages/forgot-password/forgot-password.page').then((m) => m.ForgotPasswordPage),
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./presentation/pages/reset-password/reset-password.page').then((m) => m.ResetPasswordPage),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./presentation/pages/layout/layout.page').then((m) => m.LayoutPage),
    children: [
      {
        path: 'inicio',
        loadComponent: () => import('./presentation/pages/home/home.page').then((m) => m.HomePage),
      },
      {
        path: 'accounts',
        loadComponent: () => import('./presentation/pages/accounts/accounts.page').then((m) => m.AccountsPage),
      },
      {
        path: 'credit-cards',
        loadComponent: () => import('./presentation/pages/credit-cards/credit-cards.page').then((m) => m.CreditCardsPage),
      },
      {
        path: 'savings',
        loadComponent: () => import('./presentation/pages/savings/savings.page').then((m) => m.SavingsPage),
      },
      {
        path: 'loans',
        loadComponent: () => import('./presentation/pages/loans/loans.page').then((m) => m.LoansPage),
      },
      {
        path: 'expenses',
        loadComponent: () => import('./presentation/pages/expenses/expenses.page').then((m) => m.ExpensesPage),
      },
      {
        path: 'reports',
        loadComponent: () => import('./presentation/pages/reports/reports.page').then((m) => m.ReportsPage),
      },
      {
        path: 'settings',
        loadComponent: () => import('./presentation/pages/settings/settings.page').then((m) => m.SettingsPage),
      },
      {
        path: 'capture-settings',
        loadComponent: () => import('./presentation/pages/capture-settings/capture-settings.page').then((m) => m.CaptureSettingsPage),
      },
      {
        path: 'archive',
        loadComponent: () => import('./presentation/pages/archive/archive.page').then((m) => m.ArchivePage),
      },
      {
        path: '',
        redirectTo: 'inicio',
        pathMatch: 'full',
      }
    ]
  },
  {
    path: 'expenses',
    redirectTo: 'dashboard/expenses',
    pathMatch: 'full',
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    loadComponent: () => import('./presentation/pages/admin/admin.page').then((m) => m.AdminPage),
  },
];
