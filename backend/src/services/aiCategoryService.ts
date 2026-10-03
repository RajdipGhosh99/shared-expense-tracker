import { ExpenseCategory } from '@shared-expense-tracker/shared';

export interface CategoryPrediction {
  category: ExpenseCategory;
  confidence: number; // 0.0 - 1.0
  source: 'gemini' | 'nlp_rule_engine';
  matchedKeywords?: string[];
  matchReason?: string;
  isFuzzy?: boolean;
}

/**
 * Standard Levenshtein Distance for typo tolerance & fuzzy matching
 */
export function levenshteinDistance(s1: string, s2: string): number {
  if (s1 === s2) return 0;
  if (!s1.length) return s2.length;
  if (!s2.length) return s1.length;

  const prevRow = Array.from({ length: s2.length + 1 }, (_, i) => i);
  const currRow = new Array(s2.length + 1);

  for (let i = 0; i < s1.length; i++) {
    currRow[0] = i + 1;
    for (let j = 0; j < s2.length; j++) {
      const cost = s1[i] === s2[j] ? 0 : 1;
      currRow[j + 1] = Math.min(currRow[j] + 1, prevRow[j + 1] + 1, prevRow[j] + cost);
    }
    for (let j = 0; j <= s2.length; j++) {
      prevRow[j] = currRow[j];
    }
  }
  return prevRow[s2.length];
}

export const BRAND_KEYWORDS = new Set([
  'blinkit',
  'zepto',
  'instamart',
  'bigbasket',
  'bbnow',
  'dmart',
  'd-mart',
  'swiggy',
  'zomato',
  'mcdonald',
  'dominos',
  'kfc',
  'starbucks',
  'bescom',
  'tata power',
  'torrent power',
  'adani electricity',
  'msedcl',
  'tneb',
  'act fibernet',
  'act fiber',
  'jiofiber',
  'airtel fiber',
  'hathway',
  'bisleri',
  'aquaguard',
  'kinley',
  'uber',
  'ola',
  'rapido',
]);

const CATEGORY_RULES: { category: ExpenseCategory; weight: number; keywords: string[] }[] = [
  {
    category: 'Groceries',
    weight: 1.0,
    keywords: [
      'blinkit',
      'zepto',
      'instamart',
      'bigbasket',
      'bbnow',
      'nature basket',
      'dmart',
      'd-mart',
      'supermarket',
      'grocery',
      'groceries',
      'kirana',
      'provisions',
      'milk',
      'curd',
      'paneer',
      'amul',
      'nandini',
      'mother dairy',
      'veggies',
      'vegetable',
      'vegetables',
      'fruits',
      'egg',
      'eggs',
      'bread',
      'atta',
      'rice',
      'dal',
      'oil',
      'ghee',
      'spices',
      'masala',
      'meat',
      'chicken',
      'mutton',
      'fish',
      'licious',
      'fresh to home',
      'freshtohome',
      'country delight',
    ],
  },
  {
    category: 'Rent',
    weight: 1.0,
    keywords: [
      'rent',
      'flat rent',
      'room rent',
      'house rent',
      'monthly rent',
      'landlord',
      'owner rent',
      'society maintenance',
      'maintenance charge',
      'maintenance',
      'security deposit',
      'deposit',
      'brokerage',
      'lease',
    ],
  },
  {
    category: 'Electricity',
    weight: 1.0,
    keywords: [
      'electricity',
      'power bill',
      'current bill',
      'bescom',
      'tata power',
      'torrent power',
      'adani electricity',
      'msedcl',
      'dhbvn',
      'bses',
      'cesc',
      'tneb',
      'eb bill',
      'power supply',
      'electric meter',
    ],
  },
  {
    category: 'Wi-Fi',
    weight: 1.0,
    keywords: [
      'wifi',
      'wi-fi',
      'internet',
      'act fibernet',
      'act broadband',
      'act fiber',
      'jio fiber',
      'jiofiber',
      'airtel xstream',
      'airtel fiber',
      'airtel broadband',
      'hathway',
      'spectra',
      'excitel',
      'broadband',
      'router',
      'fiber net',
      'fibernet',
    ],
  },
  {
    category: 'Maid & Cook',
    weight: 1.0,
    keywords: [
      'maid',
      'cook',
      'maid salary',
      'cook salary',
      'bai',
      'kamwali',
      'sweeper',
      'cleaning lady',
      'domestic help',
      'helper',
      'dusting',
      'brooming',
      'pocha',
      'jhadu',
      'utensil cleaning',
      ' बर्तन',
      'झाड़ू',
    ],
  },
  {
    category: 'Drinking Water',
    weight: 1.0,
    keywords: [
      'water',
      'bisleri',
      'water can',
      'water tanker',
      'water jar',
      '20l can',
      '20l',
      '20 litre',
      'drinking water',
      'aquaguard',
      'water delivery',
      'mineral water',
      'kinley',
      'bailley',
      'ro water',
      'tanker',
    ],
  },
  {
    category: 'Household',
    weight: 0.9,
    keywords: [
      'detergent',
      'surf excel',
      'ariel',
      'tide',
      'vim',
      'vim bar',
      'dishwash',
      'pril',
      'harpic',
      'colin',
      'lizol',
      'mop',
      'broom',
      'dustbin',
      'garbage',
      'trash bags',
      'pest control',
      'urban company',
      'urbanclap',
      'plumber',
      'electrician',
      'all out',
      'goodknight',
      'mosquito',
      'toilet paper',
      'tissue',
      'handwash',
      'dettol',
      'savlon',
      'bulb',
      'faucet',
    ],
  },
  {
    category: 'Food & Dining',
    weight: 0.95,
    keywords: [
      'swiggy',
      'zomato',
      'eatsure',
      'mcdonald',
      'mcd',
      'kfc',
      'burger king',
      'dominos',
      'domino',
      'pizza hut',
      'pizza',
      'subway',
      'starbucks',
      'cafe coffee day',
      'ccd',
      'third wave',
      'blue tokai',
      'chai point',
      'chaayos',
      'chai',
      'tea',
      'coffee',
      'biryani',
      'behrouz',
      'meghana',
      'lunch',
      'dinner',
      'breakfast',
      'brunch',
      'snacks',
      'restaurant',
      'dining',
      'dhaba',
      'hotel',
      'beer',
      'wine',
      'alcohol',
      'pub',
      'brewery',
      'party drinks',
      'bar',
      'dessert',
      'ice cream',
      'swiggy instamart food',
    ],
  },
  {
    category: 'Other',
    weight: 0.7,
    keywords: [
      'uber',
      'ola',
      'rapido',
      'ride',
      'travel',
      'auto',
      'cab',
      'taxi',
      'metro',
      'petrol',
      'diesel',
      'fuel',
      'parking',
      'toll',
      'fastag',
      'medicine',
      'pharmacy',
      'apollo',
      'pharmeasy',
      '1mg',
      'medplus',
      'cinema',
      'movie',
      'pvr',
      'inox',
      'bookmyshow',
      'netflix',
      'prime',
      'spotify',
      'cult',
      'cult.fit',
      'gym',
    ],
  },
];

export class AiCategoryService {
  /**
   * Helper to check word match with typo tolerance
   */
  private static checkWordMatch(
    word: string,
    kw: string,
  ): { matched: boolean; isFuzzy?: boolean; sim?: number; dist?: number } {
    if (word === kw) return { matched: true, isFuzzy: false, sim: 1.0, dist: 0 };
    if (word.length < 3 || kw.length < 3) return { matched: false };

    // 4-letter keywords (e.g. wifi, cook, maid, uber)
    if (kw.length === 4) {
      if (word[0] === kw[0] && Math.abs(word.length - kw.length) === 1) {
        const dist = levenshteinDistance(word, kw);
        if (dist === 1) {
          return {
            matched: true,
            isFuzzy: true,
            sim: 1 - dist / Math.max(word.length, kw.length),
            dist,
          };
        }
      }
      return { matched: false };
    }

    // 5-7 letter keywords (e.g. zepto, swiggy, zomato, bescom)
    if (kw.length >= 5 && kw.length <= 7) {
      const dist = levenshteinDistance(word, kw);
      const maxLen = Math.max(word.length, kw.length);
      const sim = 1 - dist / maxLen;
      if (dist <= 2 && sim >= 0.65) {
        return { matched: true, isFuzzy: true, sim, dist };
      }
    } else if (kw.length >= 8) {
      // 8+ letter keywords (e.g. electricity, groceries, broadband, maintenance)
      const dist = levenshteinDistance(word, kw);
      const maxLen = Math.max(word.length, kw.length);
      const sim = 1 - dist / maxLen;
      if (dist <= 3 && sim >= 0.7) {
        return { matched: true, isFuzzy: true, sim, dist };
      }
    }
    return { matched: false };
  }

  /**
   * Predict expense category using typo-tolerant NLP heuristic rules + optional Gemini API
   */
  static async predictCategory(title: string): Promise<CategoryPrediction> {
    if (!title || title.trim().length === 0) {
      return { category: 'Other', confidence: 0.5, source: 'nlp_rule_engine' };
    }

    const cleanTitle = title.toLowerCase().trim();
    const words = cleanTitle.split(/[^a-z0-9]+/).filter((w) => w.length >= 2);

    // 1. Check BRAND keywords first (Brands like Blinkit, Zepto, Swiggy take absolute precedence)
    let bestBrandMatch: CategoryPrediction | null = null;
    let bestBrandScore = 0;

    for (const rule of CATEGORY_RULES) {
      for (const kw of rule.keywords) {
        if (!BRAND_KEYWORDS.has(kw)) continue;

        if (kw.includes(' ')) {
          const kwParts = kw.split(' ');
          for (let i = 0; i <= words.length - kwParts.length; i++) {
            const windowPhrase = words.slice(i, i + kwParts.length).join(' ');
            const dist = levenshteinDistance(windowPhrase, kw);
            const maxLen = Math.max(windowPhrase.length, kw.length);
            const sim = 1 - dist / maxLen;
            if (dist <= 2 && sim >= 0.75) {
              const isFuzzy = dist > 0;
              const score = isFuzzy ? sim * 0.9 : 1.0;
              if (score > bestBrandScore) {
                bestBrandScore = score;
                bestBrandMatch = {
                  category: rule.category,
                  confidence: isFuzzy ? 0.92 : 0.98,
                  source: 'nlp_rule_engine',
                  matchedKeywords: [kw],
                  matchReason: isFuzzy ? `Matched "${windowPhrase}" ≈ "${kw}"` : `Matched "${kw}"`,
                  isFuzzy,
                };
              }
            }
          }
        } else {
          for (const word of words) {
            const m = this.checkWordMatch(word, kw);
            if (m.matched) {
              const score = m.isFuzzy ? m.sim! * 0.9 : 1.0;
              if (score > bestBrandScore) {
                bestBrandScore = score;
                bestBrandMatch = {
                  category: rule.category,
                  confidence: m.isFuzzy ? 0.9 : 0.98,
                  source: 'nlp_rule_engine',
                  matchedKeywords: [kw],
                  matchReason: m.isFuzzy ? `Matched "${word}" ≈ "${kw}"` : `Matched "${kw}"`,
                  isFuzzy: m.isFuzzy,
                };
              }
            }
          }
        }
      }
    }

    if (bestBrandMatch) {
      return bestBrandMatch;
    }

    // 2. Exact match check (word boundary) for general keywords
    let bestExactMatch: CategoryPrediction | null = null;
    let bestExactScore = 0;

    for (const rule of CATEGORY_RULES) {
      for (const kw of rule.keywords) {
        let isMatch = false;
        if (kw.includes(' ')) {
          if (cleanTitle.includes(kw)) isMatch = true;
        } else {
          const regex = new RegExp(`\\b${kw}\\b`, 'i');
          if (regex.test(cleanTitle)) isMatch = true;
        }

        if (isMatch) {
          const score = (kw.length / Math.max(cleanTitle.length, 1)) * 0.5 + rule.weight * 0.5;
          if (score > bestExactScore) {
            bestExactScore = score;
            bestExactMatch = {
              category: rule.category,
              confidence: Math.min(Math.round((0.85 + score * 0.15) * 100) / 100, 0.99),
              source: 'nlp_rule_engine',
              matchedKeywords: [kw],
              matchReason: `Matched "${kw}"`,
              isFuzzy: false,
            };
          }
        }
      }
    }

    if (bestExactMatch && bestExactScore >= 0.4) {
      return bestExactMatch;
    }

    // 3. Typo-Tolerant & Misspelled Fuzzy Keyword Matching
    let bestFuzzyMatch: CategoryPrediction | null = null;
    let bestFuzzyScore = 0;

    for (const rule of CATEGORY_RULES) {
      for (const kw of rule.keywords) {
        if (kw.includes(' ')) {
          const kwParts = kw.split(' ');
          for (let i = 0; i <= words.length - kwParts.length; i++) {
            const windowPhrase = words.slice(i, i + kwParts.length).join(' ');
            const dist = levenshteinDistance(windowPhrase, kw);
            const maxLen = Math.max(windowPhrase.length, kw.length);
            const sim = 1 - dist / maxLen;
            if (dist <= 2 && sim >= 0.75) {
              const score = sim * rule.weight;
              if (score > bestFuzzyScore) {
                bestFuzzyScore = score;
                bestFuzzyMatch = {
                  category: rule.category,
                  confidence: Math.min(Math.round((0.75 + sim * 0.2) * 100) / 100, 0.95),
                  source: 'nlp_rule_engine',
                  matchedKeywords: [kw],
                  matchReason: `Matched "${windowPhrase}" ≈ "${kw}"`,
                  isFuzzy: true,
                };
              }
            }
          }
        } else {
          for (const word of words) {
            const m = this.checkWordMatch(word, kw);
            if (m.matched) {
              const score = m.sim! * rule.weight + (word[0] === kw[0] ? 0.05 : -0.05);
              if (score > bestFuzzyScore) {
                bestFuzzyScore = score;
                bestFuzzyMatch = {
                  category: rule.category,
                  confidence: Math.min(Math.round((0.75 + m.sim! * 0.2) * 100) / 100, 0.95),
                  source: 'nlp_rule_engine',
                  matchedKeywords: [kw],
                  matchReason: `Matched "${word}" ≈ "${kw}"`,
                  isFuzzy: true,
                };
              }
            }
          }
        }
      }
    }

    if (bestFuzzyMatch && bestFuzzyScore >= 0.65) {
      return bestFuzzyMatch;
    }

    // 4. If Gemini API key is available, call Gemini Flash API
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey && geminiKey.trim().length > 10) {
      try {
        const geminiResult = await this.callGemini(title, geminiKey);
        if (geminiResult) return geminiResult;
      } catch (err) {
        console.warn('[AiCategoryService] Gemini API call skipped or failed:', err);
      }
    }

    // Default fallback
    return {
      category: 'Other',
      confidence: 0.5,
      source: 'nlp_rule_engine',
    };
  }

  private static async callGemini(
    title: string,
    apiKey: string,
  ): Promise<CategoryPrediction | null> {
    const prompt = `Classify this shared apartment / group expense title into EXACTLY one of these categories:
Categories:
- Groceries
- Rent
- Electricity
- Wi-Fi
- Maid & Cook
- Drinking Water
- Household
- Food & Dining
- Other

Expense Title: "${title}"

Return ONLY a valid JSON object in this exact format, with no markdown code fences:
{"category": "CategoryName", "confidence": 0.95}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 100 },
        }),
      },
    );

    if (!res.ok) return null;
    const json = (await res.json()) as any;
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    const cleaned = text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
    const parsed = JSON.parse(cleaned);
    if (parsed.category) {
      return {
        category: parsed.category as ExpenseCategory,
        confidence: parsed.confidence || 0.9,
        source: 'gemini',
      };
    }
    return null;
  }
}
