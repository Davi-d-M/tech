import { supabase } from "@/lib/supabaseClient";
import {
    SocialPlatform,
    SocialAdapter,
    MasterContent,
    PlatformPayload
} from "./types";
import { MetaAdapter } from "./adapters/meta-adapter";
import { TikTokAdapter } from "./adapters/tiktok-adapter";
import { YouTubeAdapter } from "./adapters/youtube-adapter";
import { XAdapter } from "./adapters/x-adapter";

/**
 * Apex OS: Omni-Channel Social Commander
 * Central brain for multi-platform content distribution.
 */
class SocialManager {
    private adapters: Record<string, SocialAdapter> = {
        'instagram': new MetaAdapter('instagram'),
        'facebook': new MetaAdapter('facebook'),
        'tiktok': new TikTokAdapter(),
        'youtube': new YouTubeAdapter(),
        'x': new XAdapter()
    };

    /**
     * Creates a background publishing job for a specific node
     */
    async enqueueJob(content: MasterContent, platform: SocialPlatform, accountId: string, payload: PlatformPayload) {
        if (!supabase) return null;

        const { data, error } = await supabase
            .from('publishing_jobs')
            .insert({
                content_id: content.id,
                platform,
                social_account_id: accountId,
                platform_payload: payload,
                status: 'pending'
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Executes a publishing job through the appropriate adapter
     */
    async executeJob(jobId: string) {
        if (!supabase) return;

        // 1. Get Job & Account
        const { data: job } = await supabase
            .from('publishing_jobs')
            .select('*, social_accounts(*)')
            .eq('id', jobId)
            .single();

        if (!job || job.status === 'published') return;

        const adapter = this.adapters[job.platform];
        if (!adapter) throw new Error(`No adapter found for platform: ${job.platform}`);

        try {
            // 2. Mark as Processing
            await supabase.from('publishing_jobs').update({ status: 'processing', started_at: new Date().toISOString() }).eq('id', jobId);

            // 3. Publish via Adapter
            const result = await adapter.publish(job as any, job.social_accounts as any);

            // 4. Record Success
            await supabase.from('publishing_jobs').update({
                status: 'published',
                completed_at: new Date().toISOString(),
                external_post_id: result.externalId
            }).eq('id', jobId);

        } catch (err) {
            console.error(`[SOCIAL ERROR] ${job.platform} Job Failed:`, err);

            // 5. Record Failure & Retry logic
            const attemptCount = (job.attempt_count || 0) + 1;
            const status = attemptCount >= 3 ? 'failed' : 'pending'; // 3 retries max

            await supabase.from('publishing_jobs').update({
                status,
                attempt_count: attemptCount,
                last_error: (err as Error).message
            }).eq('id', jobId);

            // Log attempt
            await supabase.from('publishing_job_attempts').insert({
                job_id: jobId,
                status: 'failed',
                error_message: (err as Error).message,
                attempt_number: attemptCount
            });
        }
    }

    /**
     * High-level: Creates variants and enqueues them for all selected platforms
     */
    async broadcastMasterContent(content: MasterContent, platforms: SocialPlatform[]) {
        if (!supabase) return [];

        // 1. Get Connected Accounts
        const { data: accounts } = await supabase
            .from('social_accounts')
            .select('*')
            .in('platform', platforms)
            .eq('status', 'connected');

        if (!accounts) return [];

        const jobs = [];
        for (const account of accounts) {
            // Generate platform-specific payload (AI or template based)
            const payload = {
                caption: content.description.substring(0, 200), // Default crop
                mediaUrls: [content.masterMediaUrl],
                hashtags: ['#Apexstores', `#${account.platform}`]
            };

            const job = await this.enqueueJob(content, account.platform as SocialPlatform, account.id, payload);
            jobs.push(job);
        }

        return jobs;
    }

    /**
     * Performance Loop: Sync metrics for all published items
     */
    async syncAllMetrics() {
        if (!supabase) return;

        const { data: posts } = await supabase
            .from('publishing_jobs')
            .select('*, social_accounts(*)')
            .eq('status', 'published')
            .not('external_post_id', 'is', null);

        if (!posts) return;

        for (const post of posts) {
            const adapter = this.adapters[post.platform];
            if (adapter && post.external_post_id) {
                const metrics = await adapter.getMetrics(post.external_post_id, post.social_accounts as any);

                // Record snapshot
                await supabase.from('social_metrics_history').insert({
                    post_id: post.id, // This needs to link to social_posts table, but for now we link to job id as placeholder
                    platform: post.platform,
                    ...metrics
                });
            }
        }
    }
}

export const socialManager = new SocialManager();
