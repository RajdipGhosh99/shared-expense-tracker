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
    <div class="min-h-screen bg-slate-50 text-slate-900 pb-16">
      <!-- Navbar -->
      <header class="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 py-3 shadow-xs">
        <div class="max-w-3xl mx-auto flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <button
              (click)="router.navigate(['/dashboard'])"
              class="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <span>←</span>
              <span>Back</span>
            </button>
            <h1 class="text-base font-bold text-slate-900">Monthly Statements</h1>
          </div>
          <a
            *ngIf="whatsappLink()"
            [href]="whatsappLink()"
            target="_blank"
            class="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <span>💬 Share on WhatsApp</span>
          </a>
        </div>
      </header>

      <main class="max-w-3xl mx-auto p-4 space-y-4">
        <!-- Period Filter Tabs -->
        <div class="grid grid-cols-3 p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            (click)="loadStatement('current')"
            [class.bg-white]="period() === 'current'"
            [class.text-slate-900]="period() === 'current'"
            [class.shadow-xs]="period() === 'current'"
            [class.text-slate-600]="period() !== 'current'"
            class="py-2 text-xs font-bold rounded-lg transition-all cursor-pointer"
          >
            Current Month
          </button>
          <button
            (click)="loadStatement('last')"
            [class.bg-white]="period() === 'last'"
            [class.text-slate-900]="period() === 'last'"
            [class.shadow-xs]="period() === 'last'"
            [class.text-slate-600]="period() !== 'last'"
            class="py-2 text-xs font-bold rounded-lg transition-all cursor-pointer"
          >
            Last Month
          </button>
          <button
            (click)="period.set('custom')"
            [class.bg-white]="period() === 'custom'"
            [class.text-slate-900]="period() === 'custom'"
            [class.shadow-xs]="period() === 'custom'"
            [class.text-slate-600]="period() !== 'custom'"
            class="py-2 text-xs font-bold rounded-lg transition-all cursor-pointer"
          >
            Custom Range
          </button>
        </div>

        <!-- Custom Date Range Form -->
        <div
          *ngIf="period() === 'custom'"
          class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs grid grid-cols-3 gap-3 items-end"
        >
          <div class="space-y-1">
            <label class="text-xs font-semibold text-slate-600">From</label>
            <input
              type="date"
              [(ngModel)]="customStart"
              class="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div class="space-y-1">
            <label class="text-xs font-semibold text-slate-600">To</label>
            <input
              type="date"
              [(ngModel)]="customEnd"
              class="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button
            (click)="applyCustomRange()"
            class="py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer"
          >
            Apply
          </button>
        </div>

        <!-- Loading State -->
        <div *ngIf="loading()" class="py-12 flex justify-center text-indigo-600">
          <div
            class="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"
          ></div>
        </div>

        <!-- Statement Content -->
        <div *ngIf="statement() && !loading()" class="space-y-4">
          <!-- Executive Total Spend Card -->
          <div
            class="bg-white text-slate-900 p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3"
          >
            <div>
              <span
                class="text-[10px] font-bold tracking-wider uppercase text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200 inline-block"
                >{{ statement()?.periodLabel }}</span
              >
            </div>
            <div class="flex justify-between items-end">
              <div>
                <p class="text-xs text-slate-500 font-medium">Total Group Spending</p>
                <p class="text-3xl font-black tracking-tight text-slate-900 mt-0.5">
                  ₹{{ statement()?.totalSpendDisplay?.toLocaleString('en-IN') }}
                </p>
              </div>
              <div class="text-right text-xs text-slate-500 space-y-0.5 font-medium">
                <p class="text-slate-800 font-bold">{{ statement()?.expensesCount }} Bills Split</p>
                <p>{{ statement()?.settlementsCount }} Settlements</p>
              </div>
            </div>
          </div>

          <!-- Group Balance Ledger -->
          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 class="font-bold text-slate-900 text-sm">Group Balance Ledger</h3>
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead>
                  <tr
                    class="border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px] tracking-wider"
                  >
                    <th class="pb-2.5">Group Member</th>
                    <th class="pb-2.5 text-right">Paid</th>
                    <th class="pb-2.5 text-right">Share</th>
                    <th class="pb-2.5 text-right">Net Balance</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr *ngFor="let m of statement()?.memberSummaries" class="py-2">
                    <td class="py-3 font-semibold text-slate-800">{{ m.userName }}</td>
                    <td class="py-3 text-right font-medium text-slate-600">
                      ₹{{ m.totalPaidDisplay.toLocaleString('en-IN') }}
                    </td>
                    <td class="py-3 text-right font-medium text-slate-500">
                      ₹{{ m.totalShareDisplay.toLocaleString('en-IN') }}
                    </td>
                    <td
                      class="py-3 text-right font-bold"
                      [class.text-emerald-600]="m.netBalanceDisplay >= 0"
                      [class.text-rose-600]="m.netBalanceDisplay < 0"
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
          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 class="font-bold text-slate-900 text-sm">Where the Money Went (Categories)</h3>
            <div class="space-y-3.5">
              <div *ngFor="let cat of statement()?.categoryBreakdown" class="space-y-1.5">
                <div class="flex justify-between text-xs font-semibold">
                  <span class="text-slate-700">{{ cat.category }}</span>
                  <span class="text-slate-900 font-bold"
                    >₹{{ cat.amountDisplay.toLocaleString('en-IN') }} ({{ cat.percentage }}%)</span
                  >
                </div>
                <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    class="bg-indigo-600 h-full rounded-full transition-all duration-500"
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
