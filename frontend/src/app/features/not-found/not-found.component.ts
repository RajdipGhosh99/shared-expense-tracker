import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../core/services/api.service.js';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule],
  template: `
    <div
      class="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between items-center p-6 selection:bg-indigo-500 selection:text-white"
    >
      <!-- Top Brand Header -->
      <div class="w-full max-w-md pt-4 flex items-center justify-center space-x-2 text-slate-400">
        <i class="fa-solid fa-house text-indigo-400 text-lg"></i>
        <span class="font-black text-sm tracking-wide text-white">Bhagabhagi</span>
      </div>

      <!-- Center 404 Card -->
      <main class="w-full max-w-md my-auto text-center space-y-6">
        <div class="relative mx-auto w-32 h-32 flex items-center justify-center">
          <div class="absolute inset-0 bg-indigo-500/20 rounded-full blur-2xl animate-pulse"></div>
          <div
            class="relative w-28 h-28 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col items-center justify-center space-y-1"
          >
            <i class="fa-solid fa-compass text-3xl text-indigo-400"></i>
            <span class="text-xs font-black tracking-widest text-indigo-400 uppercase mt-1">404</span>
          </div>
        </div>

        <div class="space-y-2">
          <h1 class="text-2xl font-black text-white tracking-tight">Page Not Found</h1>
          <p class="text-sm text-slate-400 max-w-xs mx-auto leading-relaxed">
            The page you're looking for doesn't exist, was renamed, or is temporarily unavailable.
          </p>
        </div>

        <div class="space-y-3 pt-2">
          <button
            mat-flat-button
            (click)="navigateHome()"
            class="!w-full !py-3.5 !rounded-2xl !bg-indigo-600 hover:!bg-indigo-500 !text-white !font-bold !text-sm flex items-center justify-center gap-2 !shadow-lg !shadow-indigo-600/30"
          >
            <i class="fa-solid fa-arrow-left mr-1.5"></i>
            <span>{{ api.token() ? 'Return to Dashboard' : 'Back to Sign In' }}</span>
          </button>

          <button
            *ngIf="api.token()"
            mat-stroked-button
            (click)="router.navigate(['/statements'])"
            class="!w-full !py-3 !rounded-2xl !border-slate-800 !bg-slate-900/60 hover:!bg-slate-800 !text-slate-300 !font-semibold !text-xs flex items-center justify-center gap-2"
          >
            <i class="fa-solid fa-file-invoice mr-1.5 text-slate-400"></i>
            View Monthly Statements
          </button>
        </div>
      </main>

      <!-- Bottom Info -->
      <footer class="w-full max-w-md pb-4 text-center text-xs text-slate-600">
        Frictionless group expense splitting & UPI settlements
      </footer>
    </div>
  `,
})
export class NotFoundComponent {
  constructor(
    public api: ApiService,
    public router: Router,
  ) {}

  navigateHome() {
    if (this.api.token()) {
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['/auth']);
    }
  }
}
