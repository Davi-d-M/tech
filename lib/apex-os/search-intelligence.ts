/**
 * Apex OS: Search Intelligence Engine (Electronics Specialization)
 * Handles synonyms, brand mapping, and intent detection for premium tech.
 */

const SYNONYMS: Record<string, string[]> = {
    'fast': ['charger', 'cable', 'power bank'],
    'sound': ['airpods', 'headphones', 'speakers'],
    'gift': ['premium', 'bundle', 'box set'],
    'cheap': ['budget', 'under 2000', 'sale'],
    'elite': ['exclusive', 'premium', 'flagship'],
    'pod': ['airpods', 'earbuds', 'wireless'],
    'watch': ['apple watch', 'smartwatch', 'straps']
};

const BRAND_MAPPING: Record<string, string> = {
    'iphone': 'Apple',
    'samsung': 'Samsung',
    'airpod': 'Apple',
    'pixel': 'Google',
    'watch': 'Apple',
    'mac': 'Apple',
    'ipad': 'Apple'
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
    const commonCats = ['audio', 'charger', 'case', 'watch', 'accessories', 'laptop', 'tablet'];
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
