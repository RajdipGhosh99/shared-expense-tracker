import { Injectable } from '@angular/core';
import { ExpenseCategory } from '@shared-expense-tracker/shared';

export interface AiPrediction {
  category: ExpenseCategory;
  confidence: number;
  matchedKeyword?: string;
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

const RULES: { category: ExpenseCategory; weight: number; keywords: string[] }[] = [
  {
    category: 'Food & Dining',
    weight: 1.0,
    keywords: [
      // Groceries & Dark Stores
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
      // Delivery & Takeaway
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
      // Cafes & Restaurants
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
      'hotel',
      'dessert',
      'ice cream',
      // Alcohol & Nightlife
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
  {
    category: 'Bills & Utilities',
    weight: 1.0,
    keywords: [
      // Power & Grid
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
      // Water & Gas
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
      // Fiber & Telecom
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
      // Society Maintenance & Domestic Help
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
      // Rent & Housing
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
  {
    category: 'Transit & Travel',
    weight: 1.0,
    keywords: [
      // Daily Commute
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
      // Fuel & Fastag
      'petrol',
      'diesel',
      'fuel',
      'cng',
      'fastag',
      'toll',
      'parking',
      'car wash',
      // Flights, Trains & Intercity
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
      // Stays & Lodging
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
  {
    category: 'Shopping & E-Commerce',
    weight: 0.95,
    keywords: [
      // Fashion & Apparel
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
      // Electronics & Tech
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
      // Home Decor & Appliances
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
      // Quick Retail & Courier
      'courier',
      'dunzo',
      'porter',
      'packaging',
      'stationary',
      'printout',
      'xerox',
    ],
  },
  {
    category: 'Entertainment & Leisure',
    weight: 0.95,
    keywords: [
      // Digital OTT & Cloud Subscriptions
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
      // Movies, Concerts & Live Events
      'bookmyshow',
      'pvr',
      'inox',
      'cinema',
      'movie',
      'imax',
      'concert',
      'standup',
      'comedy show',
      // Gaming & Hobbies
      'steam',
      'playstation',
      'xbox',
      'nintendo',
      'board games',
      'kindle',
      // Sports & Fitness
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
  {
    category: 'Health & Well-being',
    weight: 0.95,
    keywords: [
      // Pharmacy & Diagnostics
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
      // Consultations & Hospital
      'doctor',
      'clinic',
      'consultation',
      'dentist',
      'hospital',
      'practo',
      'therapy',
      // Personal Grooming & Salon
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
  {
    category: 'Education & Career',
    weight: 0.95,
    keywords: [
      // Courses, Certifications & Books
      'udemy',
      'coursera',
      'edx',
      'linkedin learning',
      'certification',
      'aws certified',
      'exam fee',
      'textbook',
      // Professional Tools & Subscriptions
      'github',
      'copilot',
      'figma',
      'cursor',
      'jetbrains',
      'notion',
      'godaddy',
      'vercel',
      'aws bill',
      // Conferences & Upskilling
      'conference',
      'workshop',
      'hackathon',
      'seminar',
      'webinar',
      'upskilling',
    ],
  },
  {
    category: 'Transfers & Settlements',
    weight: 1.0,
    keywords: [
      // P2P Split Settlement
      'settlement',
      'settle',
      'paid back',
      'repayment',
      'upi return',
      'cash settlement',
      'split repayment',
      // Credit Card Bill Repayment
      'credit card',
      'cc bill',
      'cred',
      'hdfc cc',
      'icici cc',
      'sbi card',
      'card bill',
      // Self Account Transfer
      'self transfer',
      'bank transfer',
      'account transfer',
      'savings',
      // Investments
      'mutual fund',
      'sip',
      'zerodha',
      'groww',
      'coin',
      'stocks',
      'gold',
      'fd',
    ],
  },
];

@Injectable({
  providedIn: 'root',
})
export class AiCategoryService {
  private checkWordMatch(
    word: string,
    kw: string,
  ): { matched: boolean; isFuzzy?: boolean; sim?: number; dist?: number } {
    if (word === kw) return { matched: true, isFuzzy: false, sim: 1.0, dist: 0 };
    if (word.length < 3 || kw.length < 3) return { matched: false };

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

  predict(title: string): AiPrediction {
    if (!title || !title.trim()) {
      return { category: 'Food & Dining', confidence: 0.5 };
    }

    const clean = title.toLowerCase().trim();
    const words = clean.split(/[^a-z0-9]+/).filter((w) => w.length >= 2);

    // 1. Check BRAND keywords first (Brand takes absolute precedence)
    for (const rule of RULES) {
      for (const kw of rule.keywords) {
        if (!BRAND_KEYWORDS.has(kw)) continue;

        if (kw.includes(' ')) {
          if (clean.includes(kw)) {
            return {
              category: rule.category,
              confidence: 0.98,
              matchedKeyword: kw,
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
                confidence: m.isFuzzy ? 0.9 : 0.98,
                matchedKeyword: kw,
                matchReason: m.isFuzzy ? `Matched "${word}" ≈ "${kw}"` : `Matched "${kw}"`,
                isFuzzy: m.isFuzzy,
              };
            }
          }
        }
      }
    }

    // 2. Exact match check
    for (const rule of RULES) {
      for (const kw of rule.keywords) {
        let isMatch = false;
        if (kw.includes(' ')) {
          if (clean.includes(kw)) isMatch = true;
        } else {
          const regex = new RegExp(`\\b${kw}\\b`, 'i');
          if (regex.test(clean)) isMatch = true;
        }

        if (isMatch) {
          return {
            category: rule.category,
            confidence: 0.95,
            matchedKeyword: kw,
            matchReason: `Matched "${kw}"`,
            isFuzzy: false,
          };
        }
      }
    }

    // 3. Typo-Tolerant & Misspelled Fuzzy Keyword Matching
    let bestFuzzyMatch: AiPrediction | null = null;
    let bestFuzzyScore = 0;

    for (const rule of RULES) {
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
                  confidence: Math.min(Math.round((0.75 + m.sim! * 0.2) * 100) / 100, 0.95),
                  matchedKeyword: kw,
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

    return { category: 'Food & Dining', confidence: 0.5 };
  }
}
