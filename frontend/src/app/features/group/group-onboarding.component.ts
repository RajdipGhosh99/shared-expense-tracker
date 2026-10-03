import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service.js';

@Component({
  selector: 'app-group-onboarding',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div
      class="min-h-screen flex items-center justify-center p-4 bg-slate-50 text-slate-900 font-sans"
    >
      <div
        class="max-w-lg w-full bg-white p-7 sm:p-9 rounded-2xl border border-slate-200 shadow-xs space-y-6"
      >
        <div class="text-center space-y-2">
          <div
            class="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center mx-auto text-xl shadow-xs"
          >
            🏢
          </div>
          <h2 class="text-2xl font-bold text-slate-900 tracking-tight">
            Welcome, {{ api.currentUser()?.name }}! 👋
          </h2>
          <p class="text-xs text-slate-500 max-w-sm mx-auto">
            To start tracking shared expenses, create a new group or join an existing one using an
            invite code.
          </p>
        </div>

        <div class="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            (click)="mode.set('CREATE')"
            [class.bg-white]="mode() === 'CREATE'"
            [class.text-slate-900]="mode() === 'CREATE'"
            [class.shadow-xs]="mode() === 'CREATE'"
            [class.text-slate-600]="mode() !== 'CREATE'"
            class="py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer"
          >
            🏠 Create Group
          </button>
          <button
            (click)="mode.set('JOIN')"
            [class.bg-white]="mode() === 'JOIN'"
            [class.text-slate-900]="mode() === 'JOIN'"
            [class.shadow-xs]="mode() === 'JOIN'"
            [class.text-slate-600]="mode() !== 'JOIN'"
            class="py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer"
          >
            🔗 Join with Code
          </button>
        </div>

        <div
          *ngIf="error()"
          class="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold"
        >
          {{ error() }}
        </div>

        <!-- CREATE FORM -->
        <form *ngIf="mode() === 'CREATE'" (ngSubmit)="createGroup()" class="space-y-4">
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-700">Group Name</label>
            <input
              type="text"
              [(ngModel)]="groupName"
              name="groupName"
              required
              placeholder="e.g. Palm Springs 402, Trip to Goa"
              class="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-700">Currency</label>
            <select
              [(ngModel)]="currency"
              name="currency"
              class="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
            >
              <option value="INR">₹ INR (Indian Rupee)</option>
              <option value="USD">$ USD (US Dollar)</option>
              <option value="EUR">€ EUR (Euro)</option>
            </select>
          </div>

          <button
            type="submit"
            [disabled]="loading()"
            class="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-bold rounded-xl shadow-xs transition-all text-xs cursor-pointer"
          >
            {{ loading() ? 'Creating Group...' : 'Create Group & Get Invite Code' }}
          </button>
        </form>

        <!-- JOIN FORM -->
        <form *ngIf="mode() === 'JOIN'" (ngSubmit)="joinGroup()" class="space-y-4">
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-700">6-Character Invite Code</label>
            <input
              type="text"
              [(ngModel)]="inviteCode"
              name="inviteCode"
              required
              placeholder="e.g. PAL4X9"
              class="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 font-mono text-center tracking-widest uppercase text-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>

          <button
            type="submit"
            [disabled]="loading()"
            class="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold rounded-xl shadow-xs transition-all text-xs cursor-pointer"
          >
            {{ loading() ? 'Joining...' : 'Join Group' }}
          </button>
        </form>
      </div>
    </div>
  `,
})
export class GroupOnboardingComponent {
  mode = signal<'CREATE' | 'JOIN'>('CREATE');
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  groupName = '';
  currency = 'INR';
  inviteCode = '';

  constructor(
    public api: ApiService,
    private router: Router,
  ) {}

  createGroup() {
    this.loading.set(true);
    this.error.set(null);

    this.api.createGroup(this.groupName, this.currency).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.error || 'Failed to create group.');
      },
    });
  }

  joinGroup() {
    this.loading.set(true);
    this.error.set(null);

    this.api.joinGroup(this.inviteCode).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.error || 'Failed to join group. Check the invite code.');
      },
    });
  }
}

// Backward compatibility alias
export const FlatOnboardingComponent = GroupOnboardingComponent;
