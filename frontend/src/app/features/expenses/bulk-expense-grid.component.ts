import { Component, EventEmitter, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service.js';
import { AiCategoryService } from '../../core/services/ai-category.service.js';
import { ExpenseCategory, SplitType } from '@shared-expense-tracker/shared';

export interface GridRow {
  id: number;
  date: string;
  title: string;
  category: ExpenseCategory;
  amount: number | null;
  splitType: SplitType;
}

@Component({
  selector: 'app-bulk-expense-grid',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Backdrop -->
    <div
      class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex flex-col justify-end sm:justify-center z-50 p-0 sm:p-4 overflow-y-auto"
    >
      <div class="flex-1 sm:hidden" (click)="close.emit()"></div>

      <!-- Container -->
      <div
        class="bg-white rounded-t-3xl sm:rounded-2xl max-w-4xl w-full mx-auto shadow-2xl border border-slate-200 animate-slide-up flex flex-col max-h-[92vh] text-slate-900"
      >
        <!-- Modal Header: Mobile-First Responsive Toolbar -->
        <div
          class="px-3.5 py-2.5 sm:px-5 sm:py-3 border-b border-slate-200/90 flex flex-col gap-2 bg-slate-50/95 rounded-t-3xl sm:rounded-t-2xl"
        >
          <!-- Top Row: Title, Badge, and Close Button -->
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2.5 min-w-0">
              <div
                class="size-7 sm:size-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold shadow-2xs shrink-0"
              >
                <!-- Spreadsheet Grid Icon -->
                <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 10h18M3 14h18m-9-4v8m-7 4h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div class="min-w-0">
                <div class="flex items-center gap-1.5">
                  <h3 class="text-xs sm:text-sm font-black text-slate-900 truncate">
                    Spreadsheet Bulk Entry
                  </h3>
                  <span
                    class="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-wider shrink-0"
                  >
                    Sheet
                  </span>
                </div>
                <p class="text-[10px] text-slate-400 truncate hidden sm:block">
                  Tab or tap cells to edit • Auto-calculates totals & splits
                </p>
              </div>
            </div>

            <!-- Close Modal Button -->
            <button
              type="button"
              (click)="close.emit()"
              class="size-8 rounded-xl hover:bg-slate-200 active:bg-slate-300 text-slate-400 hover:text-slate-800 font-bold flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title="Close modal"
            >
              ✕
            </button>
          </div>

          <!-- Bottom Row: Quick Action Toolbar (Pill Buttons) -->
          <div class="flex items-center justify-between gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            <div class="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                (click)="addRow()"
                class="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-xs font-bold text-white flex items-center space-x-1 transition-all cursor-pointer shadow-2xs"
              >
                <span>＋</span>
                <span>Add Row</span>
              </button>
              <button
                type="button"
                (click)="showPasteModal.set(!showPasteModal())"
                class="px-2.5 py-1.5 rounded-xl border border-slate-300/80 bg-white hover:bg-slate-100 active:scale-95 text-xs font-semibold text-slate-700 flex items-center space-x-1 transition-all cursor-pointer shadow-2xs"
                title="Paste copied rows directly from spreadsheet or Excel"
              >
                <span>📋</span>
                <span>Paste Rows</span>
              </button>
              <button
                type="button"
                (click)="openSingle.emit()"
                class="px-2.5 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 active:scale-95 text-xs font-semibold text-indigo-700 flex items-center space-x-1 transition-all cursor-pointer shadow-2xs"
                title="Switch to single bill entry"
              >
                <span>💳</span>
                <span>Single Bill</span>
              </button>
            </div>

            <button
              type="button"
              (click)="clearEmptyRows()"
              class="text-slate-400 hover:text-slate-600 text-[10px] sm:text-xs font-medium cursor-pointer shrink-0 hover:underline px-1"
            >
              Clear empty
            </button>
          </div>
        </div>

        <!-- Paste Drawer (If open) -->
        <div
          *ngIf="showPasteModal()"
          class="p-3 sm:p-4 bg-emerald-50/70 border-b border-emerald-200 space-y-2"
        >
          <div class="flex justify-between items-center text-xs font-bold text-emerald-900">
            <span>📋 Paste Tab-Separated Rows from Excel / Sheets</span>
            <span class="text-[10px] sm:text-[11px] font-normal text-emerald-700 hidden sm:inline"
              >Format: Date [tab] Title [tab] Amount [tab] Category</span
            >
          </div>
          <textarea
            [(ngModel)]="pasteText"
            rows="3"
            placeholder="2026-10-03	Blinkit Milk & Eggs	350	Food & Dining
2026-10-03	Electricity Bill	1820	Bills & Utilities"
            class="w-full p-2.5 bg-white border border-emerald-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
          ></textarea>
          <div class="flex justify-end space-x-2">
            <button
              type="button"
              (click)="showPasteModal.set(false)"
              class="px-3 py-1 bg-white border border-slate-300 rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="button"
              (click)="importPastedText()"
              class="px-3 py-1 bg-emerald-600 text-white rounded-md text-xs font-bold shadow-xs hover:bg-emerald-700"
            >
              Parse & Add to Sheet
            </button>
          </div>
        </div>

        <!-- Formula Bar / Status Bar (Authentic Spreadsheet Look) -->
        <div class="px-3 py-1.5 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between text-[11px] text-slate-600 font-mono select-none">
          <div class="flex items-center space-x-2">
            <span class="font-bold text-emerald-800 px-1.5 py-0.2 bg-emerald-100 rounded text-[10px]">fx</span>
            <span class="text-slate-500">ROWS: {{ rows.length }}</span>
            <span class="text-slate-300">|</span>
            <span class="text-emerald-700 font-bold">VALID: {{ validRowCount() }}</span>
          </div>
          <div class="text-[10px] text-slate-400 sm:block hidden">
            Scroll horizontally to view all columns
          </div>
        </div>

        <!-- Authentic Mobile & Desktop Spreadsheet Grid Container -->
        <div class="flex-1 overflow-x-auto overflow-y-auto max-h-[60vh] bg-slate-50/50">
          <table class="w-full text-left text-xs border-collapse border-slate-200">
            <!-- Spreadsheet Column Headers (A, B, C, D, E) -->
            <thead class="sticky top-0 z-20 bg-slate-100">
              <tr class="border-b border-slate-300 text-slate-600 font-bold uppercase text-[10px] tracking-wider select-none">
                <!-- Row Header Indicator (Excel/Sheets Column Index) -->
                <th class="py-2 px-2 w-9 text-center bg-slate-200/90 border-r border-slate-300 sticky left-0 z-30 font-mono text-slate-500 text-[10px]">
                  #
                </th>
                <!-- Column A: Date -->
                <th class="py-2 px-2.5 min-w-[125px] border-r border-slate-200 bg-slate-100">
                  <div class="flex items-center justify-between">
                    <span>Date <span class="text-rose-500">*</span></span>
                    <span class="text-[9px] text-slate-400 font-mono font-normal">A</span>
                  </div>
                </th>
                <!-- Column B: Title -->
                <th class="py-2 px-2.5 min-w-[190px] border-r border-slate-200 bg-slate-100">
                  <div class="flex items-center justify-between">
                    <span>Description / Title <span class="text-rose-500">*</span></span>
                    <span class="text-[9px] text-slate-400 font-mono font-normal">B</span>
                  </div>
                </th>
                <!-- Column C: Category -->
                <th class="py-2 px-2.5 min-w-[155px] border-r border-slate-200 bg-slate-100">
                  <div class="flex items-center justify-between">
                    <span>Category <span class="text-[9px] text-indigo-600 font-bold">✨ AI</span></span>
                    <span class="text-[9px] text-slate-400 font-mono font-normal">C</span>
                  </div>
                </th>
                <!-- Column D: Amount -->
                <th class="py-2 px-2.5 min-w-[115px] border-r border-slate-200 bg-slate-100">
                  <div class="flex items-center justify-between">
                    <span>Amount (₹) <span class="text-rose-500">*</span></span>
                    <span class="text-[9px] text-slate-400 font-mono font-normal">D</span>
                  </div>
                </th>
                <!-- Column E: Split -->
                <th class="py-2 px-2.5 min-w-[105px] border-r border-slate-200 bg-slate-100">
                  <div class="flex items-center justify-between">
                    <span>Split Method</span>
                    <span class="text-[9px] text-slate-400 font-mono font-normal">E</span>
                  </div>
                </th>
                <!-- Column F: Actions -->
                <th class="py-2 px-1.5 w-10 text-center bg-slate-100"></th>
              </tr>
            </thead>

            <!-- Spreadsheet Grid Cells with Grid Lines -->
            <tbody class="divide-y divide-slate-200 bg-white">
              <tr
                *ngFor="let row of rows; let idx = index"
                class="hover:bg-indigo-50/30 transition-colors group"
                [class.bg-emerald-50/30]="isRowValid(row)"
              >
                <!-- Sticky Row Number (# 1, 2, 3...) -->
                <td
                  class="py-1 px-1 text-center bg-slate-100 group-hover:bg-slate-200/90 font-mono text-[11px] font-bold text-slate-500 border-r border-slate-300 sticky left-0 z-10 select-none"
                  [class.text-emerald-700]="isRowValid(row)"
                >
                  <span *ngIf="isRowValid(row)" class="text-[9px] text-emerald-600 block">✓</span>
                  {{ idx + 1 }}
                </td>

                <!-- Cell A: Date -->
                <td class="p-1 border-r border-slate-200">
                  <input
                    type="date"
                    [(ngModel)]="row.date"
                    required
                    class="w-full px-2 py-1.5 border border-transparent focus:border-indigo-500 rounded text-xs bg-transparent focus:bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium font-mono"
                  />
                </td>

                <!-- Cell B: Description / Title -->
                <td class="p-1 border-r border-slate-200">
                  <input
                    type="text"
                    [(ngModel)]="row.title"
                    (ngModelChange)="onRowTitleChange(idx, $event)"
                    placeholder="e.g. Blinkit, WiFi, Swiggy"
                    class="w-full px-2.5 py-1.5 border border-transparent focus:border-indigo-500 rounded text-xs bg-transparent focus:bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                  />
                </td>

                <!-- Cell C: Category -->
                <td class="p-1 border-r border-slate-200">
                  <select
                    [(ngModel)]="row.category"
                    class="w-full px-2 py-1.5 border border-transparent focus:border-indigo-500 rounded text-xs bg-transparent focus:bg-white text-slate-800 focus:outline-none font-medium cursor-pointer"
                  >
                    <option value="Food & Dining">🍔 Food & Dining</option>
                    <option value="Bills & Utilities">⚡ Bills & Utilities</option>
                    <option value="Transit & Travel">🚗 Transit & Travel</option>
                    <option value="Shopping & Lifestyle">🛍️ Shopping & Lifestyle</option>
                    <option value="Entertainment & Leisure">🎬 Entertainment & Leisure</option>
                    <option value="Health & Wellness">💊 Health & Wellness</option>
                    <option value="Education & Work">📚 Education & Work</option>
                    <option value="Transfers & Adjustments">🔄 Transfers & Adjustments</option>
                    <option value="Other">📦 Other</option>
                  </select>
                </td>

                <!-- Cell D: Amount (₹) -->
                <td class="p-1 border-r border-slate-200">
                  <div class="relative">
                    <span class="absolute left-2 top-1.5 text-slate-400 text-xs font-semibold">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      [(ngModel)]="row.amount"
                      placeholder="0.00"
                      class="w-full pl-5 pr-2 py-1.5 border border-transparent focus:border-indigo-500 rounded text-xs bg-transparent focus:bg-white text-slate-900 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-right"
                    />
                  </div>
                </td>

                <!-- Cell E: Split Method -->
                <td class="p-1 border-r border-slate-200">
                  <select
                    [(ngModel)]="row.splitType"
                    (keydown.tab)="onLastCellTab(idx)"
                    class="w-full px-2 py-1.5 border border-transparent focus:border-indigo-500 rounded text-xs bg-transparent focus:bg-white text-slate-800 focus:outline-none font-medium cursor-pointer"
                  >
                    <option value="EQUAL">Equal</option>
                    <option value="EXACT">Exact</option>
                    <option value="PERCENTAGE">% Split</option>
                  </select>
                </td>

                <!-- Cell F: Delete Row Action -->
                <td class="p-1 text-center">
                  <button
                    type="button"
                    (click)="removeRow(idx)"
                    [disabled]="rows.length <= 1"
                    class="text-slate-400 hover:text-rose-600 disabled:opacity-20 p-1 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Delete row"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Footer / Live Calculation & Batch Save -->
        <div
          class="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-b-3xl sm:rounded-b-2xl"
        >
          <!-- Summary Metrics -->
          <div class="flex items-center space-x-4 text-xs">
            <div>
              <span class="text-slate-500">Valid entries:</span>
              <span class="font-bold text-slate-900 ml-1">{{ validRowCount() }}</span>
            </div>
            <div class="h-4 w-px bg-slate-300"></div>
            <div>
              <span class="text-slate-500">Total:</span>
              <span class="font-black text-indigo-700 text-sm ml-1"
                >₹{{ totalAmount().toLocaleString('en-IN', { minimumFractionDigits: 2 }) }}</span
              >
            </div>
            <div class="h-4 w-px bg-slate-300 hidden sm:block"></div>
            <div class="hidden sm:block text-slate-500">
              Each member:
              <span class="font-bold text-slate-800"
                >₹{{ perMemberShare().toLocaleString('en-IN', { minimumFractionDigits: 2 }) }}</span
              >
            </div>
          </div>

          <!-- Save Actions -->
          <div class="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              (click)="close.emit()"
              class="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              (click)="saveBatch()"
              [disabled]="loading() || validRowCount() === 0"
              class="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center space-x-2 cursor-pointer"
            >
              <span
                *ngIf="loading()"
                class="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full"
              ></span>
              <span>{{
                loading()
                  ? 'Saving bills...'
                  : 'Save ' + validRowCount() + ' Bills to Group'
              }}</span>
            </button>
          </div>
        </div>

        <!-- Error Notification -->
        <div
          *ngIf="errorMessage()"
          class="p-3 bg-rose-50 border-t border-rose-200 text-rose-700 text-xs font-semibold px-5"
        >
          {{ errorMessage() }}
        </div>
      </div>
    </div>
  `,
})
export class BulkExpenseGridComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Output() openSingle = new EventEmitter<void>();

  rows: GridRow[] = [];
  nextId = 1;
  loading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  showPasteModal = signal<boolean>(false);
  pasteText = '';

  constructor(
    public api: ApiService,
    private aiService: AiCategoryService,
  ) {}

  onRowTitleChange(index: number, newTitle: string) {
    if (!newTitle || !newTitle.trim()) return;
    const pred = this.aiService.predict(newTitle);
    if (pred && pred.matchedKeyword) {
      this.rows[index].category = pred.category;
    }
  }

  ngOnInit() {
    // Initialize with 4 blank rows ready to type
    const today = new Date().toISOString().split('T')[0];
    this.rows = [
      {
        id: this.nextId++,
        date: today,
        title: '',
        category: 'Food & Dining',
        amount: null,
        splitType: 'EQUAL',
      },
      {
        id: this.nextId++,
        date: today,
        title: '',
        category: 'Bills & Utilities',
        amount: null,
        splitType: 'EQUAL',
      },
      {
        id: this.nextId++,
        date: today,
        title: '',
        category: 'Transit & Travel',
        amount: null,
        splitType: 'EQUAL',
      },
      {
        id: this.nextId++,
        date: today,
        title: '',
        category: 'Shopping & E-Commerce',
        amount: null,
        splitType: 'EQUAL',
      },
    ];
  }

  addRow() {
    const today = new Date().toISOString().split('T')[0];
    this.rows.push({
      id: this.nextId++,
      date: today,
      title: '',
      category: 'Food & Dining',
      amount: null,
      splitType: 'EQUAL',
    });
  }

  removeRow(index: number) {
    if (this.rows.length > 1) {
      this.rows.splice(index, 1);
    }
  }

  onLastCellTab(index: number) {
    if (index === this.rows.length - 1) {
      // Auto-append new row when user tabs on the last field of the last row
      this.addRow();
    }
  }

  isRowValid(row: GridRow): boolean {
    return Boolean(row.title?.trim() && row.amount && row.amount > 0 && row.date);
  }

  validRowCount(): number {
    return this.rows.filter((r) => this.isRowValid(r)).length;
  }

  totalAmount(): number {
    return this.rows.reduce((sum, r) => (this.isRowValid(r) ? sum + (r.amount || 0) : sum), 0);
  }

  perMemberShare(): number {
    const memberCount = this.api.members().length || 1;
    return this.totalAmount() / memberCount;
  }

  clearEmptyRows() {
    const valid = this.rows.filter((r) => this.isRowValid(r));
    if (valid.length === 0) {
      this.ngOnInit();
    } else {
      this.rows = valid;
    }
  }

  importPastedText() {
    if (!this.pasteText.trim()) return;

    const lines = this.pasteText.trim().split('\n');
    const today = new Date().toISOString().split('T')[0];

    const parsedRows: GridRow[] = [];
    for (const line of lines) {
      const parts = line.split('\t').map((p: string) => p.trim());
      if (parts.length === 0 || !parts[0]) continue;

      let date = today;
      let title = '';
      let amount: number | null = null;
      let category: ExpenseCategory = 'Food & Dining';

      // Smart column detection
      if (parts[0].match(/^\d{4}-\d{2}-\d{2}$/)) {
        date = parts[0];
        title = parts[1] || '';
        amount = parts[2] ? parseFloat(parts[2].replace(/[₹,]/g, '')) : null;
        if (parts[3]) category = (parts[3] as ExpenseCategory) || 'Food & Dining';
      } else {
        title = parts[0];
        amount = parts[1] ? parseFloat(parts[1].replace(/[₹,]/g, '')) : null;
        if (parts[2]) category = (parts[2] as ExpenseCategory) || 'Food & Dining';
      }

      parsedRows.push({
        id: this.nextId++,
        date,
        title,
        category,
        amount: isNaN(amount as number) ? null : amount,
        splitType: 'EQUAL',
      });
    }

    if (parsedRows.length > 0) {
      // If existing rows were all empty, replace; else append
      if (this.validRowCount() === 0) {
        this.rows = parsedRows;
      } else {
        this.rows.push(...parsedRows);
      }
      this.pasteText = '';
      this.showPasteModal.set(false);
    }
  }

  saveBatch() {
    const validRows = this.rows.filter((r) => this.isRowValid(r));
    if (validRows.length === 0) {
      this.errorMessage.set(
        'Please fill in at least one valid expense row with Title, Date, and Amount.',
      );
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const items = validRows.map((r) => ({
      title: r.title.trim(),
      amount: r.amount!,
      date: r.date,
      category: r.category,
      isExpense:
        r.category !== 'Transfers & Adjustments' && r.category !== 'Transfers & Settlements',
      splitType: r.splitType,
    }));

    this.api.addExpensesBatch(items).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.close.emit();
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.error || 'Failed to save batch expenses.');
      },
    });
  }
}
