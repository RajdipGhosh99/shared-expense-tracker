import { Component, OnInit, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service.js';
import { OcrBridgeService } from '../../core/services/ocr-bridge.service.js';
import { ExtractedReceiptResult, ExpenseCategory, ReceiptExtraction } from '@shared-expense-tracker/shared';

@Component({
  selector: 'app-incoming-screenshot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div
      class="min-h-screen bg-slate-50 text-slate-900 p-4 flex flex-col items-center justify-center font-sans"
    >
      <div
        class="max-w-md w-full bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5"
      >
        <div class="flex justify-between items-center border-b border-slate-100 pb-3">
          <div class="flex items-center space-x-2">
            <div
              class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm font-bold"
            >
              📷
            </div>
            <h2 class="text-base font-bold text-slate-900">Receipt Scanner</h2>
          </div>
          <button
            (click)="cancel()"
            class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 font-bold transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        <!-- Image Preview / Drop Zone -->
        <div
          class="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 flex flex-col items-center justify-center text-center space-y-2 min-h-48 relative overflow-hidden transition-all hover:border-indigo-400"
        >
          <img
            *ngIf="previewUrl()"
            [src]="previewUrl()"
            alt="Receipt Preview"
            class="max-h-56 object-contain rounded-xl shadow-xs"
          />

          <div *ngIf="!previewUrl()" class="space-y-2">
            <div
              class="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto text-2xl border border-indigo-100"
            >
              📷
            </div>
            <p class="text-sm font-bold text-slate-800">Drop or Paste Screenshot Here</p>
            <p class="text-xs text-slate-500">Press Cmd+V / Ctrl+V or upload from photos</p>
            <label
              class="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-xs font-bold rounded-lg cursor-pointer shadow-xs text-white transition-all"
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
          class="flex items-center justify-center space-x-3 p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-700 text-sm font-medium"
        >
          <span
            class="animate-spin w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full"
          ></span>
          <span>Reading GPay / PhonePe receipt details...</span>
        </div>

        <!-- Extraction Error Feedback Banner -->
        <div
          *ngIf="errorMessage() && !isAnalyzing()"
          class="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium space-y-1.5 animate-fade-in"
        >
          <div class="flex items-center space-x-2 font-black text-rose-900">
            <span class="text-base">⚠️</span>
            <span>Receipt Extraction Failed</span>
          </div>
          <p class="text-[11px] leading-relaxed text-rose-700">{{ errorMessage() }}</p>
          <div class="pt-1 flex items-center justify-end space-x-2">
            <button
              type="button"
              (click)="resetState()"
              class="px-2.5 py-1 bg-white border border-rose-300 rounded-lg text-rose-700 text-[11px] font-bold hover:bg-rose-100 cursor-pointer"
            >
              Try Another Image
            </button>
          </div>
        </div>

        <!-- Document Guardrail Rejection Notice (Non-receipt, selfie, blurred) -->
        <div
          *ngIf="guardrailNotice() && !isAnalyzing()"
          class="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2 animate-fade-in"
        >
          <div class="flex items-center space-x-2 font-black text-amber-900">
            <span class="text-base">🚫</span>
            <span>Document Not Recognized as Financial Receipt</span>
          </div>
          <p class="text-[11px] text-amber-800 leading-relaxed">
            The uploaded image does not appear to be an authentic, legible payment receipt or UPI transaction proof.
          </p>
          <div class="inline-block bg-white px-2.5 py-1 rounded-md border border-amber-300 text-[10px] font-mono font-bold text-amber-900">
            Reason: {{ guardrailNotice() }}
          </div>
          <div class="pt-1 flex items-center justify-end space-x-2">
            <button
              type="button"
              (click)="resetState()"
              class="px-2.5 py-1 bg-white border border-amber-300 rounded-lg text-amber-800 text-[11px] font-bold hover:bg-amber-100 cursor-pointer"
            >
              Upload Valid Receipt
            </button>
          </div>
        </div>

        <!-- Parsed Review Card -->
        <div
          *ngIf="extracted() && !isAnalyzing() && !guardrailNotice()"
          class="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-4"
        >
          <div class="flex justify-between items-center border-b border-slate-200/80 pb-3">
            <div>
              <span class="text-[10px] uppercase font-bold text-slate-500 tracking-wider"
                >Merchant / Title</span
              >
              <input
                type="text"
                [(ngModel)]="extracted()!.merchant"
                class="w-full bg-transparent font-bold text-slate-900 text-base focus:outline-none"
              />
            </div>
            <div class="text-right">
              <span class="text-[10px] uppercase font-bold text-slate-500 tracking-wider"
                >Detected Total</span
              >
              <div class="flex items-center justify-end text-emerald-600 font-black text-xl">
                <span>₹</span>
                <input
                  type="number"
                  step="0.01"
                  [(ngModel)]="extracted()!.amountDisplay"
                  class="w-24 bg-transparent text-right font-black text-emerald-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <!-- Mandatory Date Input -->
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Date</span>
              <span
                class="text-[10px] text-rose-600 font-extrabold tracking-wider bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200"
                >* Mandatory</span
              >
            </label>
            <input
              type="date"
              [(ngModel)]="expenseDate"
              name="date"
              required
              class="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white text-slate-900 transition-all"
            />
          </div>

          <div class="grid grid-cols-2 gap-2 text-xs">
            <div class="p-2.5 rounded-lg bg-white border border-slate-200">
              <span class="text-slate-500 block text-[10px] uppercase font-bold">Category</span>
              <p class="font-bold text-slate-800 mt-0.5">{{ extracted()?.category }}</p>
            </div>
            <div class="p-2.5 rounded-lg bg-white border border-slate-200">
              <span class="text-slate-500 block text-[10px] uppercase font-bold"
                >UPI Ref / UTR</span
              >
              <p class="font-mono text-indigo-700 mt-0.5 truncate font-semibold">
                {{ extracted()?.utrNumber || 'N/A' }}
              </p>
            </div>
          </div>

          <div
            class="p-2.5 bg-indigo-50 rounded-lg border border-indigo-100 text-xs text-indigo-900 font-medium"
          >
            Split equally with all active group members.
          </div>

          <div class="flex space-x-2 pt-1">
            <button
              (click)="cancel()"
              class="px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-all cursor-pointer shadow-xs"
            >
              Discard
            </button>
            <button
              (click)="reviewInBulkSheet()"
              class="flex-1 py-2.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs transition-all cursor-pointer shadow-xs flex items-center justify-center space-x-1"
            >
              <span>📊</span>
              <span>Review in Bulk Sheet</span>
            </button>
            <button
              (click)="confirmAndSave()"
              [disabled]="isSaving()"
              class="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs text-xs transition-all cursor-pointer"
            >
              {{ isSaving() ? 'Saving...' : '1-Tap Save' }}
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
  errorMessage = signal<string | null>(null);
  guardrailNotice = signal<string | null>(null);
  expenseDate = new Date().toISOString().split('T')[0];

  constructor(
    private api: ApiService,
    private router: Router,
    private ocrBridge: OcrBridgeService,
  ) {}

  resetState() {
    this.errorMessage.set(null);
    this.guardrailNotice.set(null);
    this.extracted.set(null);
    this.previewUrl.set(null);
    this.isAnalyzing.set(false);
  }

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
    this.errorMessage.set(null);
    this.guardrailNotice.set(null);

    this.api.extractReceipt(file).subscribe({
      next: (res: any) => {
        this.isAnalyzing.set(false);

        // Normalize response whether returned directly or inside { success: true, data: ... }
        const dataPayload = res.data ? res.data : res;

        // Check Document Guardrail
        if (dataPayload.isValidReceipt === false) {
          this.guardrailNotice.set(
            dataPayload.rejectionReason || 'Uploaded image is not a recognized payment receipt.',
          );
          return;
        }

        // Map into extracted signal
        this.extracted.set({
          merchant: dataPayload.vendorName || dataPayload.merchant || 'Shared Expense',
          amountDisplay: dataPayload.totalAmount ?? dataPayload.amountDisplay ?? 0,
          amountMinorUnits: Math.round((dataPayload.totalAmount ?? dataPayload.amountDisplay ?? 0) * 100),
          category: dataPayload.category || 'Food & Dining',
          utrNumber: dataPayload.paymentId || dataPayload.utrNumber || undefined,
          extractedAt: new Date().toISOString(),
          isMultipleBills: Boolean(dataPayload.isMultipleBills || (dataPayload.items && dataPayload.items.length > 1)),
          items: dataPayload.items,
        });

        // If screenshot contains multiple bills at a time, automatically open into spreadsheet bulk entry grid!
        if (dataPayload.isMultipleBills || (dataPayload.items && dataPayload.items.length > 1)) {
          const itemsToStage: ReceiptExtraction[] = (dataPayload.items && dataPayload.items.length > 0)
            ? dataPayload.items.map((it: any) => ({
                isValidReceipt: true,
                rejectionReason: null,
                vendorName: it.vendorName || it.merchant || 'Expense',
                totalAmount: it.totalAmount ?? it.amountDisplay ?? 0,
                paymentId: it.paymentId || it.utrNumber || null,
                date: it.date || this.expenseDate,
                isOcrProcessed: true,
                items: [],
              }))
            : [
                {
                  isValidReceipt: true,
                  rejectionReason: null,
                  vendorName: dataPayload.vendorName || dataPayload.merchant || 'Expense',
                  totalAmount: dataPayload.totalAmount ?? dataPayload.amountDisplay ?? 0,
                  paymentId: dataPayload.paymentId || dataPayload.utrNumber || null,
                  date: this.expenseDate,
                  isOcrProcessed: true,
                  items: [],
                },
              ];

          this.ocrBridge.stageForMultisheet(itemsToStage);
          this.router.navigate(['/dashboard'], { queryParams: { openBulk: '1' } });
        }
      },
      error: (err) => {
        this.isAnalyzing.set(false);
        const serverError =
          err.error?.error ||
          err.error?.message ||
          err.message ||
          'Failed to extract receipt data from server.';
        this.errorMessage.set(serverError);
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
        splitType: 'EXACT',
        utrNumber: data.utrNumber,
        isOcrProcessed: true,
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

  reviewInBulkSheet() {
    const data = this.extracted();
    if (!data) return;

    if (data.items && data.items.length > 0) {
      const itemsToStage: ReceiptExtraction[] = data.items.map((it) => ({
        isValidReceipt: true,
        rejectionReason: null,
        vendorName: it.merchant,
        totalAmount: it.amountDisplay,
        paymentId: it.utrNumber || null,
        date: it.date || this.expenseDate,
        isOcrProcessed: true,
        items: [],
      }));
      this.ocrBridge.stageForMultisheet(itemsToStage);
    } else {
      this.ocrBridge.stageForMultisheet({
        isValidReceipt: true,
        rejectionReason: null,
        vendorName: data.merchant,
        totalAmount: data.amountDisplay,
        date: this.expenseDate,
        paymentId: data.utrNumber || null,
        isOcrProcessed: true,
        items: [],
      });
    }

    // Navigate to dashboard and trigger bulk sheet modal
    this.router.navigate(['/dashboard'], { queryParams: { openBulk: '1' } });
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
