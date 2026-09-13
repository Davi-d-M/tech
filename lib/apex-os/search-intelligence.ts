/**
 * Apex OS: Search Intelligence Engine
 * Handles synonyms, brand mapping, and intent detection.
 */

const SYNONYMS: Record<string, string[]> = {
    'smooth': ['whiskey', 'wine', 'bourbon'],
    'cold': ['beer', 'cider', 'white wine'],
    'gift': ['premium', 'limited edition', 'box set'],
    'cheap': ['budget', 'under 2000', 'sale'],
    'elite': ['exclusive', 'premium', 'high end'],
    'pod': ['airpod', 'earbud', 'headphone'],
    'charge': ['charger', 'cable', 'power bank']
};

const BRAND_MAPPING: Record<string, string> = {
    'iphone': 'Apple',
    'samsung': 'Samsung',
    'airpod': 'Apple',
    'watch': 'Apple', // default intent
    'glen': 'Glenfiddich',
    'jack': 'Jack Daniels',
    'henny': 'Hennessy'
};

export interface SearchIntent {
    query: string;
    original: string;
    brands: string[];
    categories: string[];
    priceMax?: number;
    isGiftIntent: boolean;
}

export function detectSearchIntent(rawQuery: string): SearchIntent {
    const query = rawQuery.toLowerCase().trim();
    const words = query.split(/\s+/);

    const intent: SearchIntent = {
        query: query,
        original: rawQuery,
        brands: [],
        categories: [],
        isGiftIntent: words.includes('gift') || words.includes('present')
    };

    // 1. Detect Brands
    Object.keys(BRAND_MAPPING).forEach(key => {
        if (query.includes(key)) intent.brands.push(BRAND_MAPPING[key]);
    });

    // 2. Detect Categories (Standard mapping)
    const commonCats = ['whiskey', 'wine', 'gin', 'vodka', 'beer', 'charger', 'case', 'audio'];
    commonCats.forEach(cat => {
        if (query.includes(cat)) intent.categories.push(cat);
    });

    // 3. Price Detection (e.g. "under 5000")
    const priceMatch = query.match(/under\s*(\d+)/) || query.match(/below\s*(\d+)/);
    if (priceMatch && priceMatch[1]) {
        intent.priceMax = parseInt(priceMatch[1]);
    }

    // 4. Synonym Expansion
    words.forEach(word => {
        if (SYNONYMS[word]) {
            intent.categories.push(...SYNONYMS[word]);
        }
    });

    // Deduplicate
    intent.brands = Array.from(new Set(intent.brands));
    intent.categories = Array.from(new Set(intent.categories));

    return intent;
}
