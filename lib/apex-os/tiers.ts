export type CustomerTier = 'Bronze' | 'Gold' | 'Platinum';

export function getTierFromPoints(points: number): CustomerTier {
    if (points >= 2000) return 'Platinum';
    if (points >= 500) return 'Gold';
    return 'Bronze';
}

export const TIER_THEMES = {
    'Bronze': {
        primary: '#ff6b00',
        bg: 'bg-white',
        border: 'border-slate-100',
        text: 'text-foreground'
    },
    'Gold': {
        primary: '#F5A000',
        bg: 'bg-amber-50/50',
        border: 'border-amber-100',
        text: 'text-amber-900'
    },
    'Platinum': {
        primary: '#5B5BFF', // Indigo - Elite Professional
        bg: 'bg-indigo-50/30',
        border: 'border-indigo-100',
        text: 'text-indigo-900'
    }
};
