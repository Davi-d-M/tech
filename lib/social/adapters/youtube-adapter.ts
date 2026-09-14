import { SocialAdapter, PublishingJob, SocialAccount, SocialMetric } from "../types";

/**
 * YouTube Adapter
 */
export class YouTubeAdapter implements SocialAdapter {
    platform = 'youtube' as const;

    async publish(job: PublishingJob, account: SocialAccount) {
        console.log(`[YOUTUBE] Publishing for ${account.accountName}, job ${job.id}`);

        // YouTube Data API v3:
        // - videos.insert
        // - multipart upload for binary
        // - snippet (title, description, tags, categoryId)

        await new Promise(r => setTimeout(r, 2500));

        return { externalId: `yt_video_${Date.now()}` };
    }

    async getMetrics(externalId: string, account: SocialAccount): Promise<Partial<SocialMetric>> {
        return { views: 800, impressions: 2000 };
    }
}
