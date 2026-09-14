import { SocialAdapter, PublishingJob, SocialAccount, SocialMetric } from "../types";

/**
 * TikTok Adapter
 */
export class TikTokAdapter implements SocialAdapter {
    platform = 'tiktok' as const;

    async publish(job: PublishingJob, account: SocialAccount) {
        console.log(`[TIKTOK] Publishing for ${account.accountName}, job ${job.id}`);

        // TikTok Direct Post API requirements:
        // - Creator Info query first
        // - multipart/form-data with video binary or URL
        // - 100 character caption limit

        await new Promise(r => setTimeout(r, 2000));

        return { externalId: `tiktok_post_${Date.now()}` };
    }

    async getMetrics(externalId: string, account: SocialAccount): Promise<Partial<SocialMetric>> {
        return { views: 4500, reach: 3000 };
    }
}
