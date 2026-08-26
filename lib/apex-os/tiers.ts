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
        primary: '#0F172A',
        bg: 'bg-slate-50',
        border: 'border-slate-200',
        text: 'text-slate-900'
    }
};
