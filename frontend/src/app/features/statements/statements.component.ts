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
    <div class="min-h-screen max-w-md sm:max-w-lg md:max-w-2xl mx-auto bg-slate-50 text-slate-900 pb-28 border-x border-slate-200/80 font-sans flex flex-col shadow-xs">
      <!-- Navbar -->
      <header class="bg-white/95 backdrop-blur-xl border-b border-slate-200/90 sticky top-0 z-30 px-3 shadow-2xs">
        <div class="flex items-center justify-between h-11">
          <div class="flex items-center space-x-2">
            <button
              (click)="router.navigate(['/dashboard'])"
              class="size-9 rounded-2xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 flex items-center justify-center font-black text-sm border border-slate-200/80 shadow-2xs transition-all active:scale-95 cursor-pointer"
            >
              <span>←</span>
            </button>
            <h1 class="text-sm font-black text-slate-900 tracking-tight">Monthly Statements</h1>
          </div>
          <a
            *ngIf="whatsappLink()"
            [href]="whatsappLink()"
            target="_blank"
            class="size-9 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center text-sm shadow-2xs transition-all active:scale-95 cursor-pointer"
            title="Share on WhatsApp"
          >
            <span>💬</span>
          </a>
        </div>
      </header>

      <main class="flex-1 p-3.5 space-y-4">
        <!-- Period Filter Tabs -->
        <div class="grid grid-cols-3 p-1 bg-slate-200/80 rounded-2xl border border-slate-200 text-xs font-black shadow-inner">
          <button
            (click)="loadStatement('current')"
            [class.bg-white]="period() === 'current'"
            [class.text-slate-900]="period() === 'current'"
            [class.shadow-xs]="period() === 'current'"
            [class.text-slate-600]="period() !== 'current'"
            class="py-2 rounded-xl transition-all cursor-pointer text-center active:scale-98"
          >
            Current Month
          </button>
          <button
            (click)="loadStatement('last')"
            [class.bg-white]="period() === 'last'"
            [class.text-slate-900]="period() === 'last'"
            [class.shadow-xs]="period() === 'last'"
            [class.text-slate-600]="period() !== 'last'"
            class="py-2 rounded-xl transition-all cursor-pointer text-center active:scale-98"
          >
            Last Month
          </button>
          <button
            (click)="period.set('custom')"
            [class.bg-white]="period() === 'custom'"
            [class.text-slate-900]="period() === 'custom'"
            [class.shadow-xs]="period() === 'custom'"
            [class.text-slate-600]="period() !== 'custom'"
            class="py-2 rounded-xl transition-all cursor-pointer text-center active:scale-98"
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
            <div class="space-y-4">
              <div *ngFor="let cat of statement()?.categoryBreakdown" class="space-y-1.5">
                <div class="flex justify-between text-xs font-semibold">
                  <span class="text-slate-800 font-bold">{{ cat.category }}</span>
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

                <!-- Subcategories Breakdown Chips -->
                <div
                  *ngIf="cat.subcategories && cat.subcategories.length > 0"
                  class="flex flex-wrap gap-1.5 pt-1"
                >
                  <span
                    *ngFor="let sub of cat.subcategories"
                    class="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-200 text-[10px] text-slate-600"
                  >
                    <span class="font-medium text-slate-500">{{ sub.subCategory }}:</span>
                    <span class="font-bold text-slate-800"
                      >₹{{ sub.amountDisplay.toLocaleString('en-IN') }}</span
                    >
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <!-- Bottom Sticky Floating WhatsApp Share Bar -->
      <div
        *ngIf="whatsappLink()"
        class="fixed bottom-0 left-0 right-0 max-w-md sm:max-w-lg md:max-w-2xl mx-auto p-3 bg-white/90 backdrop-blur-md border-t border-slate-200/80 z-20"
      >
        <a
          [href]="whatsappLink()"
          target="_blank"
          class="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-xs rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <span>Share Monthly Summary to WhatsApp</span>
          <span>💬</span>
        </a>
      </div>
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
