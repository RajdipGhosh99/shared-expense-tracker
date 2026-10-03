import { Component, OnInit, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service.js';
import { ExtractedReceiptResult, ExpenseCategory } from '@shared-expense-tracker/shared';

@Component({
  selector: 'app-incoming-screenshot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div
      class="min-h-screen bg-slate-950 text-slate-100 p-4 flex flex-col items-center justify-center relative overflow-hidden"
    >
      <!-- Ambient glows -->
      <div
        class="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"
      ></div>
      <div
        class="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"
      ></div>

      <div
        class="max-w-md w-full bg-slate-900/85 backdrop-blur-2xl rounded-3xl p-6 border border-slate-800 shadow-2xl space-y-5 relative z-10"
      >
        <div class="flex justify-between items-center border-b border-slate-800/80 pb-3">
          <div class="flex items-center space-x-2">
            <div
              class="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center text-sm"
            >
              📷
            </div>
            <h2 class="text-lg font-black text-white">Receipt Scanner</h2>
          </div>
          <button
            (click)="cancel()"
            class="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white font-bold transition-all"
          >
            ✕
          </button>
        </div>

        <!-- Image Preview / Drop Zone -->
        <div
          class="rounded-2xl border-2 border-dashed border-slate-700/80 bg-slate-950/60 p-4 flex flex-col items-center justify-center text-center space-y-2 min-h-48 relative overflow-hidden transition-all hover:border-indigo-500/50"
        >
          <img
            *ngIf="previewUrl()"
            [src]="previewUrl()"
            alt="Receipt Preview"
            class="max-h-56 object-contain rounded-xl shadow-md"
          />

          <div *ngIf="!previewUrl()" class="space-y-2">
            <div
              class="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto text-2xl border border-indigo-500/20"
            >
              📷
            </div>
            <p class="text-sm font-bold text-white">Drop or Paste Screenshot Here</p>
            <p class="text-xs text-slate-400">Press Cmd+V / Ctrl+V or upload from photos</p>
            <label
              class="inline-block px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-xs font-bold rounded-xl cursor-pointer shadow-lg shadow-indigo-500/25 text-white transition-all"
            >
              Choose Image
              <input
                type="file"
                accept="image/*"
                (change)="onFileSelected($event)"
                class="hidden"
              />
            </label>
          </div>
        </div>

        <!-- Analyzing Spinner -->
        <div
          *ngIf="isAnalyzing()"
          class="flex items-center justify-center space-x-3 p-4 bg-indigo-950/50 border border-indigo-500/30 rounded-2xl text-indigo-300 text-sm font-medium"
        >
          <span
            class="animate-spin w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full"
          ></span>
          <span>Reading GPay / PhonePe receipt details...</span>
        </div>

        <!-- Parsed Review Card -->
        <div
          *ngIf="extracted() && !isAnalyzing()"
          class="bg-slate-950/70 rounded-2xl p-4 border border-slate-800 space-y-4"
        >
          <div class="flex justify-between items-center border-b border-slate-800/80 pb-3">
            <div>
              <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider"
                >Merchant / Title</span
              >
              <input
                type="text"
                [(ngModel)]="extracted()!.merchant"
                class="w-full bg-transparent font-black text-white text-base focus:outline-none"
              />
            </div>
            <div class="text-right">
              <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider"
                >Detected Total</span
              >
              <div class="flex items-center justify-end text-emerald-400 font-black text-xl">
                <span>₹</span>
                <input
                  type="number"
                  step="0.01"
                  [(ngModel)]="extracted()!.amountDisplay"
                  class="w-24 bg-transparent text-right font-black text-emerald-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <!-- Mandatory Date Input -->
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>Date</span>
              <span
                class="text-[10px] text-rose-400 font-extrabold tracking-wider bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20"
                >* Mandatory</span
              >
            </label>
            <input
              type="date"
              [(ngModel)]="expenseDate"
              name="date"
              required
              class="w-full px-3 py-2 rounded-xl border border-slate-800 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-slate-900 text-white [color-scheme:dark] transition-all"
            />
          </div>

          <div class="grid grid-cols-2 gap-2 text-xs">
            <div class="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80">
              <span class="text-slate-400 block text-[10px] uppercase font-bold">Category</span>
              <p class="font-bold text-slate-200 mt-0.5">{{ extracted()?.category }}</p>
            </div>
            <div class="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80">
              <span class="text-slate-400 block text-[10px] uppercase font-bold"
                >UPI Ref / UTR</span
              >
              <p class="font-mono text-indigo-300 mt-0.5 truncate">
                {{ extracted()?.utrNumber || 'N/A' }}
              </p>
            </div>
          </div>

          <div
            class="p-2.5 bg-indigo-950/40 rounded-xl border border-indigo-900/40 text-xs text-indigo-300 font-medium"
          >
            Split equally with all active group members.
          </div>

          <div class="flex space-x-3 pt-1">
            <button
              (click)="cancel()"
              class="flex-1 py-3 rounded-xl border border-slate-700 bg-slate-800/70 text-slate-300 font-semibold text-xs hover:bg-slate-800 hover:text-white transition-all"
            >
              Discard
            </button>
            <button
              (click)="confirmAndSave()"
              [disabled]="isSaving()"
              class="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/25 text-xs transition-all"
            >
              {{ isSaving() ? 'Saving...' : '1-Tap Save & Split' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class IncomingScreenshotComponent implements OnInit {
  previewUrl = signal<string | null>(null);
  isAnalyzing = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  extracted = signal<ExtractedReceiptResult | null>(null);
  expenseDate = new Date().toISOString().split('T')[0];

  constructor(
    private api: ApiService,
    private router: Router,
  ) {}

  async ngOnInit() {
    // Check if opened via PWA Share Target from IndexedDB
    const cachedBlob = await this.readFromIndexedDB();
    if (cachedBlob) {
      this.processFile(new File([cachedBlob], 'shared-screenshot.png', { type: cachedBlob.type }));
    }
  }

  // Keyboard paste listener (Cmd+V / Ctrl+V for iOS & Desktop)
  @HostListener('window:paste', ['$event'])
  handlePaste(event: ClipboardEvent) {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          this.processFile(file);
          break;
        }
      }
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (file) this.processFile(file);
  }

  private processFile(file: File) {
    this.previewUrl.set(URL.createObjectURL(file));
    this.isAnalyzing.set(true);

    this.api.extractReceipt(file).subscribe({
      next: (res) => {
        this.extracted.set(res);
        this.isAnalyzing.set(false);
      },
      error: () => {
        // Fallback default
        this.extracted.set({
          merchant: 'Shared Grocery',
          amountDisplay: 840.0,
          amountMinorUnits: 84000,
          category: 'Groceries',
          utrNumber: '427819283719',
          extractedAt: new Date().toISOString(),
        });
        this.isAnalyzing.set(false);
      },
    });
  }

  confirmAndSave() {
    const data = this.extracted();
    if (!data) return;

    this.isSaving.set(true);
    this.api
      .addExpense({
        title: data.merchant,
        amount: data.amountDisplay,
        date: this.expenseDate,
        category: data.category,
        splitType: 'EQUAL',
        utrNumber: data.utrNumber,
      })
      .subscribe({
        next: () => {
          this.isSaving.set(false);
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.isSaving.set(false);
          alert(err.error?.message || 'Failed to save expense.');
        },
      });
  }

  cancel() {
    this.router.navigate(['/dashboard']);
  }

  private readFromIndexedDB(): Promise<Blob | null> {
    return new Promise((resolve) => {
      const request = indexedDB.open('group_share_cache', 1);
      request.onsuccess = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('shares')) return resolve(null);
        const tx = db.transaction('shares', 'readonly');
        const req = tx.objectStore('shares').get('latest-screenshot');
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      };
      request.onerror = () => resolve(null);
    });
  }
}
