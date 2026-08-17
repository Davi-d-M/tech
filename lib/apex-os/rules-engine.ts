export interface RulesContext {
    total_price?: number;
    supplier_rating?: number;
    margin?: number;
    risk_score?: number;
    requires_approval?: boolean;
    status?: string;
    alert_type?: string;
    [key: string]: string | number | boolean | undefined | null;
}

export interface BusinessRule {
    id: string;
    condition: (context: RulesContext) => boolean;
    action: (context: RulesContext) => RulesContext;
    description: string;
}

/**
 * Apex OS Business Rules Engine
 * Protects the company from human error and fraud.
 */
export const GLOBAL_RULES: BusinessRule[] = [
    {
        id: 'RULE_HIGH_VALUE_GATING',
        condition: (ctx) => (ctx.total_price || 0) > 100000,
        action: (ctx) => ({ ...ctx, risk_score: 80, requires_approval: true }),
        description: 'Orders > 100k KES require manual manager authorization.'
    },
    {
        id: 'RULE_SUPPLIER_SUSPENSION',
        condition: (ctx) => (ctx.supplier_rating || 100) < 40,
        action: (ctx) => ({ ...ctx, status: 'SUSPENDED' }),
        description: 'Automatically suspend suppliers with <40 performance score.'
    },
    {
        id: 'RULE_PROFIT_GUARD',
        condition: (ctx) => (ctx.margin || 0) < 5,
        action: (ctx) => ({ ...ctx, alert_type: 'CRITICAL' }),
        description: 'Flag transactions with <5% contribution margin.'
    }
];

export function evaluateRules(context: RulesContext) {
    let result = { ...context };
    GLOBAL_RULES.forEach(rule => {
        if (rule.condition(result)) {
            result = rule.action(result);
            console.log(`[RULE_ENGINE] Applied: ${rule.id}`);
        }
    });
    return result;
}
