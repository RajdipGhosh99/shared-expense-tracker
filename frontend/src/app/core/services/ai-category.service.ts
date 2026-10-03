import { Injectable } from '@angular/core';
import { ExpenseCategory } from '@shared-expense-tracker/shared';

export interface AiPrediction {
  category: ExpenseCategory;
  confidence: number;
  matchedKeyword?: string;
}

const RULES: { category: ExpenseCategory; keywords: string[] }[] = [
  {
    category: 'Groceries',
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
      'milk',
      'curd',
      'paneer',
      'amul',
      'nandini',
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
      'masala',
      'chicken',
      'meat',
      'fish',
      'licious',
    ],
  },
  {
    category: 'Rent',
    keywords: [
      'rent',
      'flat rent',
      'room rent',
      'house rent',
      'landlord',
      'maintenance',
      'society maintenance',
      'deposit',
      'brokerage',
      'lease',
    ],
  },
  {
    category: 'Electricity',
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
      'eb bill',
    ],
  },
  {
    category: 'Wi-Fi',
    keywords: [
      'wifi',
      'wi-fi',
      'internet',
      'act fibernet',
      'act fiber',
      'act broadband',
      'jio fiber',
      'jiofiber',
      'airtel xstream',
      'airtel fiber',
      'broadband',
      'router',
      'hathway',
      'excitel',
    ],
  },
  {
    category: 'Maid & Cook',
    keywords: [
      'maid',
      'cook',
      'maid salary',
      'cook salary',
      'bai',
      'kamwali',
      'sweeper',
      'cleaning lady',
      'helper',
      'dusting',
      'pocha',
      'jhadu',
    ],
  },
  {
    category: 'Drinking Water',
    keywords: [
      'bisleri',
      'water can',
      'water tanker',
      'water jar',
      '20l',
      '20 litre',
      'drinking water',
      'aquaguard',
      'kinley',
      'bailley',
      'tanker',
    ],
  },
  {
    category: 'Household',
    keywords: [
      'detergent',
      'surf excel',
      'ariel',
      'vim',
      'dishwash',
      'harpic',
      'colin',
      'lizol',
      'mop',
      'broom',
      'dustbin',
      'garbage',
      'pest control',
      'urban company',
      'urbanclap',
      'plumber',
      'electrician',
      'all out',
      'goodknight',
      'mosquito',
      'tissue',
      'handwash',
    ],
  },
  {
    category: 'Food & Dining',
    keywords: [
      'swiggy',
      'zomato',
      'mcdonald',
      'mcd',
      'kfc',
      'burger king',
      'dominos',
      'domino',
      'pizza',
      'subway',
      'starbucks',
      'chai point',
      'chaayos',
      'chai',
      'tea',
      'coffee',
      'biryani',
      'lunch',
      'dinner',
      'breakfast',
      'brunch',
      'snacks',
      'restaurant',
      'cafe',
      'beer',
      'wine',
      'alcohol',
      'pub',
      'bar',
    ],
  },
  {
    category: 'Other',
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
      'toll',
      'medicine',
      'pharmacy',
      'apollo',
      'pharmeasy',
      'cinema',
      'movie',
      'netflix',
      'prime',
      'spotify',
      'cult',
      'gym',
    ],
  },
];

@Injectable({
  providedIn: 'root',
})
export class AiCategoryService {
  predict(title: string): AiPrediction {
    if (!title || !title.trim()) {
      return { category: 'Other', confidence: 0.5 };
    }

    const clean = title.toLowerCase().trim();

    for (const rule of RULES) {
      for (const kw of rule.keywords) {
        const regex = new RegExp(`\\b${kw}\\b`, 'i');
        if (regex.test(clean) || clean.includes(kw)) {
          return {
            category: rule.category,
            confidence: 0.95,
            matchedKeyword: kw,
          };
        }
      }
    }

    return { category: 'Other', confidence: 0.5 };
  }
}
