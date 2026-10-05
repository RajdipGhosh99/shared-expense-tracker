import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from './core/services/api.service.js';
import { AuthComponent } from './features/auth/auth.component.js';
import { GroupOnboardingComponent } from './features/group/group-onboarding.component.js';
import { DashboardComponent } from './features/dashboard/dashboard.component.js';
import { IncomingScreenshotComponent } from './features/screenshot/incoming-screenshot.component.js';
import { StatementsComponent } from './features/statements/statements.component.js';
import { NotFoundComponent } from './features/not-found/not-found.component.js';

import { JoinComponent } from './features/group/join.component.js';

const authGuard = () => {
  const api = inject(ApiService);
  const router = inject(Router);
  if (!api.token()) {
    return router.createUrlTree(['/auth']);
  }
  return true;
};

export const routes: Routes = [
  { path: 'auth', component: AuthComponent },
  { path: 'join', component: JoinComponent },
  { path: 'onboarding', component: GroupOnboardingComponent, canActivate: [authGuard] },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'screenshot-review', component: IncomingScreenshotComponent, canActivate: [authGuard] },
  { path: 'statements', component: StatementsComponent, canActivate: [authGuard] },
  { path: '404', component: NotFoundComponent },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', component: NotFoundComponent },
];
