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

        <!-- PROMINENT GOOGLE SIGN IN BUTTON -->
        <div class="space-y-3">
          <button
            type="button"
            (click)="openGooglePrompt()"
            [disabled]="loading()"
            class="w-full py-3.5 px-4 bg-white hover:bg-slate-100 active:scale-[0.98] transition-all text-slate-800 font-bold rounded-2xl shadow-xl shadow-white/5 border border-slate-200 flex items-center justify-center space-x-3 cursor-pointer group"
          >
            <!-- Google Official 4-Color SVG Icon -->
            <svg class="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span class="text-sm font-semibold tracking-wide text-slate-800"
              >Continue with Google</span
            >
          </button>

          <!-- Divider -->
          <div class="relative flex py-1 items-center">
            <div class="flex-grow border-t border-slate-700/60"></div>
            <span
              class="flex-shrink mx-3 text-slate-500 text-xs font-semibold uppercase tracking-wider"
              >or with email</span
            >
            <div class="flex-grow border-t border-slate-700/60"></div>
          </div>
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

      <!-- Google Sign-In Modal Prompt -->
      <div
        *ngIf="showGoogleModal()"
        class="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <div
          class="bg-white text-slate-900 rounded-3xl max-w-sm w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 border border-slate-100"
        >
          <!-- Header -->
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <div class="flex items-center space-x-2.5">
              <svg class="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <div>
                <h3 class="font-bold text-sm text-slate-800 leading-tight">Sign in with Google</h3>
                <p class="text-[10px] text-slate-500">to continue to Expense Tracker</p>
              </div>
            </div>
            <button
              (click)="showGoogleModal.set(false)"
              class="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>

          <!-- Google Account Form -->
          <form (ngSubmit)="loginWithGoogle()" class="space-y-3.5">
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">Google Account Email</label>
              <input
                type="email"
                [(ngModel)]="googleEmail"
                name="googleEmail"
                required
                placeholder="your.name@gmail.com"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">Full Name</label>
              <input
                type="text"
                [(ngModel)]="googleName"
                name="googleName"
                placeholder="e.g. Alex Johnson"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700 flex justify-between">
                <span>UPI ID</span>
                <span class="text-[10px] text-slate-400 font-normal">Optional</span>
              </label>
              <input
                type="text"
                [(ngModel)]="googleUpi"
                name="googleUpi"
                placeholder="yourname@okaxis"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              [disabled]="loading() || !googleEmail.trim()"
              class="w-full py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition-all text-xs flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>Sign in with Google Account</span>
            </button>
          </form>

          <p
            class="text-[10px] text-slate-400 text-center flex items-center justify-center space-x-1"
          >
            <span>🔒</span>
            <span>Secured via Google Identity Protocol</span>
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
  showGoogleModal = signal<boolean>(false);

  name = '';
  email = '';
  password = '';
  upiId = '';

  googleEmail = '';
  googleName = '';
  googleUpi = '';

  constructor(
    private api: ApiService,
    private router: Router,
  ) {}

  openGooglePrompt() {
    this.showGoogleModal.set(true);
  }

  loginWithGoogle() {
    if (!this.googleEmail.trim()) {
      this.errorMessage.set('Please enter your Google account email.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const name =
      this.googleName.trim() ||
      this.googleEmail.split('@')[0].charAt(0).toUpperCase() +
        this.googleEmail.split('@')[0].slice(1);

    this.api
      .loginWithGoogle({
        email: this.googleEmail.trim(),
        name,
        upiId: this.googleUpi.trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.showGoogleModal.set(false);
          this.handlePostAuthNavigation();
        },
        error: (err) => {
          this.loading.set(false);
          this.errorMessage.set(err.error?.error || 'Google authentication failed.');
        },
      });
  }

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
