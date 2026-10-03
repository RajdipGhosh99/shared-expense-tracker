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
      class="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-slate-100 relative overflow-hidden"
    >
      <!-- Ambient background glows -->
      <div
        class="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"
      ></div>
      <div
        class="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"
      ></div>

      <div
        class="max-w-lg w-full bg-slate-900/85 backdrop-blur-2xl p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6 relative z-10"
      >
        <div class="text-center space-y-2">
          <div
            class="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto text-xl shadow-inner"
          >
            🏢
          </div>
          <h2 class="text-2xl font-black text-white tracking-tight">
            Welcome, {{ api.currentUser()?.name }}! 👋
          </h2>
          <p class="text-xs text-slate-400 max-w-sm mx-auto">
            To start tracking shared expenses, create a new group or join an existing flat using an
            invite code.
          </p>
        </div>

        <div class="grid grid-cols-2 p-1 bg-slate-950/80 rounded-2xl border border-slate-800">
          <button
            (click)="mode.set('CREATE')"
            [class.bg-slate-800]="mode() === 'CREATE'"
            [class.text-white]="mode() === 'CREATE'"
            [class.shadow-md]="mode() === 'CREATE'"
            [class.text-slate-400]="mode() !== 'CREATE'"
            class="py-2.5 text-xs font-bold rounded-xl transition-all"
          >
            🏠 Create Group
          </button>
          <button
            (click)="mode.set('JOIN')"
            [class.bg-slate-800]="mode() === 'JOIN'"
            [class.text-white]="mode() === 'JOIN'"
            [class.shadow-md]="mode() === 'JOIN'"
            [class.text-slate-400]="mode() !== 'JOIN'"
            class="py-2.5 text-xs font-bold rounded-xl transition-all"
          >
            🔗 Join with Code
          </button>
        </div>

        <div
          *ngIf="error()"
          class="p-3 bg-rose-950/50 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-medium"
        >
          {{ error() }}
        </div>

        <!-- CREATE FORM -->
        <form *ngIf="mode() === 'CREATE'" (ngSubmit)="createGroup()" class="space-y-4">
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-300">Group Name</label>
            <input
              type="text"
              [(ngModel)]="groupName"
              name="groupName"
              required
              placeholder="e.g. Palm Springs 402, Trip to Goa"
              class="w-full px-4 py-3 rounded-xl bg-slate-950/70 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-300">Currency</label>
            <select
              [(ngModel)]="currency"
              name="currency"
              class="w-full px-4 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs font-medium text-white focus:outline-none focus:border-indigo-500 [color-scheme:dark] transition-all"
            >
              <option value="INR">₹ INR (Indian Rupee)</option>
              <option value="USD">$ USD (US Dollar)</option>
              <option value="EUR">€ EUR (Euro)</option>
            </select>
          </div>

          <button
            type="submit"
            [disabled]="loading()"
            class="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 active:scale-98 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all text-sm"
          >
            {{ loading() ? 'Creating Group...' : 'Create Group & Get Invite Code' }}
          </button>
        </form>

        <!-- JOIN FORM -->
        <form *ngIf="mode() === 'JOIN'" (ngSubmit)="joinGroup()" class="space-y-4">
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-300">6-Character Invite Code</label>
            <input
              type="text"
              [(ngModel)]="inviteCode"
              name="inviteCode"
              required
              placeholder="e.g. PAL4X9"
              class="w-full px-4 py-3 rounded-xl bg-slate-950/70 border border-slate-800 font-mono text-center tracking-widest uppercase text-lg text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>

          <button
            type="submit"
            [disabled]="loading()"
            class="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-98 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/25 transition-all text-sm"
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
