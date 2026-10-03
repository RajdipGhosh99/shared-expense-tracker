import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service.js';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div
      class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white relative overflow-hidden"
    >
      <!-- Background Ambient Glow Accents -->
      <div
        class="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"
      ></div>
      <div
        class="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"
      ></div>

      <div
        class="max-w-md w-full bg-slate-900/80 backdrop-blur-2xl p-7 sm:p-9 rounded-3xl border border-slate-700/70 shadow-[0_25px_60px_rgba(0,0,0,0.5)] space-y-6 relative z-10"
      >
        <!-- App Header & Logo -->
        <div class="text-center space-y-2">
          <div
            class="inline-flex p-3 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl text-white mb-1 shadow-lg shadow-indigo-500/30"
          >
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2.5"
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <h1 class="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Shared Expense Tracker
          </h1>
          <p class="text-xs sm:text-sm text-slate-400 font-medium">
            Frictionless group expense splitting & 1-tap UPI settlements
          </p>
        </div>

        <!-- Mode Toggle (Log In / Sign Up) -->
        <div class="grid grid-cols-2 p-1 bg-slate-950/70 rounded-xl border border-slate-700/50">
          <button
            type="button"
            (click)="isRegister.set(false)"
            [class.bg-indigo-600]="!isRegister()"
            [class.text-white]="!isRegister()"
            [class.shadow-md]="!isRegister()"
            class="py-2 text-xs sm:text-sm font-bold rounded-lg text-slate-400 transition-all cursor-pointer"
          >
            Log In
          </button>
          <button
            type="button"
            (click)="isRegister.set(true)"
            [class.bg-indigo-600]="isRegister()"
            [class.text-white]="isRegister()"
            [class.shadow-md]="isRegister()"
            class="py-2 text-xs sm:text-sm font-bold rounded-lg text-slate-400 transition-all cursor-pointer"
          >
            Sign Up
          </button>
        </div>

        <!-- Error Alert -->
        <div
          *ngIf="errorMessage()"
          class="p-3.5 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs font-semibold flex items-center space-x-2"
        >
          <span>⚠️</span>
          <span>{{ errorMessage() }}</span>
        </div>

        <!-- Form Fields -->
        <form (ngSubmit)="submit()" class="space-y-4">
          <div *ngIf="isRegister()" class="space-y-1">
            <label class="text-xs font-bold text-slate-300">Full Name</label>
            <input
              type="text"
              [(ngModel)]="name"
              name="name"
              required
              placeholder="e.g. Alex Johnson"
              class="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-300">Email Address</label>
            <input
              type="email"
              [(ngModel)]="email"
              name="email"
              required
              placeholder="alex@example.com"
              class="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-300">Password</label>
            <input
              type="password"
              [(ngModel)]="password"
              name="password"
              required
              placeholder="••••••••"
              class="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          <div *ngIf="isRegister()" class="space-y-1">
            <label class="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>UPI ID</span>
              <span class="text-[10px] text-slate-400 font-normal">Optional (for settlements)</span>
            </label>
            <input
              type="text"
              [(ngModel)]="upiId"
              name="upiId"
              placeholder="alex@okaxis"
              class="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          <button
            type="submit"
            [disabled]="loading()"
            class="w-full py-3.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:opacity-95 active:scale-[0.98] font-extrabold rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer text-sm"
          >
            <span *ngIf="!loading()">{{
              isRegister() ? 'Create Free Account' : 'Log In to Tracker'
            }}</span>
            <span
              *ngIf="loading()"
              class="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"
            ></span>
          </button>
        </form>
      </div>
    </div>
  `,
})
export class AuthComponent {
  isRegister = signal<boolean>(false);
  loading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  name = '';
  email = '';
  password = '';
  upiId = '';

  constructor(
    private api: ApiService,
    private router: Router,
  ) {}

  submit() {
    this.loading.set(true);
    this.errorMessage.set(null);

    const obs = this.isRegister()
      ? this.api.register({
          email: this.email,
          password: this.password,
          name: this.name,
          upiId: this.upiId,
        })
      : this.api.login({ email: this.email, password: this.password });

    obs.subscribe({
      next: () => {
        this.loading.set(false);
        this.handlePostAuthNavigation();
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.error || 'Authentication failed.');
      },
    });
  }

  private handlePostAuthNavigation() {
    this.api.fetchUserGroups().subscribe({
      next: (res) => {
        if (res.memberships && res.memberships.length > 0) {
          const active = res.memberships.find((m) => m.status === 'ACTIVE') || res.memberships[0];
          this.api.setActiveGroup(active.group);
          this.router.navigate(['/dashboard']);
        } else {
          this.router.navigate(['/onboarding']);
        }
      },
      error: () => {
        if (this.api.activeGroup()) {
          this.router.navigate(['/dashboard']);
        } else {
          this.router.navigate(['/onboarding']);
        }
      },
    });
  }
}
