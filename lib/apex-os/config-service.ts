import { supabase } from '@/lib/supabaseClient';

export interface FeatureFlags {
    gps_tracking: boolean;
    barcode_scanner: boolean;
    ai_triage: boolean;
    offline_mode: boolean;
    biometrics: boolean;
}

/**
 * Apex Configuration Service
 * Remotely manages feature flags and system behaviors per tenant/device.
 */
export const configService = {
    async getTenantFlags(tenantId: string): Promise<FeatureFlags> {
        if (!supabase) return this.getDefaultFlags();

        const { data, error } = await supabase
            .from('tenants')
            .select('settings')
            .eq('id', tenantId)
            .single();

        if (error || !data.settings?.feature_flags) {
            return this.getDefaultFlags();
        }

        return data.settings.feature_flags;
    },

    getDefaultFlags(): FeatureFlags {
        return {
            gps_tracking: true,
            barcode_scanner: true,
            ai_triage: true,
            offline_mode: true,
            biometrics: true
        };
    }
};
