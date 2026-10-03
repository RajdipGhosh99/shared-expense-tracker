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
  'mcdonalds',
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
  'indane',
  'bharat gas',
  'hp gas',
  'mygate',
  'urban company',
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
  'hpcl',
  'indian oil',
  'fastag',
  'airbnb',
  'makemytrip',
  // Shopping & Lifestyle
  'myntra',
  'ajio',
  'amazon',
  'flipkart',
  'croma',
  'ikea',
  'pepperfry',
  'urban ladder',
  'nykaa',
  'purplle',
  // Entertainment & Leisure
  'netflix',
  'hotstar',
  'spotify',
  'bookmyshow',
  'pvr',
  'inox',
  'playo',
  // Health & Wellness
  'apollo',
  'apollo pharmacy',
  'pharmeasy',
  '1mg',
  'tata 1mg',
  'medplus',
  'practo',
  'cult',
  'cult.fit',
  // Education & Work
  'udemy',
  'coursera',
  'github',
  'openai',
  'chatgpt',
  'figma',
  'notion',
  'cursor',
  // Transfers & Adjustments
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
      'country delight',
    ],
  },
  {
    category: 'Food & Dining',
    subCategory: 'Food Delivery',
    weight: 1.0,
    keywords: [
      'swiggy',
      'zomato',
      'eatsure',
      'behrouz',
      'box8',
      'mojo pizza',
      'faasos',
      'oven story',
      'freshmenu',
      'food delivery',
      'takeaway',
    ],
  },
  {
    category: 'Food & Dining',
    subCategory: 'Dine-in & Cafes',
    weight: 0.95,
    keywords: [
      'starbucks',
      'mcdonald',
      'mcdonalds',
      'mcd',
      'kfc',
      'burger king',
      'subway',
      'dominos',
      'domino',
      'pizza hut',
      'pizza',
      'burger',
      'biryani',
      'meghana',
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
      'dine in',
      'dine-in',
      'dhaba',
      'dessert',
      'ice cream',
      'truffles',
      'barbeque nation',
    ],
  },
  {
    category: 'Food & Dining',
    subCategory: 'Nightlife & Social',
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
      'microbrewery',
      'cocktail',
      'cocktails',
      'party drinks',
      'byob',
      'social',
      'toit',
      'byg brewski',
      'ironhill',
      'windmills',
      'lounge',
      'nightclub',
    ],
  },

  // 2. Bills & Utilities
  {
    category: 'Bills & Utilities',
    subCategory: 'Electricity & Power',
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
      'generator charges',
      'power',
    ],
  },
  {
    category: 'Bills & Utilities',
    subCategory: 'Water & Cooking Gas',
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
      'cooking gas',
      'png',
    ],
  },
  {
    category: 'Bills & Utilities',
    subCategory: 'Internet & Telecom',
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
      'airtel',
      'jio',
      'vi',
      'vodafone',
      'hathway',
      'spectra',
      'excitel',
      'broadband',
      'router',
      'fibernet',
      'telecom',
      'postpaid',
      'landline',
      'recharge',
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
      'lease payments',
    ],
  },
  {
    category: 'Bills & Utilities',
    subCategory: 'Society & Domestic Help',
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
      'maintenance dues',
      'maintenance charge',
      'maintenance',
      'mygate',
      'urban company',
      'plumber',
      'electrician',
      'housekeeping',
    ],
  },

  // 3. Transit & Travel
  {
    category: 'Transit & Travel',
    subCategory: 'Daily Commute',
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
      'metro cards',
      'bmtc',
      'dtc',
      'ride',
      'commute',
      'bike taxi',
      'quick ride',
    ],
  },
  {
    category: 'Transit & Travel',
    subCategory: 'Fuel & Tolls',
    weight: 1.0,
    keywords: [
      'petrol',
      'diesel',
      'fuel',
      'cng',
      'fastag',
      'toll',
      'tolls',
      'highway toll',
      'hpcl',
      'indian oil',
      'iocl',
      'bharat petroleum',
      'bpcl',
      'shell',
    ],
  },
  {
    category: 'Transit & Travel',
    subCategory: 'Outstation & Holidays',
    weight: 1.0,
    keywords: [
      'flight',
      'flights',
      'indigo',
      'air india',
      'vistara',
      'akasa',
      'train',
      'trains',
      'irctc',
      'tatkal',
      'bus ticket',
      'redbus',
      'abhibus',
      'zoomcar',
      'hotel',
      'hotels',
      'airbnb',
      'resort',
      'hostel',
      'homestay',
      'oyo',
      'makemytrip',
      'mmt',
      'goibibo',
      'cleartrip',
      'agoda',
      'booking.com',
      'lodging',
      'stays',
      'outstation',
      'holiday',
      'vacation',
    ],
  },
  {
    category: 'Transit & Travel',
    subCategory: 'Vehicle Maintenance',
    weight: 0.95,
    keywords: [
      'servicing',
      'service',
      'bike service',
      'car service',
      'washing',
      'car wash',
      'bike wash',
      'parking fees',
      'parking fee',
      'parking',
      'mechanic',
      'repairs',
      'puncture',
      'wheel alignment',
    ],
  },

  // 4. Shopping & Lifestyle
  {
    category: 'Shopping & Lifestyle',
    subCategory: 'Electronics & Hardware',
    weight: 0.95,
    keywords: [
      'gadgets',
      'cables',
      'accessories',
      'tech equipment',
      'charger',
      'cable',
      'headphone',
      'headphones',
      'earphones',
      'airpods',
      'laptop',
      'monitor',
      'keyboard',
      'mouse',
      'croma',
      'reliance digital',
      'vijay sales',
      'apple store',
      'adapter',
      'usb',
      'hdmi',
    ],
  },
  {
    category: 'Shopping & Lifestyle',
    subCategory: 'Apparel & Fashion',
    weight: 0.95,
    keywords: [
      'myntra',
      'ajio',
      'zara',
      'h&m',
      'uniqlo',
      'clothes',
      'clothing',
      'shoes',
      'sneakers',
      'apparel',
      'fashion',
      'footwear',
      'shirt',
      't-shirt',
      'jeans',
      'dress',
      'snitch',
      'westside',
      'lifestyle',
      'trends',
    ],
  },
  {
    category: 'Shopping & Lifestyle',
    subCategory: 'Home & Living',
    weight: 0.95,
    keywords: [
      'shared appliances',
      'cookware',
      'decor',
      'microwave',
      'air fryer',
      'beanbag',
      'mattress',
      'curtains',
      'curtain',
      'bedsheet',
      'ikea',
      'pepperfry',
      'urban ladder',
      'furniture',
      'home decor',
      'utensils',
      'toaster',
      'kettle',
      'mop',
      'bucket',
      'local marts',
    ],
  },
  {
    category: 'Shopping & Lifestyle',
    subCategory: 'Personal Care',
    weight: 0.95,
    keywords: [
      'grooming products',
      'cosmetics',
      'salon visits',
      'salon',
      'haircut',
      'spa',
      'massage',
      'shaving',
      'trimmer',
      'skincare',
      'sunscreen',
      'perfume',
      'deodorant',
      'nykaa',
      'purplle',
      'facewash',
      'shampoo',
      'grooming',
    ],
  },

  // 5. Entertainment & Leisure
  {
    category: 'Entertainment & Leisure',
    subCategory: 'Digital Subscriptions',
    weight: 0.95,
    keywords: [
      'netflix',
      'spotify',
      'prime',
      'prime video',
      'youtube',
      'youtube premium',
      'hotstar',
      'disney',
      'apple music',
      'apple tv',
      'google one',
      'icloud',
      'ott streaming',
      'cloud storage',
      'subscription',
    ],
  },
  {
    category: 'Entertainment & Leisure',
    subCategory: 'Movies & Events',
    weight: 0.95,
    keywords: [
      'bookmyshow',
      'pvr',
      'inox',
      'cinepolis',
      'cinema tickets',
      'cinema',
      'movie tickets',
      'movie',
      'imax',
      'concerts',
      'concert',
      'live matches',
      'live match',
      'live events',
      'live event',
      'standup comedy',
      'standup',
      'comedy show',
      'match ticket',
      'ipl ticket',
    ],
  },
  {
    category: 'Entertainment & Leisure',
    subCategory: 'Sports & Hobbies',
    weight: 0.95,
    keywords: [
      'turf bookings',
      'turf booking',
      'turf',
      'badminton court rentals',
      'badminton court',
      'badminton',
      'gaming',
      'playo',
      'steam',
      'playstation',
      'xbox',
      'nintendo',
      'board games',
      'board game',
      'cricket turf',
      'box cricket',
      'swimming pool',
      'snooker',
      'billiards',
      'arcade',
    ],
  },

  // 6. Health & Wellness
  {
    category: 'Health & Wellness',
    subCategory: 'Medicines & Pharmacy',
    weight: 0.95,
    keywords: [
      'apollo pharmacy',
      'apollo',
      'tata 1mg',
      '1mg',
      'pharmeasy',
      'medplus',
      'netmeds',
      'prescriptions',
      'otc meds',
      'first aid',
      'medicine',
      'medicines',
      'pharmacy',
      'tablets',
      'tablet',
      'syrup',
      'bandage',
      'paracetamol',
      'chemist',
    ],
  },
  {
    category: 'Health & Wellness',
    subCategory: 'Diagnostics & Doctors',
    weight: 0.95,
    keywords: [
      'doctor consultation fees',
      'doctor consultation',
      'doctor',
      'lab tests',
      'lab test',
      'dental visits',
      'dental visit',
      'dental',
      'dentist',
      'clinic',
      'hospital',
      'practo',
      'diagnostics',
      'blood test',
      'lal pathlabs',
      'metropolis',
      'health checkup',
    ],
  },
  {
    category: 'Health & Wellness',
    subCategory: 'Fitness & Gym',
    weight: 0.95,
    keywords: [
      'cult',
      'cult.fit',
      'gym subscriptions',
      'gym subscription',
      'gym',
      'sports memberships',
      'personal trainers',
      'personal trainer',
      'fitness',
      'yoga',
      'crossfit',
      'pilates',
      'whey protein',
      'creatine',
      'gym membership',
    ],
  },

  // 7. Education & Work
  {
    category: 'Education & Work',
    subCategory: 'Upskilling & Courses',
    weight: 0.95,
    keywords: [
      'udemy',
      'coursera',
      'edx',
      'certifications',
      'certification',
      'online bootcamps',
      'bootcamp',
      'course',
      'courses',
      'training',
      'upskilling',
      'workshop',
      'webinar',
    ],
  },
  {
    category: 'Education & Work',
    subCategory: 'Books & Work Tools',
    weight: 0.95,
    keywords: [
      'development tools',
      'professional books',
      'software licenses',
      'github',
      'copilot',
      'openai',
      'chatgpt',
      'cursor',
      'claude',
      'figma',
      'notion',
      'jetbrains',
      'aws bill',
      'aws',
      'gcp',
      'vercel',
      'domain',
      'cloudflare',
      'work tools',
      'technical books',
      'kindle',
    ],
  },

  // 8. Transfers & Adjustments
  {
    category: 'Transfers & Adjustments',
    subCategory: 'Split Settlement',
    weight: 1.0,
    keywords: [
      'p2p payments',
      'split settlement',
      'settlement',
      'settle dues',
      'settled up',
      'settle',
      'upi transfers',
      'upi transfer',
      'cash settlements',
      'cash settlement',
      'paid back',
      'repayment',
      'p2p split settlement',
      'reimbursement',
    ],
  },
  {
    category: 'Transfers & Adjustments',
    subCategory: 'Credit Card Repayment',
    weight: 1.0,
    keywords: [
      'credit card repayment',
      'credit card bill',
      'credit card payment',
      'credit card statements',
      'credit card',
      'cred',
      'net banking',
      'cc bill',
      'hdfc cc',
      'icici cc',
      'sbi card',
      'amex',
    ],
  },
  {
    category: 'Transfers & Adjustments',
    subCategory: 'Investments & Savings',
    weight: 1.0,
    keywords: [
      'mutual funds',
      'mutual fund',
      'stocks',
      'recurring deposits',
      'recurring deposit',
      'zerodha',
      'groww',
      'upstox',
      'kite',
      'indmoney',
      'sip',
      'gold',
      'fixed deposit',
      'fd',
    ],
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

    // Default fallback: if not able to identify, set as 'Other' fallback
    return {
      category: 'Other',
      subCategory: 'Other',
      confidence: 0.3,
      source: 'nlp_rule_engine',
      matchReason: 'Unrecognized category, defaulted to Other',
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
- Shopping & Lifestyle
- Entertainment & Leisure
- Health & Wellness
- Education & Work
- Transfers & Adjustments
- Other

Expense Title: "${title}"

Return ONLY a valid JSON object in this exact format, with no markdown code fences:
{"category": "CategoryName", "subCategory": "SubCategoryName", "confidence": 0.95}`;

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
        subCategory: parsed.subCategory,
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
