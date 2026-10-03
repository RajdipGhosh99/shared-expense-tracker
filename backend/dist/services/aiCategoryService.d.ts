import { ExpenseCategory } from '@shared-expense-tracker/shared';
export interface CategoryPrediction {
    category: ExpenseCategory;
    subCategory?: string;
    confidence: number;
    source: 'gemini' | 'nlp_rule_engine';
    matchedKeywords?: string[];
    matchReason?: string;
    isFuzzy?: boolean;
}
/**
 * Standard Levenshtein Distance for typo tolerance & fuzzy matching
 */
export declare function levenshteinDistance(s1: string, s2: string): number;
export declare const BRAND_KEYWORDS: Set<string>;
export interface CategoryRule {
    category: ExpenseCategory;
    subCategory: string;
    weight: number;
    keywords: string[];
}
export declare const CATEGORY_RULES: CategoryRule[];
export declare class AiCategoryService {
    /**
     * Evaluates whether a candidate token matches a target keyword exactly or via typo tolerance.
     */
    private static checkWordMatch;
    /**
     * Fast rule-based NLP classifier with typo tolerance and Gemini API fallback.
     * Accurately maps both Primary Category and Subcategory.
     */
    static predict(title: string): Promise<CategoryPrediction>;
    private static callGemini;
    static predictCategory(title: string): Promise<CategoryPrediction>;
}
//# sourceMappingURL=aiCategoryService.d.ts.map