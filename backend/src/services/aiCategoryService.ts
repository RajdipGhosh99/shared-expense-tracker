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
  'haldiram',
  'haldirams',
  'bikanervala',
  'barbeque nation',
  'truffles',
  'box8',
  'faasos',
  'ovenstory',
  'freshmenu',
  'licious',
  'fresh to home',
  'country delight',
  'third wave',
  'blue tokai',
  // Bills & Utilities
  'bescom',
  'tata power',
  'torrent power',
  'adani electricity',
  'msedcl',
  'tneb',
  'bses',
  'cesc',
  'dhbvn',
  'uppcl',
  'act fibernet',
  'act fiber',
  'jio fiber',
  'jiofiber',
  'airtel xstream',
  'airtel fiber',
  'airtel',
  'jio',
  'vi',
  'vodafone',
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
  'nobroker',
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
  'akasa',
  'spicejet',
  'redbus',
  'abhibus',
  'zoomcar',
  'revv',
  'hpcl',
  'indian oil',
  'iocl',
  'bpcl',
  'shell',
  'fastag',
  'airbnb',
  'makemytrip',
  'goibibo',
  'cleartrip',
  'agoda',
  'booking.com',
  'oyo',
  // Shopping & Lifestyle
  'myntra',
  'ajio',
  'amazon',
  'flipkart',
  'meesho',
  'croma',
  'reliance digital',
  'vijay sales',
  'ikea',
  'pepperfry',
  'urban ladder',
  'nykaa',
  'purplle',
  'zara',
  'h&m',
  'uniqlo',
  'snitch',
  'westside',
  'decathlon',
  'lenskart',
  // Entertainment & Leisure
  'netflix',
  'hotstar',
  'disney',
  'spotify',
  'prime video',
  'youtube',
  'apple music',
  'bookmyshow',
  'pvr',
  'inox',
  'cinepolis',
  'playo',
  'steam',
  'playstation',
  'xbox',
  // Health & Wellness
  'apollo',
  'apollo pharmacy',
  'pharmeasy',
  '1mg',
  'tata 1mg',
  'medplus',
  'netmeds',
  'practo',
  'cult',
  'cult.fit',
  'cultfit',
  'curefit',
  'lal pathlabs',
  'metropolis',
  // Education & Work
  'udemy',
  'coursera',
  'edx',
  'github',
  'openai',
  'chatgpt',
  'claude',
  'figma',
  'notion',
  'cursor',
  'jetbrains',
  'slack',
  'zoom',
  'linkedin',
  'vercel',
  'aws',
  'gcp',
  // Transfers & Adjustments
  'cred',
  'zerodha',
  'groww',
  'upstox',
  'indmoney',
  'paytm',
  'phonepe',
  'gpay',
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
      'flour',
      'maida',
      'suji',
      'besan',
      'rice',
      'basmati',
      'dal',
      'pulses',
      'rajma',
      'chana',
      'oil',
      'cooking oil',
      'mustard oil',
      'sunflower oil',
      'ghee',
      'butter',
      'cheese',
      'spices',
      'masala',
      'haldi',
      'mirchi',
      'salt',
      'sugar',
      'tea leaves',
      'coffee powder',
      'biscuit',
      'biscuits',
      'cookies',
      'chips',
      'namkeen',
      'meat',
      'chicken',
      'mutton',
      'fish',
      'prawns',
      'seafood',
      'licious',
      'fresh to home',
      'country delight',
      'dry fruits',
      'almonds',
      'cashews',
      'kaju',
      'badam',
      'oats',
      'muesli',
      'cornflakes',
      'cereal',
      'honey',
      'jam',
      'ketchup',
      'sauce',
      'mayo',
      'mayonnaise',
      'maggi',
      'noodles',
      'pasta',
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
      'ovenstory',
      'freshmenu',
      'food delivery',
      'takeaway',
      'tiffin',
      'dabba',
      'meal box',
      'cloud kitchen',
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
      'latte',
      'cappuccino',
      'espresso',
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
      'gelato',
      'waffle',
      'pancake',
      'truffles',
      'barbeque nation',
      'haldiram',
      'haldirams',
      'bikanervala',
      'sweet shop',
      'sweets',
      'mithai',
      'bakery',
      'cake',
      'pastry',
      'pastries',
      'momos',
      'shawarma',
      'roll',
      'rolls',
      'thali',
      'paratha',
      'dosa',
      'idli',
      'vada',
      'samosa',
      'chaat',
      'street food',
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
      'whisky',
      'vodka',
      'rum',
      'gin',
      'tequila',
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
      'drinks',
      'beverages',
      'chakhna',
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
      'uppcl',
      'eb bill',
      'power supply',
      'electric meter',
      'generator charges',
      'power',
      'inverter',
      'generator',
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
      'gas cylinder',
      'lpg',
      'tanker',
      'cooking gas',
      'png',
      'water bill',
      'jal board',
      'bwssb',
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
      'mobile recharge',
      'phone recharge',
      'dth',
      'tata play',
      'dish tv',
      'airtel dth',
      'cable tv',
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
      'maintenance advance',
      'advance rent',
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
      'nobroker',
      'nobrokerhood',
      'urban company',
      'plumber',
      'electrician',
      'carpenter',
      'deep cleaning',
      'pest control',
      'housekeeping',
      'garbage collection',
      'waste collection',
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
      'auto fare',
      'rickshaw',
      'cab',
      'taxi',
      'metro',
      'metro card',
      'metro cards',
      'metro recharge',
      'bmtc',
      'dtc',
      'best bus',
      'local bus',
      'ride',
      'commute',
      'bike taxi',
      'quick ride',
      'carpool',
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
      'ev charging',
      'fastag',
      'fastag recharge',
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
      'air ticket',
      'indigo',
      'air india',
      'vistara',
      'akasa',
      'spicejet',
      'train',
      'trains',
      'irctc',
      'tatkal',
      'bus ticket',
      'redbus',
      'abhibus',
      'zoomcar',
      'revv',
      'car rental',
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
      'trip',
      'sightseeing',
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
      'tyre',
      'tire',
      'engine oil',
      'wheel alignment',
      'challan',
      'traffic fine',
      'pollution check',
      'puc',
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
      'earbuds',
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
      'power bank',
      'hard drive',
      'ssd',
      'pendrive',
      'extension cord',
      'spike buster',
      'bulb',
      'led bulb',
      'tube light',
      'batteries',
      'battery',
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
      'meesho',
      'clothes',
      'clothing',
      'shoes',
      'sneakers',
      'sandals',
      'slippers',
      'apparel',
      'fashion',
      'footwear',
      'shirt',
      't-shirt',
      'tshirt',
      'jeans',
      'trousers',
      'shorts',
      'hoodie',
      'jacket',
      'dress',
      'kurta',
      'socks',
      'snitch',
      'westside',
      'lifestyle',
      'trends',
      'decathlon',
      'lenskart',
      'spectacles',
      'glasses',
      'sunglasses',
      'watch',
      'smartwatch',
      'wallet',
      'belt',
      'backpack',
      'bag',
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
      'pillow',
      'cushion',
      'curtains',
      'curtain',
      'bedsheet',
      'blanket',
      'quilt',
      'ikea',
      'pepperfry',
      'urban ladder',
      'furniture',
      'home decor',
      'utensils',
      'pan',
      'tawa',
      'cooker',
      'pressure cooker',
      'toaster',
      'kettle',
      'electric kettle',
      'mop',
      'bucket',
      'dustbin',
      'broom',
      'hanger',
      'hangers',
      'mirror',
      'clock',
      'shoe rack',
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
      'razor',
      'shaving cream',
      'trimmer',
      'skincare',
      'sunscreen',
      'perfume',
      'deodorant',
      'deo',
      'body wash',
      'soap',
      'nykaa',
      'purplle',
      'facewash',
      'shampoo',
      'conditioner',
      'hair oil',
      'moisturizer',
      'lotion',
      'toothpaste',
      'toothbrush',
      'face wash',
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
      'amazon prime',
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
      'subscriptions',
      'jiocinema',
      'sonyliv',
      'zee5',
      'audible',
      'kindle unlimited',
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
      'movies',
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
      'theatre',
      'play ticket',
      'amusement park',
      'water park',
      'wonderla',
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
      'football turf',
      'cricket turf',
      'box cricket',
      'badminton court rentals',
      'badminton court',
      'badminton',
      'gaming',
      'playo',
      'steam',
      'playstation',
      'ps5',
      'xbox',
      'nintendo',
      'board games',
      'board game',
      'swimming pool',
      'snooker',
      'pool table',
      'billiards',
      'arcade',
      'bowling',
      'go karting',
      'laser tag',
      'escape room',
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
      'bandaid',
      'paracetamol',
      'crocin',
      'dolo',
      'chemist',
      'medical store',
      'antiseptic',
      'dettol',
      'savlon',
      'inhaler',
      'vitamins',
      'supplements',
      'eye drops',
      'cough syrup',
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
      'dr consultation',
      'physician',
      'lab tests',
      'lab test',
      'dental visits',
      'dental visit',
      'dental',
      'dentist',
      'teeth cleaning',
      'clinic',
      'hospital',
      'practo',
      'diagnostics',
      'blood test',
      'lal pathlabs',
      'metropolis',
      'health checkup',
      'full body checkup',
      'x-ray',
      'xray',
      'mri',
      'ultrasound',
      'ecg',
      'physiotherapy',
      'dermatologist',
      'therapy',
      'counseling',
    ],
  },
  {
    category: 'Health & Wellness',
    subCategory: 'Fitness & Gym',
    weight: 0.95,
    keywords: [
      'cult',
      'cult.fit',
      'cultfit',
      'curefit',
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
      'protein powder',
      'creatine',
      'bcaa',
      'pre workout',
      'gym membership',
      'zumba',
      'swimming class',
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
      'exam fees',
      'aws cert',
      'tuition',
      'coaching',
      'classes',
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
      'slack',
      'zoom',
      'linkedin premium',
      'aws bill',
      'aws',
      'gcp',
      'azure',
      'vercel',
      'domain',
      'godaddy',
      'namecheap',
      'cloudflare',
      'work tools',
      'technical books',
      'kindle',
      'stationery',
      'notebook',
      'pen',
      'stapler',
      'printout',
      'photocopy',
      'xerox',
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
      'paytm transfer',
      'gpay transfer',
      'phonepe transfer',
      'i owe you',
      'splitwise settle',
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
      'axis cc',
      'amex',
      'billdesk',
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
      'digital gold',
      'fixed deposit',
      'fd',
      'ppf',
      'nps',
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
        category: 'Other',
        subCategory: 'Other',
        confidence: 0.3,
        source: 'nlp_rule_engine',
        matchReason: 'Empty title, defaulted to Other',
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
