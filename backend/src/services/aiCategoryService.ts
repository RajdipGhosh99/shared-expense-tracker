import { ExpenseCategory } from '@shared-expense-tracker/shared';

export interface CategoryPrediction {
  category: ExpenseCategory;
  confidence: number; // 0.0 - 1.0
  source: 'gemini' | 'nlp_rule_engine';
  matchedKeywords?: string[];
}

const CATEGORY_RULES: { category: ExpenseCategory; weight: number; keywords: string[] }[] = [
  {
    category: 'Groceries',
    weight: 1.0,
    keywords: [
      'blinkit',
      'zepto',
      'instamart',
      'bigbasket',
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
      'bisleri',
      'water can',
      'water tanker',
      'water jar',
      '20l can',
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
   * Predict expense category using rule-based NLP + optional Gemini API
   */
  static async predictCategory(title: string): Promise<CategoryPrediction> {
    if (!title || title.trim().length === 0) {
      return { category: 'Other', confidence: 0.5, source: 'nlp_rule_engine' };
    }

    const cleanTitle = title.toLowerCase().trim();

    // 1. Fast, highly-accurate NLP keyword rule matching
    let bestCategory: ExpenseCategory = 'Other';
    let highestScore = 0;
    let matchedKeywords: string[] = [];

    for (const rule of CATEGORY_RULES) {
      for (const kw of rule.keywords) {
        // Word boundary match or exact substring match
        const regex = new RegExp(`\\b${kw}\\b`, 'i');
        if (regex.test(cleanTitle) || cleanTitle.includes(kw)) {
          // Calculate score based on keyword length relative to title and rule weight
          const score = (kw.length / Math.max(cleanTitle.length, 1)) * 0.5 + rule.weight * 0.5;
          if (score > highestScore) {
            highestScore = score;
            bestCategory = rule.category;
            matchedKeywords = [kw];
          }
        }
      }
    }

    // High confidence keyword match
    if (highestScore >= 0.55 && bestCategory !== 'Other') {
      return {
        category: bestCategory,
        confidence: Math.min(Math.round((0.8 + highestScore * 0.2) * 100) / 100, 0.99),
        source: 'nlp_rule_engine',
        matchedKeywords,
      };
    }

    // 2. If Gemini API key is available, call Gemini Flash API
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey && geminiKey.trim().length > 10) {
      try {
        const geminiResult = await this.callGemini(title, geminiKey);
        if (geminiResult) return geminiResult;
      } catch (err) {
        console.warn('[AiCategoryService] Gemini API call skipped or failed:', err);
      }
    }

    // Fallback result
    return {
      category: bestCategory,
      confidence: highestScore > 0 ? 0.75 : 0.45,
      source: 'nlp_rule_engine',
      matchedKeywords,
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
