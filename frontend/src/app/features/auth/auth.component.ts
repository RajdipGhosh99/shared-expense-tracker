import { Component, signal, OnDestroy } from '@angular/core';
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

        <!-- Mode Toggle (Log In / Sign Up) - Only visible when on EMAIL step -->
        <div
          *ngIf="step() === 'EMAIL'"
          class="grid grid-cols-2 p-1.5 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10"
        >
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

        <!-- Success/Info Notice -->
        <div
          *ngIf="infoMessage()"
          class="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs font-semibold flex items-center justify-between space-x-2 transition-all animate-fade-in"
        >
          <div class="flex items-center space-x-2">
            <span>✉️</span>
            <span>{{ infoMessage() }}</span>
          </div>
          <button
            type="button"
            (click)="infoMessage.set(null)"
            class="text-emerald-400 hover:text-white font-bold px-1.5 py-0.5 text-xs rounded hover:bg-emerald-500/20 transition-colors cursor-pointer"
            title="Dismiss notice"
          >
            ✕
          </button>
        </div>

        <!-- STEP 1: Enter Email / Details -->
        <form *ngIf="step() === 'EMAIL'" (ngSubmit)="sendOtp()" class="space-y-3.5">
          <div *ngIf="isRegister()" class="space-y-1">
            <label class="text-[11px] font-bold text-slate-300 ml-1">Full Name</label>
            <input
              type="text"
              [(ngModel)]="name"
              name="name"
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
            [disabled]="loading() || !email.trim()"
            class="w-full py-3.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:opacity-95 active:scale-[0.98] font-black rounded-2xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer text-xs sm:text-sm disabled:opacity-50 mt-1"
          >
            <span *ngIf="!loading()">Send 6-Digit Code</span>
            <span
              *ngIf="loading()"
              class="animate-spin size-4 border-2 border-white border-t-transparent rounded-full"
            ></span>
          </button>
        </form>

        <!-- STEP 2: Enter 6-Digit OTP -->
        <form *ngIf="step() === 'OTP'" (ngSubmit)="verifyOtp()" class="space-y-4">
          <div class="p-3 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
            <div class="truncate mr-2">
              <span class="text-[10px] uppercase font-bold text-slate-400 block">Sent code to</span>
              <span class="text-xs font-semibold text-white truncate block">{{ email }}</span>
            </div>
            <button
              type="button"
              (click)="backToEmail()"
              class="text-xs text-indigo-400 hover:text-indigo-300 font-bold px-2 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 transition-all cursor-pointer flex-shrink-0"
            >
              Change
            </button>
          </div>

          <div class="space-y-2">
            <label class="text-[11px] font-bold text-slate-300 ml-1 block text-center">
              Enter 6-Digit Verification Code
            </label>
            <input
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
              maxlength="6"
              [(ngModel)]="otp"
              name="otp"
              required
              autofocus
              placeholder="••••••"
              class="w-full px-4 py-3.5 rounded-2xl bg-black/40 border border-white/20 text-center text-2xl font-mono font-bold tracking-[0.5em] text-white placeholder-slate-600 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/40 transition-all"
            />
          </div>

          <button
            type="submit"
            [disabled]="loading() || otp.trim().length !== 6"
            class="w-full py-3.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:opacity-95 active:scale-[0.98] font-black rounded-2xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer text-xs sm:text-sm disabled:opacity-50"
          >
            <span *ngIf="!loading()">Verify & Log In</span>
            <span
              *ngIf="loading()"
              class="animate-spin size-4 border-2 border-white border-t-transparent rounded-full"
            ></span>
          </button>

          <!-- Resend Code Cooldown -->
          <div class="text-center pt-1">
            <button
              *ngIf="resendCooldown() === 0"
              type="button"
              (click)="resendOtp()"
              [disabled]="loading()"
              class="text-xs text-indigo-400 hover:text-indigo-300 font-bold hover:underline cursor-pointer transition-colors"
            >
              Didn't receive code? Resend Code
            </button>
            <p *ngIf="resendCooldown() > 0" class="text-xs text-slate-400 font-medium">
              Resend code in <span class="font-bold text-white">{{ resendCooldown() }}s</span>
            </p>
          </div>
        </form>

        <!-- Roommate WhatsApp Invite Prompt -->
        <div class="pt-2 text-center border-t border-white/5">
          <p class="text-[11px] text-slate-400">
            Joining a roommate's space? <br />
            <span class="text-indigo-400 font-bold">Use the WhatsApp invite link to enter directly</span>
          </p>
        </div>
      </div>
    </div>
  `,
})
export class AuthComponent implements OnDestroy {
  step = signal<'EMAIL' | 'OTP'>('EMAIL');
  isRegister = signal<boolean>(false);
  loading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  infoMessage = signal<string | null>(null);
  resendCooldown = signal<number>(0);

  private errorTimeout: any = null;
  private cooldownTimer: any = null;

  name = '';
  email = '';
  otp = '';
  upiId = '';

  constructor(
    private api: ApiService,
    private router: Router,
  ) {}

  ngOnDestroy() {
    if (this.errorTimeout) clearTimeout(this.errorTimeout);
    if (this.cooldownTimer) clearInterval(this.cooldownTimer);
  }

  setMode(register: boolean) {
    this.isRegister.set(register);
    this.clearError();
  }

  backToEmail() {
    this.step.set('EMAIL');
    this.otp = '';
    this.clearError();
  }

  private clearError() {
    this.errorMessage.set(null);
    if (this.errorTimeout) {
      clearTimeout(this.errorTimeout);
      this.errorTimeout = null;
    }
  }

  private startCooldown(seconds: number = 60) {
    this.resendCooldown.set(seconds);
    if (this.cooldownTimer) clearInterval(this.cooldownTimer);
    this.cooldownTimer = setInterval(() => {
      const current = this.resendCooldown();
      if (current <= 1) {
        this.resendCooldown.set(0);
        clearInterval(this.cooldownTimer);
        this.cooldownTimer = null;
      } else {
        this.resendCooldown.set(current - 1);
      }
    }, 1000);
  }

  private extractErrorMessage(err: any): string {
    if (!err) return 'Request failed. Please check your network and try again.';

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
      return 'Invalid code or code expired. Please request a new code.';
    }
    if (err.status === 429) {
      return 'Too many attempts. Please wait a moment before trying again.';
    }
    if (err.status === 500) {
      return 'Backend server error (500). Please check email service configuration.';
    }

    if (typeof err.message === 'string' && err.message) {
      return err.message;
    }

    return 'Request failed. Please check your inputs and try again.';
  }

  sendOtp() {
    if (!this.email || !this.email.trim()) {
      this.errorMessage.set('Please enter a valid email address.');
      return;
    }

    this.loading.set(true);
    this.clearError();
    this.infoMessage.set(null);

    this.api.sendAuthOtp(this.email.trim(), this.name?.trim() || undefined).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.infoMessage.set(`6-digit code sent to ${this.email.trim()}`);
        this.startCooldown(res.cooldownSeconds || 60);
        this.step.set('OTP');
      },
      error: (err) => {
        this.loading.set(false);
        const msg = this.extractErrorMessage(err);
        this.errorMessage.set(msg);

        if (err?.error?.retryAfterSeconds) {
          this.startCooldown(err.error.retryAfterSeconds);
        }

        if (this.errorTimeout) clearTimeout(this.errorTimeout);
        this.errorTimeout = setTimeout(() => {
          this.errorMessage.set(null);
        }, 6000);
      },
    });
  }

  resendOtp() {
    if (this.resendCooldown() > 0) return;
    this.sendOtp();
  }

  verifyOtp() {
    if (!this.otp || this.otp.trim().length !== 6) {
      this.errorMessage.set('Please enter the 6-digit verification code.');
      return;
    }

    this.loading.set(true);
    this.clearError();

    this.api
      .verifyAuthOtp({
        email: this.email.trim(),
        otp: this.otp.trim(),
        name: this.name?.trim() || undefined,
        upiId: this.upiId?.trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.clearError();
          this.handlePostAuthNavigation();
        },
        error: (err) => {
          this.loading.set(false);
          const msg = this.extractErrorMessage(err);
          this.errorMessage.set(msg);

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
