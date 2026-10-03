import { Component, EventEmitter, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service.js';
import {
  DuplicateConflictResponse,
  ExpenseCategory,
  SplitType,
} from '@shared-expense-tracker/shared';

@Component({
  selector: 'app-add-expense-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Mobile Bottom Sheet Backdrop -->
    <div
      class="fixed inset-0 bg-black/80 backdrop-blur-md flex flex-col justify-end z-50 transition-opacity"
    >
      <!-- Click backdrop to close -->
      <div class="flex-1" (click)="close.emit()"></div>

      <!-- Sheet Container -->
      <div
        class="bg-slate-900/95 backdrop-blur-2xl rounded-t-3xl max-w-md w-full mx-auto p-5 pb-8 shadow-2xl border-t border-slate-800 animate-slide-up max-h-[90vh] overflow-y-auto space-y-4 text-slate-100"
      >
        <!-- Mobile Drag Handle -->
        <div class="w-12 h-1 bg-slate-700 rounded-full mx-auto mb-1"></div>

        <!-- Header -->
        <div class="flex justify-between items-center pb-2 border-b border-slate-800/60">
          <div class="flex items-center space-x-2.5">
            <div
              class="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 text-sm font-bold"
            >
              ＋
            </div>
            <div>
              <h3 class="text-base font-black text-white">Add Group Expense</h3>
              <p class="text-[11px] text-slate-400 font-medium">
                Split automatically with active members
              </p>
            </div>
          </div>
          <button
            (click)="close.emit()"
            class="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white font-bold active:scale-90 transition-all border border-slate-700/50"
          >
            ✕
          </button>
        </div>

        <!-- DUPLICATE CONFLICT POPUP (If triggered) -->
        <div
          *ngIf="conflictData()"
          class="p-4 bg-amber-950/40 border border-amber-500/30 rounded-2xl space-y-3"
        >
          <div class="flex items-center space-x-2 text-amber-400 font-bold text-sm">
            <span>⚠️ Duplicate Payment Detected</span>
          </div>
          <p class="text-xs text-amber-200/90 leading-relaxed">{{ conflictData()?.message }}</p>

          <!-- Linked ID Card -->
          <div class="bg-slate-950/70 p-3 rounded-xl border border-amber-500/20 text-xs space-y-1">
            <div class="flex justify-between items-center">
              <span class="font-bold text-slate-300">Existing Record:</span>
              <span
                class="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 font-mono font-bold rounded border border-indigo-500/30"
              >
                #{{ conflictData()?.existingRecord?.id }}
              </span>
            </div>
            <p>
              <span class="text-slate-400">Title:</span> {{ conflictData()?.existingRecord?.title }}
            </p>
            <p>
              <span class="text-slate-400">Amount:</span> ₹{{
                conflictData()?.existingRecord?.amountDisplay
              }}
            </p>
            <p *ngIf="conflictData()?.existingRecord?.sheetUrl">
              <a
                [href]="conflictData()?.existingRecord?.sheetUrl"
                target="_blank"
                class="text-indigo-400 hover:text-indigo-300 font-medium underline"
              >
                View in Google Sheet ↗
              </a>
            </p>
          </div>

          <div class="grid grid-cols-2 gap-2 pt-1">
            <button
              (click)="conflictData.set(null)"
              class="py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-xs font-semibold text-slate-300 hover:text-white active:scale-95 transition-transform"
            >
              Cancel
            </button>
            <button
              (click)="submitWithOverwrite()"
              class="py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md shadow-amber-600/30 active:scale-95 transition-transform"
            >
              Overwrite #{{ conflictData()?.existingRecord?.id }}
            </button>
          </div>
        </div>

        <!-- Main Form -->
        <form *ngIf="!conflictData()" (ngSubmit)="submit()" class="space-y-4">
          <!-- Big Mobile Amount Input -->
          <div
            class="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 text-center space-y-1 focus-within:border-indigo-500/60 focus-within:ring-1 focus-within:ring-indigo-500/30 transition-all"
          >
            <label class="text-[11px] font-bold text-slate-400 uppercase tracking-wider"
              >Amount</label
            >
            <div class="flex items-center justify-center text-white font-black text-3xl">
              <span class="text-indigo-400 mr-1.5 text-2xl font-bold">₹</span>
              <input
                type="number"
                step="0.01"
                [(ngModel)]="amount"
                name="amount"
                required
                placeholder="0.00"
                class="w-48 bg-transparent text-center font-black focus:outline-none placeholder-slate-600"
              />
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-300">What is this for?</label>
            <input
              type="text"
              [(ngModel)]="title"
              name="title"
              required
              placeholder="e.g. Blinkit Groceries, Wi-Fi"
              class="w-full px-4 py-3 rounded-xl border border-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-slate-950/70 text-white placeholder-slate-500 transition-all"
            />
          </div>

          <!-- Mandatory Date Input -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>Date</span>
              <span
                class="text-[10px] text-rose-400 font-extrabold tracking-wider bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20"
                >* Mandatory</span
              >
            </label>
            <input
              type="date"
              [(ngModel)]="date"
              name="date"
              required
              class="w-full px-4 py-2.5 rounded-xl border border-slate-800 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-slate-950/70 text-white [color-scheme:dark] transition-all"
            />
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-slate-300">Category</label>
              <select
                [(ngModel)]="category"
                name="category"
                class="w-full px-3 py-2.5 rounded-xl border border-slate-800 text-xs font-medium focus:outline-none focus:border-indigo-500 bg-slate-950/70 text-white [color-scheme:dark] transition-all"
              >
                <option value="Groceries">🛒 Groceries</option>
                <option value="Rent">🏠 Rent</option>
                <option value="Electricity">⚡ Electricity</option>
                <option value="Wi-Fi">🌐 Wi-Fi</option>
                <option value="Maid & Cook">🧹 Maid & Cook</option>
                <option value="Drinking Water">💧 Water</option>
                <option value="Household">🧼 Household</option>
                <option value="Food & Dining">🍕 Food</option>
                <option value="Other">📦 Other</option>
              </select>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold text-slate-300">Split Method</label>
              <select
                [(ngModel)]="splitType"
                name="splitType"
                class="w-full px-3 py-2.5 rounded-xl border border-slate-800 text-xs font-medium focus:outline-none focus:border-indigo-500 bg-slate-950/70 text-white [color-scheme:dark] transition-all"
              >
                <option value="EQUAL">Equal Split</option>
                <option value="EXACT">Exact Amounts</option>
                <option value="PERCENTAGE">Percentages</option>
              </select>
            </div>
          </div>

          <!-- Optional UTR Number -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-300">UPI Ref / UTR (Optional)</label>
            <input
              type="text"
              [(ngModel)]="utrNumber"
              name="utrNumber"
              placeholder="12-digit transaction ID"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-800 text-xs font-mono focus:outline-none focus:border-indigo-500 bg-slate-950/70 text-slate-200 placeholder-slate-500 transition-all"
            />
          </div>

          <!-- Split Preview -->
          <div
            *ngIf="amount && amount > 0 && splitType === 'EQUAL'"
            class="p-3 bg-indigo-950/40 rounded-xl border border-indigo-500/30 text-xs text-indigo-300 flex items-center justify-between"
          >
            <span class="font-medium">Each Group Member Pays:</span>
            <span class="font-black text-indigo-400 text-sm"
              >₹{{ (amount / (api.members().length || 1)).toFixed(2) }}</span
            >
          </div>

          <!-- Error Alert -->
          <div
            *ngIf="errorMessage()"
            class="p-3 bg-rose-950/50 text-rose-300 rounded-xl text-xs font-medium border border-rose-500/30"
          >
            {{ errorMessage() }}
          </div>

          <button
            type="submit"
            [disabled]="loading()"
            class="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 active:scale-98 transition-all text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 text-sm"
          >
            {{ loading() ? 'Saving Expense...' : 'Save & Split Bill' }}
          </button>
        </form>
      </div>
    </div>
  `,
})
export class AddExpenseModalComponent {
  @Output() close = new EventEmitter<void>();

  title = '';
  amount: number | null = null;
  date: string = new Date().toISOString().split('T')[0];
  category: ExpenseCategory = 'Groceries';
  splitType: SplitType = 'EQUAL';
  utrNumber = '';

  loading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  conflictData = signal<DuplicateConflictResponse | null>(null);

  constructor(public api: ApiService) {}

  submit() {
    if (!this.title || !this.amount || !this.date) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    this.api
      .addExpense({
        title: this.title,
        amount: this.amount,
        date: this.date,
        category: this.category,
        splitType: this.splitType,
        utrNumber: this.utrNumber ? this.utrNumber.trim() : undefined,
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.close.emit();
        },
        error: (err) => {
          this.loading.set(false);
          if (err.status === 409 && err.error?.status === 'DUPLICATE_DETECTED') {
            this.conflictData.set(err.error);
          } else {
            this.errorMessage.set(err.error?.error || 'Failed to add expense.');
          }
        },
      });
  }

  submitWithOverwrite() {
    const conflict = this.conflictData();
    if (!conflict) return;

    this.loading.set(true);
    this.api
      .addExpense({
        title: this.title,
        amount: this.amount!,
        date: this.date,
        category: this.category,
        splitType: this.splitType,
        utrNumber: this.utrNumber ? this.utrNumber.trim() : undefined,
        allowOverwrite: true,
        overwriteTargetId: conflict.existingRecord.id,
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.close.emit();
        },
        error: (err) => {
          this.loading.set(false);
          this.errorMessage.set(err.error?.error || 'Failed to overwrite expense.');
        },
      });
  }
}
