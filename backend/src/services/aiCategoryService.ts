import { ExpenseCategory } from '@shared-expense-tracker/shared';

export interface CategoryPrediction {
  category: ExpenseCategory;
  subCategory?: string;
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
  // Food & Dining
  'blinkit',
  'zepto',
  'instamart',
  'bigbasket',
  'bbnow',
  'dmart',
  'd-mart',
  'nature basket',
  'swiggy',
  'zomato',
  'eatsure',
  'mcdonald',
  'dominos',
  'kfc',
  'burger king',
  'subway',
  'starbucks',
  'behrouz',
  'meghana',
  'chai point',
  'chaayos',
  // Bills & Utilities
  'bescom',
  'tata power',
  'torrent power',
  'adani electricity',
  'msedcl',
  'tneb',
  'bses',
  'cesc',
  'act fibernet',
  'act fiber',
  'jio fiber',
  'jiofiber',
  'airtel xstream',
  'airtel fiber',
  'hathway',
  'spectra',
  'excitel',
  'bisleri',
  'aquaguard',
  'kinley',
  'bailley',
  // Transit & Travel
  'uber',
  'ola',
  'rapido',
  'namma yatri',
  'irctc',
  'indigo',
  'air india',
  'vistara',
  'redbus',
  'zoomcar',
  // Shopping & E-Commerce
  'myntra',
  'ajio',
  'amazon',
  'flipkart',
  'croma',
  'ikea',
  'pepperfry',
  'urban ladder',
  // Entertainment & Leisure
  'netflix',
  'hotstar',
  'spotify',
  'bookmyshow',
  'pvr',
  'inox',
  'cult',
  'cult.fit',
  // Health & Well-being
  'apollo',
  'pharmeasy',
  '1mg',
  'medplus',
  'practo',
  // Education & Career
  'udemy',
  'coursera',
  'github',
  'figma',
  'notion',
  'cursor',
  // Transfers & Settlements
  'cred',
  'zerodha',
  'groww',
]);

export interface CategoryRule {
  category: ExpenseCategory;
  subCategory: string;
  weight: number;
  keywords: string[];
}

export const CATEGORY_RULES: CategoryRule[] = [
  // 1. Food & Dining
  {
    category: 'Food & Dining',
    subCategory: 'Groceries & Dark Stores',
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
    category: 'Food & Dining',
    subCategory: 'Delivery & Takeaway',
    weight: 1.0,
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
      'biryani',
      'behrouz',
      'meghana',
      'burger',
    ],
  },
  {
    category: 'Food & Dining',
    subCategory: 'Cafes & Restaurants',
    weight: 0.95,
    keywords: [
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
      'lunch',
      'dinner',
      'breakfast',
      'brunch',
      'snacks',
      'restaurant',
      'dining',
      'dhaba',
      'dessert',
      'ice cream',
    ],
  },
  {
    category: 'Food & Dining',
    subCategory: 'Alcohol & Nightlife',
    weight: 0.95,
    keywords: [
      'beer',
      'wine',
      'alcohol',
      'liquor',
      'whiskey',
      'vodka',
      'pub',
      'bar',
      'brewery',
      'party drinks',
      'byob',
      'cocktail',
    ],
  },

  // 2. Bills & Utilities
  {
    category: 'Bills & Utilities',
    subCategory: 'Power & Grid',
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
    category: 'Bills & Utilities',
    subCategory: 'Water & Gas',
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
      'kinley',
      'bailley',
      'piped gas',
      'indane',
      'bharat gas',
      'hp gas',
      'cylinder',
      'lpg',
      'tanker',
    ],
  },
  {
    category: 'Bills & Utilities',
    subCategory: 'Fiber & Telecom',
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
      'fibernet',
    ],
  },
  {
    category: 'Bills & Utilities',
    subCategory: 'Society Maintenance & Domestic Help',
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
      'society maintenance',
      'maintenance charge',
      'maintenance',
      'plumber',
      'electrician',
    ],
  },
  {
    category: 'Bills & Utilities',
    subCategory: 'Rent & Housing',
    weight: 1.0,
    keywords: [
      'rent',
      'flat rent',
      'room rent',
      'house rent',
      'monthly rent',
      'landlord',
      'owner rent',
      'security deposit',
      'deposit',
      'brokerage',
      'lease',
    ],
  },

  // 3. Transit & Travel
  {
    category: 'Transit & Travel',
    subCategory: 'Daily Commute (Metro, Cab, Auto)',
    weight: 1.0,
    keywords: [
      'uber',
      'ola',
      'rapido',
      'namma yatri',
      'auto',
      'rickshaw',
      'cab',
      'taxi',
      'metro',
      'metro card',
      'bmtc',
      'dtc',
      'ride',
    ],
  },
  {
    category: 'Transit & Travel',
    subCategory: 'Fuel & Fastag',
    weight: 1.0,
    keywords: ['petrol', 'diesel', 'fuel', 'cng', 'fastag', 'toll', 'parking', 'car wash'],
  },
  {
    category: 'Transit & Travel',
    subCategory: 'Flights, Trains & Intercity',
    weight: 1.0,
    keywords: [
      'flight',
      'indigo',
      'air india',
      'vistara',
      'akasa',
      'train',
      'irctc',
      'tatkal',
      'bus ticket',
      'redbus',
      'abhibus',
      'zoomcar',
    ],
  },
  {
    category: 'Transit & Travel',
    subCategory: 'Stays & Lodging',
    weight: 0.95,
    keywords: [
      'hotel',
      'airbnb',
      'resort',
      'hostel',
      'homestay',
      'oyo',
      'makemytrip',
      'agoda',
      'lodging',
    ],
  },

  // 4. Shopping & E-Commerce
  {
    category: 'Shopping & E-Commerce',
    subCategory: 'Fashion & Apparel',
    weight: 0.95,
    keywords: [
      'myntra',
      'ajio',
      'zara',
      'h&m',
      'uniqlo',
      'clothes',
      'shoes',
      'sneakers',
      'apparel',
      'shopping',
    ],
  },
  {
    category: 'Shopping & E-Commerce',
    subCategory: 'Electronics & Tech',
    weight: 0.95,
    keywords: [
      'amazon',
      'flipkart',
      'croma',
      'reliance digital',
      'apple',
      'charger',
      'cable',
      'headphone',
      'laptop',
      'monitor',
      'keyboard',
      'mouse',
    ],
  },
  {
    category: 'Shopping & E-Commerce',
    subCategory: 'Home Decor & Appliances',
    weight: 0.95,
    keywords: [
      'microwave',
      'air fryer',
      'beanbag',
      'mattress',
      'curtains',
      'ikea',
      'pepperfry',
      'urban ladder',
      'furniture',
      'home decor',
    ],
  },
  {
    category: 'Shopping & E-Commerce',
    subCategory: 'Quick Retail & Courier',
    weight: 0.95,
    keywords: ['courier', 'dunzo', 'porter', 'packaging', 'stationary', 'printout', 'xerox'],
  },

  // 5. Entertainment & Leisure
  {
    category: 'Entertainment & Leisure',
    subCategory: 'Digital OTT & Cloud Subscriptions',
    weight: 0.95,
    keywords: [
      'netflix',
      'prime video',
      'hotstar',
      'disney',
      'spotify',
      'youtube premium',
      'apple music',
      'chatgpt',
      'openai',
      'claude',
      'midjourney',
      'google one',
      'icloud',
    ],
  },
  {
    category: 'Entertainment & Leisure',
    subCategory: 'Movies, Concerts & Live Events',
    weight: 0.95,
    keywords: [
      'bookmyshow',
      'pvr',
      'inox',
      'cinema',
      'movie',
      'imax',
      'concert',
      'standup',
      'comedy show',
    ],
  },
  {
    category: 'Entertainment & Leisure',
    subCategory: 'Gaming & Hobbies',
    weight: 0.95,
    keywords: ['steam', 'playstation', 'xbox', 'nintendo', 'board games', 'kindle'],
  },
  {
    category: 'Entertainment & Leisure',
    subCategory: 'Sports & Fitness (Gym/Turf)',
    weight: 0.95,
    keywords: [
      'cult',
      'cult.fit',
      'gym',
      'fitness',
      'badminton',
      'turf',
      'turf booking',
      'swimming',
      'sports',
    ],
  },

  // 6. Health & Well-being
  {
    category: 'Health & Well-being',
    subCategory: 'Pharmacy & Diagnostics',
    weight: 0.95,
    keywords: [
      'medicine',
      'pharmacy',
      'apollo',
      'pharmeasy',
      '1mg',
      'tata 1mg',
      'medplus',
      'tablet',
      'syrup',
      'bandage',
      'blood test',
      'lal pathlabs',
      'diagnostics',
    ],
  },
  {
    category: 'Health & Well-being',
    subCategory: 'Consultations & Hospital',
    weight: 0.95,
    keywords: ['doctor', 'clinic', 'consultation', 'dentist', 'hospital', 'practo', 'therapy'],
  },
  {
    category: 'Health & Well-being',
    subCategory: 'Personal Grooming & Salon',
    weight: 0.95,
    keywords: [
      'salon',
      'haircut',
      'spa',
      'massage',
      'beard trim',
      'shampoo',
      'skincare',
      'facewash',
      'grooming',
    ],
  },

  // 7. Education & Career
  {
    category: 'Education & Career',
    subCategory: 'Courses, Certifications & Books',
    weight: 0.95,
    keywords: [
      'udemy',
      'coursera',
      'edx',
      'linkedin learning',
      'certification',
      'aws certified',
      'exam fee',
      'textbook',
    ],
  },
  {
    category: 'Education & Career',
    subCategory: 'Professional Tools & Subscriptions',
    weight: 0.95,
    keywords: [
      'github',
      'copilot',
      'figma',
      'cursor',
      'jetbrains',
      'notion',
      'godaddy',
      'vercel',
      'aws bill',
    ],
  },
  {
    category: 'Education & Career',
    subCategory: 'Conferences & Upskilling',
    weight: 0.95,
    keywords: ['conference', 'workshop', 'hackathon', 'seminar', 'webinar', 'upskilling'],
  },

  // 8. Transfers & Settlements
  {
    category: 'Transfers & Settlements',
    subCategory: 'P2P Split Settlement (UPI/Cash)',
    weight: 1.0,
    keywords: [
      'settlement',
      'settle',
      'paid back',
      'repayment',
      'upi return',
      'cash settlement',
      'split repayment',
    ],
  },
  {
    category: 'Transfers & Settlements',
    subCategory: 'Credit Card Bill Repayment',
    weight: 1.0,
    keywords: ['credit card', 'cc bill', 'cred', 'hdfc cc', 'icici cc', 'sbi card', 'card bill'],
  },
  {
    category: 'Transfers & Settlements',
    subCategory: 'Self Account Transfer',
    weight: 1.0,
    keywords: ['self transfer', 'bank transfer', 'account transfer', 'savings'],
  },
  {
    category: 'Transfers & Settlements',
    subCategory: 'Investments (SIP/Stocks/Gold)',
    weight: 1.0,
    keywords: ['mutual fund', 'sip', 'zerodha', 'groww', 'coin', 'stocks', 'gold', 'fd'],
  },
];

export class AiCategoryService {
  /**
   * Evaluates whether a candidate token matches a target keyword exactly or via typo tolerance.
   */
  private static checkWordMatch(
    word: string,
    kw: string,
  ): { matched: boolean; isFuzzy?: boolean; sim?: number; dist?: number } {
    if (word === kw) return { matched: true, isFuzzy: false, sim: 1.0, dist: 0 };
    if (word.length < 3 || kw.length < 3) return { matched: false };

    if (kw.length === 4) {
      if (word[0] === kw[0] && Math.abs(word.length - kw.length) <= 1) {
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

    if (kw.length >= 5 && kw.length <= 7) {
      const dist = levenshteinDistance(word, kw);
      const maxLen = Math.max(word.length, kw.length);
      const sim = 1 - dist / maxLen;
      if (dist <= 2 && sim >= 0.65) {
        return { matched: true, isFuzzy: true, sim, dist };
      }
    } else if (kw.length >= 8) {
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
   * Fast rule-based NLP classifier with typo tolerance and Gemini API fallback.
   * Accurately maps both Primary Category and Subcategory.
   */
  static async predict(title: string): Promise<CategoryPrediction> {
    if (!title || title.trim().length === 0) {
      return {
        category: 'Food & Dining',
        subCategory: 'Groceries & Dark Stores',
        confidence: 0.5,
        source: 'nlp_rule_engine',
      };
    }

    const cleanTitle = title.toLowerCase().trim();
    const words = cleanTitle.split(/[^a-z0-9]+/).filter((w) => w.length >= 2);

    // 1. Check BRAND keywords first (Brand takes absolute precedence)
    for (const rule of CATEGORY_RULES) {
      for (const kw of rule.keywords) {
        if (!BRAND_KEYWORDS.has(kw)) continue;

        if (kw.includes(' ')) {
          if (cleanTitle.includes(kw)) {
            return {
              category: rule.category,
              subCategory: rule.subCategory,
              confidence: 0.98,
              source: 'nlp_rule_engine',
              matchedKeywords: [kw],
              matchReason: `Matched "${kw}"`,
              isFuzzy: false,
            };
          }
        } else {
          for (const word of words) {
            const m = this.checkWordMatch(word, kw);
            if (m.matched) {
              return {
                category: rule.category,
                subCategory: rule.subCategory,
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

    // 2. Exact match check
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
          return {
            category: rule.category,
            subCategory: rule.subCategory,
            confidence: 0.95,
            source: 'nlp_rule_engine',
            matchedKeywords: [kw],
            matchReason: `Matched "${kw}"`,
            isFuzzy: false,
          };
        }
      }
    }

    // 3. Typo-Tolerant & Misspelled Fuzzy Keyword Matching
    let bestFuzzyMatch: CategoryPrediction | null = null;
    let bestFuzzyScore = 0;

    for (const rule of CATEGORY_RULES) {
      for (const kw of rule.keywords) {
        if (!kw.includes(' ')) {
          for (const word of words) {
            const m = this.checkWordMatch(word, kw);
            if (m.matched) {
              const score = m.sim! * rule.weight + (word[0] === kw[0] ? 0.05 : -0.05);
              if (score > bestFuzzyScore) {
                bestFuzzyScore = score;
                bestFuzzyMatch = {
                  category: rule.category,
                  subCategory: rule.subCategory,
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

    // 4. Gemini API Fallback if available
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
      category: 'Food & Dining',
      subCategory: 'Groceries & Dark Stores',
      confidence: 0.5,
      source: 'nlp_rule_engine',
    };
  }

  private static async callGemini(
    title: string,
    apiKey: string,
  ): Promise<CategoryPrediction | null> {
    const prompt = `Classify this shared group/roommate expense title into EXACTLY one of these categories:
Categories:
- Food & Dining
- Bills & Utilities
- Transit & Travel
- Shopping & E-Commerce
- Entertainment & Leisure
- Health & Well-being
- Education & Career
- Transfers & Settlements

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

  static async predictCategory(title: string): Promise<CategoryPrediction> {
    return this.predict(title);
  }
}
