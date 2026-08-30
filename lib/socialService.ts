import { supabase } from './supabaseClient';

export type Platform = 'facebook' | 'instagram' | 'tiktok' | 'whatsapp' | 'gmail';

export interface SocialPostRequest {
    title: string;
    description: string;
    media_url?: string;
    media_type?: 'image' | 'video';
    target_url?: string;
    platforms: Platform[];
}

export interface PlatformResponse {
    platform: Platform;
    status: 'SUCCESS' | 'FAILED' | 'PROCESSING';
    external_id?: string;
    error?: string;
}

import { MetaAdapter } from './social-adapters/MetaAdapter';
import { TikTokAdapter } from './social-adapters/TikTokAdapter';
import { WhatsAppAdapter } from './social-adapters/WhatsAppAdapter';
import { SocialAdapter } from './social-adapters/BaseAdapter';

class SocialService {
    private adapters: Record<Platform, SocialAdapter>;

    constructor() {
        this.adapters = {
            'facebook': new MetaAdapter(),
            'instagram': new MetaAdapter(), // IG uses Meta logic too
            'tiktok': new TikTokAdapter(),
            'whatsapp': new WhatsAppAdapter(),
            'gmail': {
                platform: 'gmail',
                connect: async () => true,
                validateConnection: async () => true,
                publish: async () => ({ platform: 'gmail' as Platform, status: 'SUCCESS' as const })
            } as SocialAdapter
        };
    }

    /**
     * Master Publish Command
     * Distributes content to all selected and connected platforms.
     */
    public async publishEverywhere(request: SocialPostRequest): Promise<PlatformResponse[]> {
        if (!supabase) throw new Error("Database not linked, bro.");

        // 1. Create Master Campaign Record
        const { data: campaign, error: cError } = await supabase
            .from('social_campaigns')
            .insert([{
                title: request.title,
                description: request.description,
                media_url: request.media_url,
                media_type: request.media_type,
                target_url: request.target_url,
                created_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (cError) throw cError;

        // 2. Process each platform independently (Tactical Async)
        const results = await Promise.all(request.platforms.map(p => this.publishToPlatform(p, campaign.id, request)));

        return results;
    }

    private async publishToPlatform(platform: Platform, campaignId: number, content: SocialPostRequest): Promise<PlatformResponse> {
        // Create initial Queued Post
        const { data: post } = await supabase!
            .from('campaign_posts')
            .insert([{
                campaign_id: campaignId,
                platform,
                status: 'QUEUED',
                platform_caption: this.adaptContentForPlatform(platform, content.description)
            }])
            .select()
            .single();

        try {
            // Check integration status
            const { data: integration } = await supabase!
                .from('social_integrations')
                .select('*')
                .eq('platform', platform)
                .single();

            if (!integration || !integration.is_connected) {
                throw new Error("Platform connection not established on the grid.");
            }

            // 🚀 Tactical Node: Execute real adapter logic
            const adapter = this.adapters[platform];
            const result = await adapter.publish(content, integration);

            // Update Post Status
            await supabase!
                .from('campaign_posts')
                .update({
                    status: result.status === 'SUCCESS' ? 'PUBLISHED' : 'FAILED',
                    external_post_id: result.external_id,
                    error_message: result.error,
                    published_at: result.status === 'SUCCESS' ? new Date().toISOString() : null
                })
                .eq('id', post.id);

            return result;

        } catch (err: unknown) {
            const error = err as Error;
            await supabase!
                .from('campaign_posts')
                .update({ status: 'FAILED', error_message: error.message })
                .eq('id', post.id);

            return { platform, status: 'FAILED', error: error.message };
        }
    }

    /**
     * Intelligence Node: Content Adaptation
     * Generates platform-specific captions from the master description.
     */
    private adaptContentForPlatform(platform: Platform, description: string): string {
        switch (platform) {
            case 'instagram':
                return `${description}\n\n#Apexstores #EliteTech #KenyaTech #GadgetNairobi #PremiumSound`;
            case 'tiktok':
                return `🚨 NEW TECH DROP 🚨\n${description.substring(0, 100)}... #fyp #kenyantiktok #tech`;
            case 'whatsapp':
                return `🔥 *NEW ARRIVAL* 🔥\n\n${description}\n\nOrder here: `;
            case 'facebook':
                return `${description}\n\nExperience authentic tech engineered for excellence at Apexstores Kenya. We deliver across Nairobi and major towns. 🚀`;
            default:
                return description;
        }
    }
}

export const socialService = new SocialService();
