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
    <div class="min-h-screen flex items-center justify-center p-4 bg-slate-900 text-white">
      <div class="max-w-lg w-full bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl space-y-6">
        
        <div class="text-center space-y-2">
          <h2 class="text-2xl font-bold">Welcome, {{ api.currentUser()?.name }}! 👋</h2>
          <p class="text-sm text-slate-400">To start tracking expenses, create a group or join one with an invite code.</p>
        </div>

        <div class="grid grid-cols-2 p-1 bg-slate-900/60 rounded-xl border border-slate-700">
          <button (click)="mode.set('CREATE')" [class.bg-indigo-600]="mode() === 'CREATE'" [class.text-white]="mode() === 'CREATE'" class="py-2.5 text-sm font-semibold rounded-lg text-slate-400 transition-all">
            🏠 Create Group
          </button>
          <button (click)="mode.set('JOIN')" [class.bg-indigo-600]="mode() === 'JOIN'" [class.text-white]="mode() === 'JOIN'" class="py-2.5 text-sm font-semibold rounded-lg text-slate-400 transition-all">
            🔗 Join with Code
          </button>
        </div>

        <div *ngIf="error()" class="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs font-medium">
          {{ error() }}
        </div>

        <!-- CREATE FORM -->
        <form *ngIf="mode() === 'CREATE'" (ngSubmit)="createGroup()" class="space-y-4">
          <div class="space-y-1">
            <label class="text-xs font-semibold text-slate-300">Group Name</label>
            <input type="text" [(ngModel)]="groupName" name="groupName" required placeholder="e.g. Palm Springs 402, Trip to Goa" class="w-full px-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-700 text-sm focus:outline-none focus:border-indigo-500" />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-semibold text-slate-300">Currency</label>
            <select [(ngModel)]="currency" name="currency" class="w-full px-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-700 text-sm focus:outline-none focus:border-indigo-500">
              <option value="INR">₹ INR (Indian Rupee)</option>
              <option value="USD">$ USD (US Dollar)</option>
              <option value="EUR">€ EUR (Euro)</option>
            </select>
          </div>

          <button type="submit" [disabled]="loading()" class="w-full py-3 bg-indigo-600 hover:bg-indigo-500 font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all">
            {{ loading() ? 'Creating Group...' : 'Create Group & Get Invite Code' }}
          </button>
        </form>

        <!-- JOIN FORM -->
        <form *ngIf="mode() === 'JOIN'" (ngSubmit)="joinGroup()" class="space-y-4">
          <div class="space-y-1">
            <label class="text-xs font-semibold text-slate-300">6-Character Invite Code</label>
            <input type="text" [(ngModel)]="inviteCode" name="inviteCode" required placeholder="e.g. PAL4X9" class="w-full px-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-700 font-mono text-center tracking-widest uppercase text-lg focus:outline-none focus:border-indigo-500" />
          </div>

          <button type="submit" [disabled]="loading()" class="w-full py-3 bg-emerald-600 hover:bg-emerald-500 font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition-all">
            {{ loading() ? 'Joining...' : 'Join Group' }}
          </button>
        </form>

      </div>
    </div>
  `
})
export class GroupOnboardingComponent {
  mode = signal<'CREATE' | 'JOIN'>('CREATE');
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  groupName = '';
  currency = 'INR';
  inviteCode = '';

  constructor(public api: ApiService, private router: Router) {}

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
      }
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
      }
    });
  }
}

// Backward compatibility alias
export const FlatOnboardingComponent = GroupOnboardingComponent;
