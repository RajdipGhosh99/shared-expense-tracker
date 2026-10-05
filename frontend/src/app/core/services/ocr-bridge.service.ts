import { Injectable, signal } from '@angular/core';
import { ReceiptExtraction } from '@shared-expense-tracker/shared';

@Injectable({
  providedIn: 'root',
})
export class OcrBridgeService {
  /**
   * Pending extracted receipts waiting to be imported into the spreadsheet bulk entry sheet.
   */
  pendingExtractions = signal<ReceiptExtraction[]>([]);

  /**
   * Stashes extracted OCR data (either a single ReceiptExtraction or an array of items).
   */
  stageForMultisheet(data: ReceiptExtraction | ReceiptExtraction[]) {
    if (Array.isArray(data)) {
      this.pendingExtractions.set(data);
    } else {
      this.pendingExtractions.set([data]);
    }
  }

  /**
   * Retrieves and clears all staged OCR receipts.
   */
  consumePendingExtractions(): ReceiptExtraction[] {
    const list = this.pendingExtractions();
    this.pendingExtractions.set([]);
    return list;
  }

  /**
   * Backward compatible helper to retrieve first pending item.
   */
  consumePendingExtraction(): ReceiptExtraction | null {
    const list = this.consumePendingExtractions();
    return list.length > 0 ? list[0] : null;
  }

  hasPending(): boolean {
    return this.pendingExtractions().length > 0;
  }
}
