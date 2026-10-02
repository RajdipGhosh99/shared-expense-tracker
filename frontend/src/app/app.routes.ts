import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from './core/services/api.service.js';
import { AuthComponent } from './features/auth/auth.component.js';
import { FlatOnboardingComponent } from './features/flat/flat-onboarding.component.js';
import { DashboardComponent } from './features/dashboard/dashboard.component.js';
import { IncomingScreenshotComponent } from './features/screenshot/incoming-screenshot.component.js';
import { StatementsComponent } from './features/statements/statements.component.js';

const authGuard = () => {
  const api = inject(ApiService);
  const router = inject(Router);
  if (!api.token()) {
    router.navigate(['/auth']);
    return false;
  }
  return true;
};

export const routes: Routes = [
  { path: 'auth', component: AuthComponent },
  { path: 'onboarding', component: FlatOnboardingComponent, canActivate: [authGuard] },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'screenshot-review', component: IncomingScreenshotComponent, canActivate: [authGuard] },
  { path: 'statements', component: StatementsComponent, canActivate: [authGuard] },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: 'dashboard' },
];
