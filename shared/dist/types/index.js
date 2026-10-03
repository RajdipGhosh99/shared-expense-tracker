export const DEFAULT_GROUP_FORM_CONTROLS = {
    amount: 'mandatory',
    title: 'mandatory',
    date: 'mandatory',
    category: 'mandatory',
    subCategory: 'editable',
    splitType: 'editable',
    notes: 'editable',
};
export const CATEGORY_TAXONOMY = {
    'Food & Dining': [
        'Groceries & Dark Stores',
        'Food Delivery',
        'Dine-in & Cafes',
        'Nightlife & Social',
    ],
    'Bills & Utilities': [
        'Electricity & Power',
        'Water & Cooking Gas',
        'Internet & Telecom',
        'Rent & Housing',
        'Society & Domestic Help',
    ],
    'Transit & Travel': [
        'Daily Commute',
        'Fuel & Tolls',
        'Outstation & Holidays',
        'Vehicle Maintenance',
    ],
    'Shopping & Lifestyle': [
        'Electronics & Hardware',
        'Apparel & Fashion',
        'Home & Living',
        'Personal Care',
    ],
    'Entertainment & Leisure': ['Digital Subscriptions', 'Movies & Events', 'Sports & Hobbies'],
    'Health & Wellness': ['Medicines & Pharmacy', 'Diagnostics & Doctors', 'Fitness & Gym'],
    'Education & Work': ['Upskilling & Courses', 'Books & Work Tools'],
    'Transfers & Adjustments': ['Split Settlement', 'Credit Card Repayment', 'Investments & Savings'],
    Other: ['Other', 'General & Miscellaneous'],
    // Backwards-compatible aliases
    'Shopping & E-Commerce': [
        'Electronics & Hardware',
        'Apparel & Fashion',
        'Home & Living',
        'Personal Care',
    ],
    'Health & Well-being': ['Medicines & Pharmacy', 'Diagnostics & Doctors', 'Fitness & Gym'],
    'Education & Career': ['Upskilling & Courses', 'Books & Work Tools'],
    'Transfers & Settlements': ['Split Settlement', 'Credit Card Repayment', 'Investments & Savings'],
};
export const CATEGORY_SPLIT_DYNAMIC = {
    // Food & Dining
    'Groceries & Dark Stores': {
        splitDynamic: 'Equal split',
        defaultSplitType: 'EQUAL',
        isExpense: true,
    },
    'Food Delivery': { splitDynamic: 'Exact / Itemized', defaultSplitType: 'EXACT', isExpense: true },
    'Dine-in & Cafes': {
        splitDynamic: 'Exact / Itemized',
        defaultSplitType: 'EXACT',
        isExpense: true,
    },
    'Nightlife & Social': {
        splitDynamic: 'Itemized / Custom',
        defaultSplitType: 'EXACT',
        isExpense: true,
    },
    // Bills & Utilities
    'Electricity & Power': {
        splitDynamic: 'Equal split',
        defaultSplitType: 'EQUAL',
        isExpense: true,
    },
    'Water & Cooking Gas': {
        splitDynamic: 'Equal split',
        defaultSplitType: 'EQUAL',
        isExpense: true,
    },
    'Internet & Telecom': { splitDynamic: 'Equal split', defaultSplitType: 'EQUAL', isExpense: true },
    'Rent & Housing': {
        splitDynamic: 'Ratio / Equal split',
        defaultSplitType: 'EQUAL',
        isExpense: true,
    },
    'Society & Domestic Help': {
        splitDynamic: 'Equal split',
        defaultSplitType: 'EQUAL',
        isExpense: true,
    },
    // Transit & Travel
    'Daily Commute': {
        splitDynamic: 'Equal split (shared ride)',
        defaultSplitType: 'EQUAL',
        isExpense: true,
    },
    'Fuel & Tolls': { splitDynamic: 'Equal split', defaultSplitType: 'EQUAL', isExpense: true },
    'Outstation & Holidays': {
        splitDynamic: 'Group pool / Equal',
        defaultSplitType: 'EQUAL',
        isExpense: true,
    },
    'Vehicle Maintenance': { splitDynamic: 'Personal', defaultSplitType: 'EQUAL', isExpense: true },
    // Shopping & Lifestyle
    'Electronics & Hardware': {
        splitDynamic: 'Personal',
        defaultSplitType: 'EQUAL',
        isExpense: true,
    },
    'Apparel & Fashion': { splitDynamic: 'Personal', defaultSplitType: 'EQUAL', isExpense: true },
    'Home & Living': { splitDynamic: 'Equal split', defaultSplitType: 'EQUAL', isExpense: true },
    'Personal Care': { splitDynamic: 'Personal', defaultSplitType: 'EQUAL', isExpense: true },
    // Entertainment & Leisure
    'Digital Subscriptions': {
        splitDynamic: 'Equal split',
        defaultSplitType: 'EQUAL',
        isExpense: true,
    },
    'Movies & Events': {
        splitDynamic: 'Exact / Itemized',
        defaultSplitType: 'EXACT',
        isExpense: true,
    },
    'Sports & Hobbies': { splitDynamic: 'Equal split', defaultSplitType: 'EQUAL', isExpense: true },
    // Health & Wellness
    'Medicines & Pharmacy': { splitDynamic: 'Personal', defaultSplitType: 'EQUAL', isExpense: true },
    'Diagnostics & Doctors': { splitDynamic: 'Personal', defaultSplitType: 'EQUAL', isExpense: true },
    'Fitness & Gym': { splitDynamic: 'Personal', defaultSplitType: 'EQUAL', isExpense: true },
    // Education & Work
    'Upskilling & Courses': { splitDynamic: 'Personal', defaultSplitType: 'EQUAL', isExpense: true },
    'Books & Work Tools': { splitDynamic: 'Personal', defaultSplitType: 'EQUAL', isExpense: true },
    // Transfers & Adjustments (CRITICAL: isExpense: false)
    'Split Settlement': {
        splitDynamic: 'System transfer',
        defaultSplitType: 'EQUAL',
        isExpense: false,
    },
    'Credit Card Repayment': {
        splitDynamic: 'System transfer',
        defaultSplitType: 'EQUAL',
        isExpense: false,
    },
    'Investments & Savings': {
        splitDynamic: 'System transfer',
        defaultSplitType: 'EQUAL',
        isExpense: false,
    },
    // Fallback
    Other: { splitDynamic: 'Equal split', defaultSplitType: 'EQUAL', isExpense: true },
};
//# sourceMappingURL=index.js.map