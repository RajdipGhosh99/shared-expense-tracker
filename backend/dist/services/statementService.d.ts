import { MonthlyStatement } from '@shared-expense-tracker/shared';
import { IDataStore } from '../storage/IDataStore.js';
export interface GenerateStatementParams {
    flatId: string;
    startDate: string;
    endDate: string;
    monthLabel?: string;
}
export declare function generateStatement(params: GenerateStatementParams, db: IDataStore): Promise<MonthlyStatement>;
//# sourceMappingURL=statementService.d.ts.map