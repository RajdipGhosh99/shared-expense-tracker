import { Component, EventEmitter, Output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import imageCompression from 'browser-image-compression';
import { ReceiptExtraction, ReceiptExtractionApiResponse, receiptSchema } from '@shared-expense-tracker/shared';
import { OcrBridgeService } from '../../core/services/ocr-bridge.service.js';

@Component({
  selector: 'app-receipt-upload',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="receipt-extractor-card bg-white rounded-2xl border border-slate-200 p-5 shadow-xs max-w-lg mx-auto font-sans">
      <!-- Header -->
      <div class="flex items-center justify-between pb-3 border-b border-slate-100">
        <div class="flex items-center space-x-2">
          <div class="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm">
            🧾
          </div>
          <div>
            <h3 class="text-sm font-extrabold text-slate-900 leading-tight">Multimodal AI Receipt Scanner</h3>
            <p class="text-[11px] text-slate-500">Gemini 2.5 Flash • Zero-Disk Extraction</p>
          </div>
        </div>

        <span
          *ngIf="isCompressing()"
          class="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold animate-pulse"
        >
          Compressing...
        </span>
        <span
          *ngIf="isExtracting()"
          class="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold animate-pulse"
        >
          Analyzing Receipt...
        </span>
      </div>

      <!-- Drag & Drop Zone -->
      <div
        class="mt-4 border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer relative"
        [class.border-indigo-400]="isDragging()"
        [class.bg-indigo-50]="isDragging()"
        [class.border-slate-200]="!isDragging()"
        [class.hover:border-indigo-300]="!isProcessing()"
        (dragover)="onDragOver($event)"
        (dragleave)="isDragging.set(false)"
        (drop)="onFileDrop($event)"
        (click)="fileInput.click()"
      >
        <input
          #fileInput
          type="file"
          accept="image/*,application/pdf"
          class="hidden"
          (change)="onFileSelected($event)"
          [disabled]="isProcessing()"
        />

        <!-- Image Preview if available -->
        <div *ngIf="previewUrl()" class="mb-3 relative inline-block">
          <img
            [src]="previewUrl()"
            alt="Receipt preview"
            class="max-h-48 max-w-full rounded-lg object-contain shadow-xs border border-slate-200 mx-auto"
          />
          <button
            type="button"
            (click)="$event.stopPropagation(); resetState()"
            class="absolute -top-2 -right-2 bg-slate-900 text-white w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shadow-md hover:bg-rose-600 transition-colors"
            title="Remove image"
          >
            ✕
          </button>
        </div>

        <!-- Placeholder Icon & Text -->
        <div *ngIf="!previewUrl()" class="space-y-1.5 select-none">
          <div class="text-3xl">📸</div>
          <p class="text-xs font-bold text-slate-800">
            Upload or drop payment screenshot / bill
          </p>
          <p class="text-[11px] text-slate-400">
            GPay, PhonePe, Swiggy, Dmart, Instamart, PDF invoices (compressed client-side)
          </p>
        </div>

        <!-- Compression Metrics Badge -->
        <div *ngIf="compressionStats()" class="mt-2 text-[10px] text-emerald-700 font-mono font-semibold">
          {{ compressionStats() }}
        </div>
      </div>

      <!-- Spinner Progress Bar -->
      <div *ngIf="isProcessing()" class="mt-4 flex items-center justify-center space-x-2 text-indigo-600 text-xs font-bold">
        <svg class="animate-spin h-4 w-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
        <span>{{ statusMessage() }}</span>
      </div>

      <!-- Error Feedback -->
      <div
        *ngIf="errorMessage()"
        class="mt-3.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start space-x-2"
      >
        <span>⚠️</span>
        <div class="flex-1">
          <p class="font-bold">Extraction Failed</p>
          <p class="text-[11px] mt-0.5">{{ errorMessage() }}</p>
        </div>
      </div>

      <!-- Guardrail Rejection Notice -->
      <div
        *ngIf="extraction() && !extraction()?.isValidReceipt"
        class="mt-3.5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1 animate-fade-in"
      >
        <div class="flex items-center space-x-1.5 font-extrabold text-amber-800">
          <span>🚫</span>
          <span>Document Guardrail Triggered</span>
        </div>
        <p class="text-[11px] text-amber-700">
          The uploaded file was determined not to be an authentic, legible financial receipt.
        </p>
        <div class="text-[10px] font-mono font-bold bg-white px-2 py-1 rounded border border-amber-200 inline-block text-amber-800">
          Reason: {{ extraction()?.rejectionReason || 'NOT_A_RECEIPT' }}
        </div>
      </div>

      <!-- Valid Extraction Card -->
      <div
        *ngIf="extraction() && extraction()?.isValidReceipt"
        class="mt-4 p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-950 space-y-3 animate-fade-in"
      >
        <div class="flex items-center justify-between border-b border-emerald-200/80 pb-2">
          <div class="flex items-center space-x-1.5 font-black text-xs text-emerald-900">
            <span>✓</span>
            <span>Verified Financial Receipt</span>
            <span
              *ngIf="extraction()?.items && (extraction()?.items?.length || 0) > 1"
              class="ml-1.5 px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-extrabold animate-pulse"
            >
              📊 {{ extraction()?.items?.length }} Bills Detected
            </span>
          </div>
          <span
            *ngIf="duplicateNotice()"
            class="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 rounded text-[9px] font-extrabold"
          >
            Duplicate Hash
          </span>
        </div>

        <div class="grid grid-cols-2 gap-2 text-xs">
          <!-- Merchant -->
          <div class="bg-white p-2.5 rounded-lg border border-emerald-100">
            <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Merchant / Payee</span>
            <span class="font-extrabold text-slate-900 truncate block text-sm">{{ extraction()?.vendorName || 'Unknown' }}</span>
          </div>

          <!-- Total Amount -->
          <div class="bg-white p-2.5 rounded-lg border border-emerald-100">
            <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Amount</span>
            <span class="font-black text-emerald-700 text-base font-mono">₹{{ extraction()?.totalAmount?.toFixed(2) }}</span>
          </div>

          <!-- Transaction Date -->
          <div class="bg-white p-2.5 rounded-lg border border-emerald-100">
            <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Date</span>
            <span class="font-bold text-slate-800 font-mono">{{ extraction()?.date || 'N/A' }}</span>
          </div>

          <!-- Payment ID / UTR -->
          <div class="bg-white p-2.5 rounded-lg border border-emerald-100">
            <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Payment ID / UTR</span>
            <span class="font-bold text-slate-800 font-mono text-[11px] truncate block">
              {{ extraction()?.paymentId || 'None detected' }}
            </span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-2 pt-1">
          <button
            type="button"
            (click)="openInMultisheet()"
            class="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold rounded-lg text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center space-x-1.5"
          >
            <span>📊</span>
            <span>Review in Multisheet</span>
          </button>
          <button
            type="button"
            (click)="applyExtraction()"
            class="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg text-xs transition-all cursor-pointer shrink-0"
            title="Use directly in single bill form"
          >
            Use in Single Form
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ReceiptUploadComponent {
  @Output() receiptExtracted = new EventEmitter<ReceiptExtraction>();
  @Output() openMultisheet = new EventEmitter<ReceiptExtraction>();

  // State Signals
  isDragging = signal<boolean>(false);
  isCompressing = signal<boolean>(false);
  isExtracting = signal<boolean>(false);
  statusMessage = signal<string>('');
  errorMessage = signal<string | null>(null);
  previewUrl = signal<string | null>(null);
  compressionStats = signal<string | null>(null);
  duplicateNotice = signal<boolean>(false);
  extraction = signal<ReceiptExtraction | null>(null);

  isProcessing = computed(() => this.isCompressing() || this.isExtracting());

  constructor(
    private http: HttpClient,
    private ocrBridge: OcrBridgeService,
  ) {}

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onFileDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFile(files[0]);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processFile(input.files[0]);
    }
  }

  /**
   * Pipeline Step 1: Compress the image in-browser without visual fidelity loss
   * Pipeline Step 2: Stream multipart FormData to backend
   */
  async processFile(rawFile: File) {
    this.resetState();

    // Create immediate local preview
    if (rawFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => this.previewUrl.set(e.target?.result as string);
      reader.readAsDataURL(rawFile);
    }

    try {
      let fileToUpload: File = rawFile;

      // 1. Lossless client-side compression for images (leaves PDFs intact)
      if (rawFile.type.startsWith('image/')) {
        this.isCompressing.set(true);
        this.statusMessage.set('Compressing image on device...');

        const originalMb = (rawFile.size / (1024 * 1024)).toFixed(2);

        const options = {
          maxSizeMB: 1, // Target shrink to <= 1MB
          maxWidthOrHeight: 1920, // Crisp 1080p+ OCR fidelity for high-DPI screenshots
          useWebWorker: true,
          initialQuality: 0.85,
        };

        const compressedBlob = await imageCompression(rawFile, options);
        fileToUpload = new File([compressedBlob], rawFile.name, { type: compressedBlob.type });

        const compressedMb = (fileToUpload.size / (1024 * 1024)).toFixed(2);
        this.compressionStats.set(`Shrunk: ${originalMb}MB → ${compressedMb}MB`);
        this.isCompressing.set(false);
      }

      // 2. Append compressed buffer directly to FormData
      const formData = new FormData();
      formData.append('receipt', fileToUpload, fileToUpload.name);

      // 3. POST to /api/extract-receipt
      this.isExtracting.set(true);
      this.statusMessage.set('AI parsing receipt with Gemini 2.5 Flash...');

      this.http.post<ReceiptExtractionApiResponse>('/api/extract-receipt', formData).subscribe({
        next: (res) => {
          this.isExtracting.set(false);
          this.statusMessage.set('');

          // Validate payload with client-side Zod contract
          const parsed = receiptSchema.safeParse(res.data);
          if (!parsed.success) {
            this.errorMessage.set('Server returned unexpected format drift.');
            return;
          }

          this.extraction.set(parsed.data);
          this.duplicateNotice.set(Boolean(res.meta?.isDuplicateFile));

          // If screenshot contains multiple bills at a time, auto-open into spreadsheet bulk entry sheet!
          if (parsed.data.items && parsed.data.items.length > 1) {
            this.openInMultisheet();
          }
        },
        error: (err: HttpErrorResponse) => {
          this.isExtracting.set(false);
          this.statusMessage.set('');
          const serverError = err.error?.error || err.message || 'Failed to extract receipt data.';
          this.errorMessage.set(serverError);
        },
      });
    } catch (err: any) {
      this.isCompressing.set(false);
      this.isExtracting.set(false);
      this.errorMessage.set(err?.message || 'Error preparing file for upload.');
    }
  }

  applyExtraction() {
    const ext = this.extraction();
    if (ext && ext.isValidReceipt) {
      this.receiptExtracted.emit(ext);
    }
  }

  openInMultisheet() {
    const ext = this.extraction();
    if (ext && ext.isValidReceipt) {
      this.ocrBridge.stageForMultisheet(ext);
      this.openMultisheet.emit(ext);
    }
  }

  resetState() {
    this.errorMessage.set(null);
    this.extraction.set(null);
    this.compressionStats.set(null);
    this.duplicateNotice.set(false);
    this.previewUrl.set(null);
    this.statusMessage.set('');
  }
}
