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
export declare class DuplicateValidator {
    private db;
    constructor(db: IDataStore);
    validate(candidate: ValidationCandidate): Promise<ValidationOutcome>;
}
//# sourceMappingURL=duplicateValidator.d.ts.map