import { Expense, DuplicateConflictResponse } from '@shared-expense-tracker/shared';
import { IDataStore } from '../storage/IDataStore.js';

export interface ValidationCandidate {
  groupId?: string;
  flatId?: string;
  payerEmail: string;
  title: string;
  amountMinorUnits: number;
  amountDisplay: number;
  utrNumber?: string;
  allowOverwrite?: boolean;
  overwriteTargetId?: string;
}

export interface ValidationOutcome {
  canProceed: boolean;
  isDuplicate: boolean;
  isOverwrite: boolean;
  conflict?: DuplicateConflictResponse;
  targetExpense?: Expense;
  errorMessage?: string;
}

export class DuplicateValidator {
  constructor(private db: IDataStore) {}

  async validate(candidate: ValidationCandidate): Promise<ValidationOutcome> {
    if (candidate.amountMinorUnits <= 0) {
      return {
        canProceed: false,
        isDuplicate: false,
        isOverwrite: false,
        errorMessage: 'Expense amount must be greater than zero.',
      };
    }

    // If caller explicitly requested an overwrite of a specific ID
    if (candidate.allowOverwrite && candidate.overwriteTargetId) {
      const target = await this.db.getExpenseById(candidate.overwriteTargetId);
      if (target) {
        return {
          canProceed: true,
          isDuplicate: true,
          isOverwrite: true,
          targetExpense: target,
        };
      }
    }

    const groupId = candidate.groupId || candidate.flatId || '';
    const existingExpenses = await this.db.getExpenses(groupId);

    // 1. EXACT_UTR Check (100% Deterministic match on 12-digit UPI UTR)
    if (candidate.utrNumber && candidate.utrNumber.trim().length > 0) {
      const cleanUTR = candidate.utrNumber.trim();
      const utrMatch = existingExpenses.find((e) => e.utrNumber && e.utrNumber.trim() === cleanUTR);

      if (utrMatch) {
        if (candidate.allowOverwrite) {
          return {
            canProceed: true,
            isDuplicate: true,
            isOverwrite: true,
            targetExpense: utrMatch,
          };
        }

        return {
          canProceed: false,
          isDuplicate: true,
          isOverwrite: false,
          conflict: {
            status: 'DUPLICATE_DETECTED',
            duplicateType: 'EXACT_UTR',
            message: `Exact UPI reference (${cleanUTR}) was already logged as #${utrMatch.id}.`,
            existingRecord: {
              id: utrMatch.id,
              title: utrMatch.title,
              amountDisplay: utrMatch.totalAmountDisplay,
              payerEmail: utrMatch.payerEmail,
              createdAt: utrMatch.createdAt,
              utrNumber: utrMatch.utrNumber,
              sheetUrl: utrMatch.sheetRowLink,
            },
            incomingRecord: {
              title: candidate.title,
              amountDisplay: candidate.amountDisplay,
              payerEmail: candidate.payerEmail,
              utrNumber: candidate.utrNumber,
            },
          },
        };
      }
    }

    // 2. FUZZY_FINGERPRINT Check (Heuristic match for manual entries / cash)
    const thirtyMinsAgo = Date.now() - 30 * 60 * 1000;

    for (const exp of existingExpenses) {
      const expTime = new Date(exp.createdAt).getTime();
      const isRecent = expTime >= thirtyMinsAgo;
      const samePayer = exp.payerEmail.toLowerCase() === candidate.payerEmail.toLowerCase();
      const sameAmount = exp.totalAmountMinorUnits === candidate.amountMinorUnits;

      // Clean title comparison
      const t1 = exp.title.toLowerCase().replace(/[^a-z0-9]/g, '');
      const t2 = candidate.title.toLowerCase().replace(/[^a-z0-9]/g, '');
      const titleMatches = t1.includes(t2) || t2.includes(t1);

      if (samePayer && sameAmount && isRecent && titleMatches) {
        if (candidate.allowOverwrite) {
          return {
            canProceed: true,
            isDuplicate: true,
            isOverwrite: true,
            targetExpense: exp,
          };
        }

        return {
          canProceed: false,
          isDuplicate: true,
          isOverwrite: false,
          conflict: {
            status: 'DUPLICATE_DETECTED',
            duplicateType: 'FUZZY_FINGERPRINT',
            message: `A similar expense of ₹${candidate.amountDisplay} ("${exp.title}") was logged recently.`,
            existingRecord: {
              id: exp.id,
              title: exp.title,
              amountDisplay: exp.totalAmountDisplay,
              payerEmail: exp.payerEmail,
              createdAt: exp.createdAt,
              sheetUrl: exp.sheetRowLink,
            },
            incomingRecord: {
              title: candidate.title,
              amountDisplay: candidate.amountDisplay,
              payerEmail: candidate.payerEmail,
            },
          },
        };
      }
    }

    return {
      canProceed: true,
      isDuplicate: false,
      isOverwrite: false,
    };
  }
}
