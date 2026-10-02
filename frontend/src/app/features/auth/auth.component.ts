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
    <div class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white">
      <div class="max-w-md w-full bg-slate-800/80 backdrop-blur-xl p-8 rounded-3xl border border-slate-700/60 shadow-2xl space-y-6">
        
        <div class="text-center space-y-2">
          <div class="inline-flex p-3 bg-indigo-600/30 rounded-2xl text-indigo-400 mb-1 border border-indigo-500/30">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
          </div>
          <h1 class="text-2xl font-black tracking-tight">Shared Expense Tracker</h1>
          <p class="text-sm text-slate-400">Frictionless group expense splitting & UPI settlements</p>
        </div>

        <!-- Mode Toggle -->
        <div class="grid grid-cols-2 p-1 bg-slate-900/60 rounded-xl border border-slate-700/50">
          <button (click)="isRegister.set(false)" [class.bg-indigo-600]="!isRegister()" [class.text-white]="!isRegister()" class="py-2 text-sm font-semibold rounded-lg text-slate-400 transition-all">
            Log In
          </button>
          <button (click)="isRegister.set(true)" [class.bg-indigo-600]="isRegister()" [class.text-white]="isRegister()" class="py-2 text-sm font-semibold rounded-lg text-slate-400 transition-all">
            Sign Up
          </button>
        </div>

        <!-- Error Alert -->
        <div *ngIf="errorMessage()" class="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs font-medium">
          {{ errorMessage() }}
        </div>

        <form (ngSubmit)="submit()" class="space-y-4">
          <div *ngIf="isRegister()" class="space-y-1">
            <label class="text-xs font-semibold text-slate-300">Full Name</label>
            <input type="text" [(ngModel)]="name" name="name" required placeholder="e.g. Rahul Sharma" class="w-full px-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-700 text-sm focus:outline-none focus:border-indigo-500" />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-semibold text-slate-300">Email Address</label>
            <input type="email" [(ngModel)]="email" name="email" required placeholder="rahul@group.com" class="w-full px-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-700 text-sm focus:outline-none focus:border-indigo-500" />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-semibold text-slate-300">Password</label>
            <input type="password" [(ngModel)]="password" name="password" required placeholder="••••••••" class="w-full px-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-700 text-sm focus:outline-none focus:border-indigo-500" />
          </div>

          <div *ngIf="isRegister()" class="space-y-1">
            <label class="text-xs font-semibold text-slate-300">UPI ID (Optional for 1-Tap Settlements)</label>
            <input type="text" [(ngModel)]="upiId" name="upiId" placeholder="rahul@okaxis" class="w-full px-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-700 text-sm focus:outline-none focus:border-indigo-500" />
          </div>

          <button type="submit" [disabled]="loading()" class="w-full py-3 bg-indigo-600 hover:bg-indigo-500 font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2">
            <span *ngIf="!loading()">{{ isRegister() ? 'Create Account' : 'Log In' }}</span>
            <span *ngIf="loading()" class="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></span>
          </button>
        </form>

        <!-- Quick Demo Profiles -->
        <div class="pt-2 border-t border-slate-700/50 space-y-2">
          <p class="text-xs text-center text-slate-500 uppercase tracking-wider font-semibold">Or Try Instant Demo Profile</p>
          <div class="grid grid-cols-2 gap-2">
            <button (click)="quickLogin('rahul@group.com', 'Rahul (Member 1)')" class="py-2 px-3 bg-slate-900/40 hover:bg-slate-700/40 border border-slate-700 rounded-xl text-xs font-medium text-slate-300 transition-all text-center">
              👤 Rahul (Admin)
            </button>
            <button (click)="quickLogin('amit@group.com', 'Amit (Member 2)')" class="py-2 px-3 bg-slate-900/40 hover:bg-slate-700/40 border border-slate-700 rounded-xl text-xs font-medium text-slate-300 transition-all text-center">
              👤 Amit (Member)
            </button>
          </div>
        </div>

      </div>
    </div>
  `
})
export class AuthComponent {
  isRegister = signal<boolean>(false);
  loading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  name = '';
  email = '';
  password = '';
  upiId = '';

  constructor(private api: ApiService, private router: Router) {}

  submit() {
    this.loading.set(true);
    this.errorMessage.set(null);

    const obs = this.isRegister()
      ? this.api.register({ email: this.email, password: this.password, name: this.name, upiId: this.upiId })
      : this.api.login({ email: this.email, password: this.password });

    obs.subscribe({
      next: () => {
        this.loading.set(false);
        if (this.api.activeGroup()) {
          this.router.navigate(['/dashboard']);
        } else {
          this.router.navigate(['/onboarding']);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.error || 'Authentication failed.');
      }
    });
  }

  quickLogin(email: string, name: string) {
    this.api.login({ email }).subscribe({
      next: () => {
        if (this.api.activeGroup()) {
          this.router.navigate(['/dashboard']);
        } else {
          this.router.navigate(['/onboarding']);
        }
      }
    });
  }
}
