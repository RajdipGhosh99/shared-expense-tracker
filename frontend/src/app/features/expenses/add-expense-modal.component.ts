import { Component, EventEmitter, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service.js';
import { AiCategoryService, AiPrediction } from '../../core/services/ai-category.service.js';
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
      class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex flex-col justify-end z-50 transition-opacity"
    >
      <!-- Click backdrop to close -->
      <div class="flex-1" (click)="close.emit()"></div>

      <!-- Sheet Container -->
      <div
        class="bg-white rounded-t-3xl max-w-md w-full mx-auto p-5 pb-8 shadow-2xl border-t border-slate-200 animate-slide-up max-h-[90vh] overflow-y-auto space-y-4 text-slate-900"
      >
        <!-- Mobile Drag Handle -->
        <div class="w-12 h-1 bg-slate-300 rounded-full mx-auto mb-1"></div>

        <!-- Modal Header with Integrated Bulk Entry Action -->
        <div class="flex justify-between items-center pb-3 border-b border-slate-100">
          <div class="flex items-center space-x-2.5">
            <div
              class="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs text-sm font-bold flex-shrink-0"
            >
              ＋
            </div>
            <div>
              <h3 class="text-base font-bold text-slate-900 leading-tight">Add Group Expense</h3>
              <p class="text-[11px] text-slate-400 font-medium">
                Split automatically with active members
              </p>
            </div>
          </div>

          <div class="flex items-center space-x-2">
            <!-- Integrated Bulk Entry Button in Header -->
            <button
              type="button"
              (click)="openBulk.emit()"
              class="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 active:scale-95 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer shadow-2xs"
              title="Switch to Google Sheet multiple bills entry"
            >
              <span>📊</span>
              <span>Bulk Entry</span>
            </button>

            <!-- Close Button -->
            <button
              type="button"
              (click)="close.emit()"
              class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 font-bold active:scale-90 transition-all cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        <!-- DUPLICATE CONFLICT POPUP (If triggered) -->
        <div
          *ngIf="conflictData()"
          class="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3"
        >
          <div class="flex items-center space-x-2 text-amber-800 font-bold text-sm">
            <span>⚠️ Duplicate Payment Detected</span>
          </div>
          <p class="text-xs text-amber-900 leading-relaxed">{{ conflictData()?.message }}</p>

          <!-- Linked ID Card -->
          <div class="bg-white p-3 rounded-xl border border-amber-200 text-xs space-y-1 shadow-xs">
            <div class="flex justify-between items-center">
              <span class="font-bold text-slate-700">Existing Record:</span>
              <span
                class="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-mono font-bold rounded border border-indigo-200"
              >
                #{{ conflictData()?.existingRecord?.id }}
              </span>
            </div>
            <p>
              <span class="text-slate-500">Title:</span> {{ conflictData()?.existingRecord?.title }}
            </p>
            <p>
              <span class="text-slate-500">Amount:</span> ₹{{
                conflictData()?.existingRecord?.amountDisplay
              }}
            </p>
            <p *ngIf="conflictData()?.existingRecord?.sheetUrl">
              <a
                [href]="conflictData()?.existingRecord?.sheetUrl"
                target="_blank"
                class="text-indigo-600 hover:text-indigo-800 font-medium underline"
              >
                View in Google Sheet ↗
              </a>
            </p>
          </div>

          <div class="grid grid-cols-2 gap-2 pt-1">
            <button
              (click)="conflictData.set(null)"
              class="py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 active:scale-95 transition-transform"
            >
              Cancel
            </button>
            <button
              (click)="submitWithOverwrite()"
              class="py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-transform"
            >
              Overwrite #{{ conflictData()?.existingRecord?.id }}
            </button>
          </div>
        </div>

        <!-- Main Form -->
        <form *ngIf="!conflictData()" (ngSubmit)="submit()" class="space-y-4">
          <!-- Big Mobile Amount Input -->
          <div
            class="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center space-y-1 focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-1 focus-within:ring-indigo-500 transition-all"
          >
            <label class="text-[11px] font-bold text-slate-500 uppercase tracking-wider"
              >Amount</label
            >
            <div class="flex items-center justify-center text-slate-900 font-black text-3xl">
              <span class="text-slate-400 mr-1.5 text-2xl font-bold">₹</span>
              <input
                type="number"
                step="0.01"
                [(ngModel)]="amount"
                name="amount"
                required
                placeholder="0.00"
                class="w-48 bg-transparent text-center font-black focus:outline-none placeholder-slate-300"
              />
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-700">What is this for?</label>
            <input
              type="text"
              [(ngModel)]="title"
              (ngModelChange)="onTitleChange($event)"
              name="title"
              required
              placeholder="e.g. Blinkit Groceries, Wi-Fi, Swiggy dinner"
              class="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white text-slate-900 placeholder-slate-400 transition-all"
            />
            <!-- Real-time AI Suggested Category Badge -->
            <div
              *ngIf="aiSuggestion() && aiSuggestion()?.matchedKeyword"
              class="flex items-center space-x-2 pt-0.5"
            >
              <div
                class="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold shadow-2xs animate-fade-in"
              >
                <span>✨ AI Suggested:</span>
                <span class="font-bold text-indigo-900">{{ aiSuggestion()?.category }}</span>
                <span class="text-[10px] text-indigo-500 font-normal">
                  ({{
                    aiSuggestion()?.matchReason ||
                      'Matched "' + aiSuggestion()?.matchedKeyword + '"'
                  }})
                </span>
              </div>
            </div>
          </div>

          <!-- Mandatory Date Input -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Date</span>
              <span
                class="text-[10px] text-rose-600 font-extrabold tracking-wider bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200"
                >* Mandatory</span
              >
            </label>
            <input
              type="date"
              [(ngModel)]="date"
              name="date"
              required
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white text-slate-900 transition-all"
            />
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-slate-700">Category</label>
              <select
                [(ngModel)]="category"
                name="category"
                class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-indigo-500 bg-white text-slate-800 transition-all"
              >
                <option value="Food & Dining">🍔 Food & Dining</option>
                <option value="Bills & Utilities">⚡ Bills & Utilities</option>
                <option value="Transit & Travel">🚗 Transit & Travel</option>
                <option value="Shopping & E-Commerce">🛍️ Shopping & E-Commerce</option>
                <option value="Entertainment & Leisure">🎬 Entertainment & Leisure</option>
                <option value="Health & Well-being">💊 Health & Well-being</option>
                <option value="Education & Career">📚 Education & Career</option>
                <option value="Transfers & Settlements">🔄 Transfers & Settlements</option>
              </select>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold text-slate-700">Split Method</label>
              <select
                [(ngModel)]="splitType"
                name="splitType"
                class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-indigo-500 bg-white text-slate-800 transition-all"
              >
                <option value="EQUAL">Equal Split</option>
                <option value="EXACT">Exact Amounts</option>
                <option value="PERCENTAGE">Percentages</option>
              </select>
            </div>
          </div>

          <!-- Optional UTR Number -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-700">UPI Ref / UTR (Optional)</label>
            <input
              type="text"
              [(ngModel)]="utrNumber"
              name="utrNumber"
              placeholder="12-digit transaction ID"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:border-indigo-500 bg-white text-slate-800 placeholder-slate-400 transition-all"
            />
          </div>

          <!-- Split Preview -->
          <div
            *ngIf="amount && amount > 0 && splitType === 'EQUAL'"
            class="p-3 bg-indigo-50 rounded-xl border border-indigo-100 text-xs text-indigo-900 flex items-center justify-between"
          >
            <span class="font-medium text-slate-600">Each Group Member Pays:</span>
            <span class="font-black text-indigo-700 text-sm"
              >₹{{ (amount / (api.members().length || 1)).toFixed(2) }}</span
            >
          </div>

          <!-- Error Alert -->
          <div
            *ngIf="errorMessage()"
            class="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs font-medium border border-rose-200"
          >
            {{ errorMessage() }}
          </div>

          <button
            type="submit"
            [disabled]="loading()"
            class="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-98 transition-all text-white font-bold rounded-xl shadow-xs text-sm cursor-pointer"
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
  @Output() openBulk = new EventEmitter<void>();

  title = '';
  amount: number | null = null;
  date: string = new Date().toISOString().split('T')[0];
  category: ExpenseCategory = 'Food & Dining';
  splitType: SplitType = 'EQUAL';
  utrNumber = '';

  loading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  conflictData = signal<DuplicateConflictResponse | null>(null);
  aiSuggestion = signal<AiPrediction | null>(null);

  constructor(
    public api: ApiService,
    private aiCategoryService: AiCategoryService,
  ) {}

  onTitleChange(newTitle: string) {
    if (!newTitle || !newTitle.trim()) {
      this.aiSuggestion.set(null);
      return;
    }

    const prediction = this.aiCategoryService.predict(newTitle);
    if (prediction && prediction.matchedKeyword) {
      this.aiSuggestion.set(prediction);
      this.category = prediction.category;
    } else {
      this.aiSuggestion.set(null);
    }
  }

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
