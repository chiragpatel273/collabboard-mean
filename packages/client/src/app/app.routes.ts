import { Routes } from '@angular/router';
import { AdminGuard } from './guards/admin.guard';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./components/auth/login/login.component').then((c) => c.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./components/auth/register/register.component').then((c) => c.RegisterComponent),
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./components/dashboard/dashboard/dashboard.component').then(
        (c) => c.DashboardComponent
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'projects',
    loadComponent: () =>
      import('./components/projects/project-list/project-list.component').then(
        (c) => c.ProjectListComponent
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'projects/new',
    loadComponent: () =>
      import('./components/projects/create-project/create-project.component').then(
        (c) => c.CreateProjectComponent
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'projects/:id',
    loadComponent: () =>
      import('./components/projects/project-detail/project-detail.component').then(
        (c) => c.ProjectDetailComponent
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'admin',
    loadChildren: () => import('./components/admin/admin.routes').then((m) => m.adminRoutes),
    canActivate: [AuthGuard, AdminGuard],
  },
  { path: '**', redirectTo: '/dashboard' },
];
