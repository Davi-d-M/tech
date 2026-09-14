import { SocialAdapter, PublishingJob, SocialAccount, SocialMetric } from "../types";

/**
 * X (Twitter) Adapter
 */
export class XAdapter implements SocialAdapter {
    platform = 'x' as const;

    async publish(job: PublishingJob, account: SocialAccount) {
        console.log(`[X] Publishing for ${account.accountName}, job ${job.id}`);

        // X API v2:
        // - POST /2/tweets
        // - Media upload v1.1 endpoint (media_ids)

        await new Promise(r => setTimeout(r, 1000));

        return { externalId: `x_tweet_${Date.now()}` };
    }

    async getMetrics(externalId: string, account: SocialAccount): Promise<Partial<SocialMetric>> {
        return { impressions: 1500, reach: 900 };
    }
}
