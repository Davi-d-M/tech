import { supabase } from '@/lib/supabaseClient';

export interface ProvisioningResult {
    tenantId: string;
    ownerInviteLink: string;
}

/**
 * Apex OS Provisioning Engine
 * Automates the creation of tenants, organizations, and initial access.
 */
export const provisioningEngine = {
    /**
     * Approves an application and spawns a new organization.
     */
    async provisionOrganization(applicationId: string): Promise<ProvisioningResult> {
        if (!supabase) throw new Error("Cloud uplink unavailable.");

        // 1. Trigger Database Provisioning (RPC)
        const { data: tenantId, error: rpcError } = await supabase.rpc('provision_tenant', {
            app_id: applicationId
        });

        if (rpcError) throw rpcError;

        // 2. Generate Owner Invitation
        const inviteToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        const { error: inviteError } = await supabase.from('invitations').insert([{
            tenant_id: tenantId,
            role: 'OWNER',
            token: inviteToken,
            expires_at: expiresAt.toISOString(),
            status: 'Unused'
        }]);

        if (inviteError) throw inviteError;

        return {
            tenantId,
            ownerInviteLink: `${window.location.origin}/onboarding/claim?token=${inviteToken}`
        };
    },

    /**
     * Spawns a new Rider Node invitation.
     */
    async provisionRider(tenantId: string, phone: string): Promise<string> {
        if (!supabase) throw new Error("Cloud uplink unavailable.");

        const inviteToken = `RIDER-${Math.random().toString(36).substring(7).toUpperCase()}`;
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 48);

        const { error } = await supabase.from('invitations').insert([{
            tenant_id: tenantId,
            phone,
            role: 'RIDER',
            token: inviteToken,
            expires_at: expiresAt.toISOString(),
            status: 'Unused'
        }]);

        if (error) throw error;
        return inviteToken; // To be sent via SMS/WhatsApp
    }
};
