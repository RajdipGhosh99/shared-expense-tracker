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
  utrNumber: string;
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
        <!-- Header -->
        <div
          class="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 rounded-t-3xl sm:rounded-t-2xl"
        >
          <div class="flex items-center space-x-3">
            <div
              class="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 10h18M3 14h18m-9-4v8m-7 4h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <div class="flex items-center space-x-2">
                <h3 class="text-sm font-bold text-slate-900">Google Sheet Multiple Entry</h3>
                <span
                  class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200"
                >
                  Bulk Mode
                </span>
              </div>
              <p class="text-xs text-slate-500">
                Log multiple expenses in a spreadsheet grid with auto-split
              </p>
            </div>
          </div>

          <div class="flex items-center space-x-2">
            <button
              type="button"
              (click)="showPasteModal.set(!showPasteModal())"
              class="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
              title="Paste copied rows directly from Google Sheets or Excel"
            >
              <span>📋</span>
              <span class="hidden sm:inline">Paste from Sheet</span>
            </button>
            <button
              type="button"
              (click)="addRow()"
              class="px-2.5 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-xs font-semibold text-indigo-700 flex items-center space-x-1 transition-colors cursor-pointer"
            >
              <span>＋</span>
              <span>Add Row</span>
            </button>
            <button
              type="button"
              (click)="close.emit()"
              class="w-7 h-7 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800 font-bold flex items-center justify-center transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        <!-- Paste Drawer (If open) -->
        <div
          *ngIf="showPasteModal()"
          class="p-4 bg-emerald-50/70 border-b border-emerald-200 space-y-2"
        >
          <div class="flex justify-between items-center text-xs font-bold text-emerald-900">
            <span>📋 Paste Tab-Separated Rows from Google Sheet / Excel</span>
            <span class="text-[11px] font-normal text-emerald-700"
              >Format: Date [tab] Title [tab] Amount [tab] Category</span
            >
          </div>
          <textarea
            [(ngModel)]="pasteText"
            rows="3"
            placeholder="2026-10-03	Blinkit Milk & Eggs	350	Groceries
2026-10-03	Electricity Bill	1820	Electricity"
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
              Parse & Add to Grid
            </button>
          </div>
        </div>

        <!-- Spreadsheet Table Grid -->
        <div class="flex-1 overflow-x-auto overflow-y-auto p-4 max-h-[60vh]">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr
                class="bg-slate-100/90 text-slate-600 font-semibold border-y border-slate-200 uppercase text-[10px] tracking-wider select-none"
              >
                <th class="py-2.5 px-2 w-8 text-center">#</th>
                <th class="py-2.5 px-2 min-w-[125px]">
                  Date <span class="text-rose-500 font-bold">*</span>
                </th>
                <th class="py-2.5 px-2 min-w-[180px]">
                  Description / Title <span class="text-rose-500 font-bold">*</span>
                </th>
                <th class="py-2.5 px-2 min-w-[140px]">
                  Category
                  <span
                    class="text-[10px] text-indigo-600 font-bold"
                    title="Auto-detects as you type"
                    >✨ AI</span
                  >
                </th>
                <th class="py-2.5 px-2 min-w-[110px]">
                  Amount (₹) <span class="text-rose-500 font-bold">*</span>
                </th>
                <th class="py-2.5 px-2 min-w-[110px]">Split</th>
                <th class="py-2.5 px-2 min-w-[110px]">UPI Ref</th>
                <th class="py-2.5 px-2 w-10 text-center"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                *ngFor="let row of rows; let idx = index"
                class="hover:bg-slate-50/80 transition-colors group"
                [class.bg-emerald-50/20]="isRowValid(row)"
              >
                <!-- Row Number -->
                <td
                  class="py-1.5 px-2 text-center text-slate-400 font-mono text-[11px] select-none"
                >
                  {{ idx + 1 }}
                </td>

                <!-- Date -->
                <td class="py-1.5 px-2">
                  <input
                    type="date"
                    [(ngModel)]="row.date"
                    required
                    class="w-full px-2 py-1.5 border border-slate-200 rounded-md text-xs bg-white text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium"
                  />
                </td>

                <!-- Title / Description with Real-time AI Category Detection -->
                <td class="py-1.5 px-2">
                  <input
                    type="text"
                    [(ngModel)]="row.title"
                    (ngModelChange)="onRowTitleChange(idx, $event)"
                    placeholder="e.g. Blinkit, WiFi, Swiggy"
                    class="w-full px-2.5 py-1.5 border border-slate-200 rounded-md text-xs bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium"
                  />
                </td>

                <!-- Category -->
                <td class="py-1.5 px-2">
                  <select
                    [(ngModel)]="row.category"
                    class="w-full px-2 py-1.5 border border-slate-200 rounded-md text-xs bg-white text-slate-800 focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
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
                </td>

                <!-- Amount (₹) -->
                <td class="py-1.5 px-2">
                  <div class="relative">
                    <span class="absolute left-2 top-1.5 text-slate-400 text-xs font-semibold"
                      >₹</span
                    >
                    <input
                      type="number"
                      step="0.01"
                      [(ngModel)]="row.amount"
                      placeholder="0.00"
                      class="w-full pl-5 pr-2 py-1.5 border border-slate-200 rounded-md text-xs bg-white text-slate-900 font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                </td>

                <!-- Split Method -->
                <td class="py-1.5 px-2">
                  <select
                    [(ngModel)]="row.splitType"
                    class="w-full px-2 py-1.5 border border-slate-200 rounded-md text-xs bg-white text-slate-800 focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
                  >
                    <option value="EQUAL">Equal</option>
                    <option value="EXACT">Exact</option>
                    <option value="PERCENTAGE">%</option>
                  </select>
                </td>

                <!-- UPI Ref / UTR -->
                <td class="py-1.5 px-2">
                  <input
                    type="text"
                    [(ngModel)]="row.utrNumber"
                    (keydown.tab)="onLastCellTab(idx)"
                    placeholder="Ref ID"
                    class="w-full px-2 py-1.5 border border-slate-200 rounded-md text-xs bg-white text-slate-800 placeholder-slate-400 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </td>

                <!-- Delete Action -->
                <td class="py-1.5 px-2 text-center">
                  <button
                    type="button"
                    (click)="removeRow(idx)"
                    [disabled]="rows.length <= 1"
                    class="text-slate-400 hover:text-rose-600 disabled:opacity-20 p-1 rounded transition-colors cursor-pointer"
                    title="Delete row"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Empty Grid Quick Add Helper -->
          <div class="pt-3 flex items-center justify-between text-xs text-slate-500">
            <button
              type="button"
              (click)="addRow()"
              class="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center space-x-1 cursor-pointer"
            >
              <span>＋ Add another row</span>
              <span class="text-[11px] text-slate-400">(or press Tab on last cell)</span>
            </button>

            <button
              type="button"
              (click)="clearEmptyRows()"
              class="text-slate-400 hover:text-slate-600 text-xs font-medium cursor-pointer"
            >
              Clear empty rows
            </button>
          </div>
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
                  ? 'Saving to Google Sheet...'
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
        category: 'Groceries',
        amount: null,
        splitType: 'EQUAL',
        utrNumber: '',
      },
      {
        id: this.nextId++,
        date: today,
        title: '',
        category: 'Household',
        amount: null,
        splitType: 'EQUAL',
        utrNumber: '',
      },
      {
        id: this.nextId++,
        date: today,
        title: '',
        category: 'Food & Dining',
        amount: null,
        splitType: 'EQUAL',
        utrNumber: '',
      },
      {
        id: this.nextId++,
        date: today,
        title: '',
        category: 'Electricity',
        amount: null,
        splitType: 'EQUAL',
        utrNumber: '',
      },
    ];
  }

  addRow() {
    const today = new Date().toISOString().split('T')[0];
    this.rows.push({
      id: this.nextId++,
      date: today,
      title: '',
      category: 'Groceries',
      amount: null,
      splitType: 'EQUAL',
      utrNumber: '',
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
      let category: ExpenseCategory = 'Groceries';

      // Smart column detection
      if (parts[0].match(/^\d{4}-\d{2}-\d{2}$/)) {
        date = parts[0];
        title = parts[1] || '';
        amount = parts[2] ? parseFloat(parts[2].replace(/[₹,]/g, '')) : null;
        if (parts[3]) category = (parts[3] as ExpenseCategory) || 'Groceries';
      } else {
        title = parts[0];
        amount = parts[1] ? parseFloat(parts[1].replace(/[₹,]/g, '')) : null;
        if (parts[2]) category = (parts[2] as ExpenseCategory) || 'Groceries';
      }

      parsedRows.push({
        id: this.nextId++,
        date,
        title,
        category,
        amount: isNaN(amount as number) ? null : amount,
        splitType: 'EQUAL',
        utrNumber: '',
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
      splitType: r.splitType,
      utrNumber: r.utrNumber ? r.utrNumber.trim() : undefined,
    }));

    this.api.addExpensesBatch(items).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.close.emit();
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.error || 'Failed to save batch expenses to Google Sheet.');
      },
    });
  }
}
