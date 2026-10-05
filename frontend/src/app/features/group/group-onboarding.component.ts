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
        class="max-w-lg w-full bg-white p-7 sm:p-9 rounded-2xl border border-slate-200 shadow-xs space-y-6 relative"
      >
        <div class="flex justify-end">
          <button
            type="button"
            (click)="logout()"
            class="px-3 py-1.5 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <span>Log out</span>
            <span>🚪</span>
          </button>
        </div>

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
            To start tracking shared expenses, create a space for your apartment or group below.
          </p>
        </div>

        <div
          *ngIf="error()"
          class="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold"
        >
          {{ error() }}
        </div>

        <!-- CREATE SPACE FORM -->
        <form (ngSubmit)="createGroup()" class="space-y-4">
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-700">Space / Group Name</label>
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
            [disabled]="loading() || !groupName.trim()"
            class="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-bold rounded-xl shadow-xs transition-all text-xs cursor-pointer disabled:opacity-50"
          >
            {{ loading() ? 'Creating Space...' : 'Create Space & Enter' }}
          </button>
        </form>

        <!-- INVITE LINK NOTICE -->
        <div class="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-2">
          <div class="flex items-center space-x-2 text-indigo-900 font-bold text-xs">
            <span>🔗</span>
            <span>Joining an existing space?</span>
          </div>
          <p class="text-[11px] text-indigo-700 leading-relaxed">
            Spaces now use secure, pre-approved invite links sent by your space admin over WhatsApp or email. Simply open the link you received to verify with a quick email code!
          </p>
        </div>
      </div>
    </div>
  `,
})
export class GroupOnboardingComponent {
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  groupName = '';
  currency = 'INR';

  constructor(
    public api: ApiService,
    private router: Router,
  ) {}

  createGroup() {
    if (!this.groupName.trim()) return;
    this.loading.set(true);
    this.error.set(null);

    this.api.createGroup(this.groupName.trim(), this.currency).subscribe({
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

  logout() {
    this.api.logout();
    this.router.navigate(['/auth']);
  }
}

// Backward compatibility alias
export const FlatOnboardingComponent = GroupOnboardingComponent;
