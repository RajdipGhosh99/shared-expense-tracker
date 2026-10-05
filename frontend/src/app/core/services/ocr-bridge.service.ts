import { Injectable, signal } from '@angular/core';
import { ReceiptExtraction } from '@shared-expense-tracker/shared';

@Injectable({
  providedIn: 'root',
})
export class OcrBridgeService {
  /**
   * Pending extracted receipt waiting to be imported into the spreadsheet bulk entry sheet.
   */
  pendingExtraction = signal<ReceiptExtraction | null>(null);

  /**
   * Stashes extracted OCR data and emits for consumers (like BulkExpenseGrid).
   */
  stageForMultisheet(data: ReceiptExtraction) {
    this.pendingExtraction.set(data);
  }

  /**
   * Retrieves and clears the staged OCR receipt.
   */
  consumePendingExtraction(): ReceiptExtraction | null {
    const data = this.pendingExtraction();
    this.pendingExtraction.set(null);
    return data;
  }

  hasPending(): boolean {
    return this.pendingExtraction() !== null;
  }
}
