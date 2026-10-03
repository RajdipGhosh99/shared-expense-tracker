import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service.js';
import { MonthlyStatement } from '@shared-expense-tracker/shared';

@Component({
  selector: 'app-statements',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-slate-950 text-slate-100 pb-16">
      <!-- Navbar -->
      <header
        class="bg-slate-950/85 backdrop-blur-2xl border-b border-slate-800/80 sticky top-0 z-30 px-4 py-3.5 shadow-sm"
      >
        <div class="max-w-3xl mx-auto flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <button
              (click)="router.navigate(['/dashboard'])"
              class="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center space-x-1.5 transition-all"
            >
              <span>←</span>
              <span>Back</span>
            </button>
            <h1 class="text-base font-black text-white tracking-tight">Monthly Statements</h1>
          </div>
          <a
            *ngIf="whatsappLink()"
            [href]="whatsappLink()"
            target="_blank"
            class="px-3.5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/20 flex items-center space-x-1.5 transition-all"
          >
            <span>💬 Share on WhatsApp</span>
          </a>
        </div>
      </header>

      <main class="max-w-3xl mx-auto p-4 space-y-6">
        <!-- Period Filter Tabs -->
        <div class="grid grid-cols-3 p-1 bg-slate-900/90 border border-slate-800 rounded-2xl">
          <button
            (click)="loadStatement('current')"
            [class.bg-slate-800]="period() === 'current'"
            [class.text-white]="period() === 'current'"
            [class.shadow-md]="period() === 'current'"
            [class.text-slate-400]="period() !== 'current'"
            class="py-2 text-xs font-bold rounded-xl transition-all"
          >
            Current Month
          </button>
          <button
            (click)="loadStatement('last')"
            [class.bg-slate-800]="period() === 'last'"
            [class.text-white]="period() === 'last'"
            [class.shadow-md]="period() === 'last'"
            [class.text-slate-400]="period() !== 'last'"
            class="py-2 text-xs font-bold rounded-xl transition-all"
          >
            Last Month
          </button>
          <button
            (click)="period.set('custom')"
            [class.bg-slate-800]="period() === 'custom'"
            [class.text-white]="period() === 'custom'"
            [class.shadow-md]="period() === 'custom'"
            [class.text-slate-400]="period() !== 'custom'"
            class="py-2 text-xs font-bold rounded-xl transition-all"
          >
            Custom Range
          </button>
        </div>

        <!-- Custom Date Range Form -->
        <div
          *ngIf="period() === 'custom'"
          class="bg-slate-900/70 backdrop-blur-xl p-4 rounded-2xl border border-slate-800/80 grid grid-cols-3 gap-3 items-end"
        >
          <div class="space-y-1">
            <label class="text-xs font-semibold text-slate-400">From</label>
            <input
              type="date"
              [(ngModel)]="customStart"
              class="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white [color-scheme:dark] focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div class="space-y-1">
            <label class="text-xs font-semibold text-slate-400">To</label>
            <input
              type="date"
              [(ngModel)]="customEnd"
              class="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white [color-scheme:dark] focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button
            (click)="applyCustomRange()"
            class="py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-500/20 transition-all"
          >
            Apply
          </button>
        </div>

        <!-- Loading State -->
        <div *ngIf="loading()" class="py-12 flex justify-center text-indigo-400">
          <div
            class="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"
          ></div>
        </div>

        <!-- Statement Content -->
        <div *ngIf="statement() && !loading()" class="space-y-6">
          <!-- Executive Total Spend Card -->
          <div
            class="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950/60 to-slate-900 text-white p-6 rounded-3xl border border-indigo-500/20 shadow-2xl space-y-3"
          >
            <div
              class="absolute -right-10 -bottom-10 w-44 h-44 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"
            ></div>
            <div>
              <span
                class="text-[10px] font-extrabold tracking-widest uppercase text-indigo-300 bg-indigo-500/15 px-2.5 py-1 rounded-full border border-indigo-500/20 inline-block"
                >{{ statement()?.periodLabel }}</span
              >
            </div>
            <div class="flex justify-between items-end relative z-10">
              <div>
                <p class="text-xs text-slate-400 font-medium">Total Group Spending</p>
                <p class="text-3xl font-black tracking-tight text-white mt-0.5">
                  ₹{{ statement()?.totalSpendDisplay?.toLocaleString('en-IN') }}
                </p>
              </div>
              <div class="text-right text-xs text-slate-400 space-y-0.5 font-medium">
                <p class="text-slate-300 font-semibold">
                  {{ statement()?.expensesCount }} Bills Split
                </p>
                <p>{{ statement()?.settlementsCount }} Settlements</p>
              </div>
            </div>
          </div>

          <!-- Group Balance Ledger -->
          <div
            class="bg-slate-900/60 backdrop-blur-xl p-5 rounded-3xl border border-slate-800/80 shadow-lg space-y-4"
          >
            <h3 class="font-bold text-white text-sm">Group Balance Ledger</h3>
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead>
                  <tr
                    class="border-b border-slate-800 text-slate-400 uppercase font-bold text-[10px] tracking-wider"
                  >
                    <th class="pb-2.5">Group Member</th>
                    <th class="pb-2.5 text-right">Paid</th>
                    <th class="pb-2.5 text-right">Share</th>
                    <th class="pb-2.5 text-right">Net Balance</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/50">
                  <tr *ngFor="let m of statement()?.memberSummaries" class="py-2">
                    <td class="py-3 font-semibold text-slate-200">{{ m.userName }}</td>
                    <td class="py-3 text-right font-medium text-slate-300">
                      ₹{{ m.totalPaidDisplay.toLocaleString('en-IN') }}
                    </td>
                    <td class="py-3 text-right font-medium text-slate-400">
                      ₹{{ m.totalShareDisplay.toLocaleString('en-IN') }}
                    </td>
                    <td
                      class="py-3 text-right font-bold"
                      [class.text-emerald-400]="m.netBalanceDisplay >= 0"
                      [class.text-rose-400]="m.netBalanceDisplay < 0"
                    >
                      {{ m.netBalanceDisplay >= 0 ? '+' : '' }}₹{{
                        m.netBalanceDisplay.toLocaleString('en-IN')
                      }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Category Spending Breakdown -->
          <div
            class="bg-slate-900/60 backdrop-blur-xl p-5 rounded-3xl border border-slate-800/80 shadow-lg space-y-4"
          >
            <h3 class="font-bold text-white text-sm">Where the Money Went (Categories)</h3>
            <div class="space-y-3.5">
              <div *ngFor="let cat of statement()?.categoryBreakdown" class="space-y-1.5">
                <div class="flex justify-between text-xs font-semibold">
                  <span class="text-slate-300">{{ cat.category }}</span>
                  <span class="text-white font-bold"
                    >₹{{ cat.amountDisplay.toLocaleString('en-IN') }} ({{ cat.percentage }}%)</span
                  >
                </div>
                <div class="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden">
                  <div
                    class="bg-gradient-to-r from-indigo-500 to-indigo-400 h-full rounded-full transition-all duration-500 shadow-sm shadow-indigo-500/50"
                    [style.width.%]="cat.percentage"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
})
export class StatementsComponent implements OnInit {
  period = signal<'current' | 'last' | 'custom'>('current');
  loading = signal<boolean>(false);
  statement = signal<MonthlyStatement | null>(null);
  whatsappLink = signal<string | null>(null);

  customStart = '';
  customEnd = '';

  constructor(
    public api: ApiService,
    public router: Router,
  ) {}

  ngOnInit() {
    this.loadStatement('current');
  }

  loadStatement(p: 'current' | 'last') {
    this.period.set(p);
    this.loading.set(true);

    this.api.getStatement(p).subscribe({
      next: (res) => {
        this.statement.set(res.statement);
        this.whatsappLink.set(res.whatsappLink);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  applyCustomRange() {
    if (!this.customStart || !this.customEnd) return;
    this.loading.set(true);

    this.api.getStatement('custom', this.customStart, this.customEnd).subscribe({
      next: (res) => {
        this.statement.set(res.statement);
        this.whatsappLink.set(res.whatsappLink);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
