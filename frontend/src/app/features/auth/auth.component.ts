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
      class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 text-white relative overflow-hidden font-sans"
    >
      <!-- Background Ambient Glow Accents -->
      <div
        class="absolute -top-32 -left-32 w-80 h-80 bg-indigo-600/25 rounded-full blur-3xl pointer-events-none"
      ></div>
      <div
        class="absolute -bottom-32 -right-32 w-80 h-80 bg-purple-600/25 rounded-full blur-3xl pointer-events-none"
      ></div>

      <div
        class="max-w-sm sm:max-w-md w-full bg-slate-900/90 backdrop-blur-2xl p-6 sm:p-8 rounded-[36px] border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.6)] space-y-5 relative z-10"
      >
        <!-- App Header & Logo -->
        <div class="text-center space-y-2 pt-1">
          <div
            class="inline-flex size-14 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl text-white items-center justify-center text-2xl shadow-xl shadow-indigo-500/30"
          >
            ⚡
          </div>
          <div>
            <h1 class="text-2xl font-black tracking-tight text-white">
              Bhagabhagi
            </h1>
            <p class="text-xs text-indigo-200/70 font-medium">
              Shared apartment expenses & instant settlements
            </p>
          </div>
        </div>

        <!-- Mode Toggle (Log In / Sign Up) -->
        <div class="grid grid-cols-2 p-1.5 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10">
          <button
            type="button"
            (click)="setMode(false)"
            [class.bg-indigo-600]="!isRegister()"
            [class.text-white]="!isRegister()"
            [class.shadow-md]="!isRegister()"
            [class.text-slate-400]="isRegister()"
            class="py-2.5 text-xs font-black rounded-xl transition-all cursor-pointer active:scale-98"
          >
            Log In
          </button>
          <button
            type="button"
            (click)="setMode(true)"
            [class.bg-indigo-600]="isRegister()"
            [class.text-white]="isRegister()"
            [class.shadow-md]="isRegister()"
            [class.text-slate-400]="!isRegister()"
            class="py-2.5 text-xs font-black rounded-xl transition-all cursor-pointer active:scale-98"
          >
            Sign Up
          </button>
        </div>

        <!-- Error Alert with Dismiss Button -->
        <div
          *ngIf="errorMessage()"
          class="p-3 bg-rose-500/20 border border-rose-500/40 rounded-2xl text-rose-300 text-xs font-semibold flex items-center justify-between space-x-2 transition-all animate-fade-in"
        >
          <div class="flex items-center space-x-2">
            <span>⚠️</span>
            <span>{{ errorMessage() }}</span>
          </div>
          <button
            type="button"
            (click)="errorMessage.set(null)"
            class="text-rose-400 hover:text-white font-bold px-1.5 py-0.5 text-xs rounded hover:bg-rose-500/20 transition-colors cursor-pointer"
            title="Dismiss error"
          >
            ✕
          </button>
        </div>

        <!-- Form Fields -->
        <form (ngSubmit)="submit()" class="space-y-3.5">
          <div *ngIf="isRegister()" class="space-y-1">
            <label class="text-[11px] font-bold text-slate-300 ml-1">Full Name</label>
            <input
              type="text"
              [(ngModel)]="name"
              name="name"
              required
              placeholder="e.g. Alex Johnson"
              class="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all"
            />
          </div>

          <div class="space-y-1">
            <label class="text-[11px] font-bold text-slate-300 ml-1">Email Address</label>
            <input
              type="email"
              [(ngModel)]="email"
              name="email"
              required
              placeholder="name@domain.com"
              class="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all"
            />
          </div>

          <div class="space-y-1">
            <label class="text-[11px] font-bold text-slate-300 ml-1">Password</label>
            <input
              type="password"
              [(ngModel)]="password"
              name="password"
              required
              placeholder="••••••••"
              class="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all"
            />
          </div>

          <div *ngIf="isRegister()" class="space-y-1">
            <label class="text-[11px] font-bold text-slate-300 ml-1 flex items-center justify-between">
              <span>UPI ID</span>
              <span class="text-[10px] text-slate-400 font-normal">Optional (for settlements)</span>
            </label>
            <input
              type="text"
              [(ngModel)]="upiId"
              name="upiId"
              placeholder="alex@okaxis"
              class="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all"
            />
          </div>

          <button
            type="submit"
            [disabled]="loading()"
            class="w-full py-3.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:opacity-95 active:scale-[0.98] font-black rounded-2xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer text-xs sm:text-sm disabled:opacity-50 mt-1"
          >
            <span *ngIf="!loading()">{{
              isRegister() ? 'Create Free Account' : 'Log In to Tracker'
            }}</span>
            <span
              *ngIf="loading()"
              class="animate-spin size-4 border-2 border-white border-t-transparent rounded-full"
            ></span>
          </button>
        </form>

        <!-- Roommate WhatsApp Invite Prompt -->
        <div class="pt-2 text-center border-t border-white/5">
          <p class="text-[11px] text-slate-400">
            Joining a roommate's space? <br />
            <span class="text-indigo-400 font-bold">Use the WhatsApp invite link to enter without password</span>
          </p>
        </div>
      </div>
    </div>
  `,
})
export class AuthComponent {
  isRegister = signal<boolean>(false);
  loading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  private errorTimeout: any = null;

  name = '';
  email = '';
  password = '';
  upiId = '';

  constructor(
    private api: ApiService,
    private router: Router,
  ) {}

  setMode(register: boolean) {
    this.isRegister.set(register);
    this.clearError();
  }

  private clearError() {
    this.errorMessage.set(null);
    if (this.errorTimeout) {
      clearTimeout(this.errorTimeout);
      this.errorTimeout = null;
    }
  }

  private extractErrorMessage(err: any): string {
    if (!err) return 'Authentication failed. Please check your credentials.';

    // Check string error response
    if (typeof err.error === 'string') {
      const trimmed = err.error.trim();
      if (trimmed.startsWith('<') || trimmed.includes('FUNCTION_INVOCATION_FAILED')) {
        return 'Backend server error (500). Please check Turso DB credentials on Vercel.';
      }
      return trimmed;
    }

    // Check JSON structured error: { error: "..." } or { message: "..." }
    if (typeof err.error === 'object' && err.error !== null) {
      if (typeof err.error.error === 'string') return err.error.error;
      if (typeof err.error.message === 'string') return err.error.message;
      if (err.error.error && typeof err.error.error.message === 'string') {
        return err.error.error.message;
      }
    }

    // Status code fallback
    if (err.status === 0) {
      return 'Cannot reach backend server. Please verify network or Vercel service.';
    }
    if (err.status === 401) {
      return 'Invalid credentials. Please verify your email and password.';
    }
    if (err.status === 409) {
      return 'Account already exists with this email. Please log in instead.';
    }
    if (err.status === 500) {
      return 'Backend server error (500). Please check database configuration.';
    }

    if (typeof err.message === 'string' && err.message) {
      return err.message;
    }

    return 'Authentication failed. Please check your inputs and try again.';
  }

  submit() {
    this.loading.set(true);
    this.clearError();

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
        this.clearError();
        this.handlePostAuthNavigation();
      },
      error: (err) => {
        this.loading.set(false);
        const msg = this.extractErrorMessage(err);
        this.errorMessage.set(msg);

        // Auto-dismiss inline banner after 6 seconds
        if (this.errorTimeout) clearTimeout(this.errorTimeout);
        this.errorTimeout = setTimeout(() => {
          this.errorMessage.set(null);
        }, 6000);
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
