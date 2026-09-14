export type SocialPlatform =
  | "instagram"
  | "facebook"
  | "tiktok"
  | "youtube"
  | "x"
  | "whatsapp";

export interface SocialAccount {
  id: string;
  platform: SocialPlatform;
  accountName: string;
  accountId: string;
  accessTokenEncrypted: string;
  connectedAt: string;
  expiresAt?: string;
  status: "connected" | "expired" | "error";
}

export interface MasterContent {
    id: string;
    title: string;
    description: string;
    contentType: 'product_story' | 'brand_video' | 'educational' | 'announcement';
    masterMediaUrl: string;
    productIds: number[];
}

export interface PlatformPayload {
    caption: string;
    mediaUrls: string[];
    hashtags: string[];
    linkUrl?: string;
    scheduledAt?: string;
}

export interface PublishingJob {
    id: string;
    contentId: string;
    platform: SocialPlatform;
    accountId: string;
    status: 'pending' | 'processing' | 'published' | 'failed' | 'scheduled';
    platformPayload: PlatformPayload;
    attemptCount: number;
    externalPostId?: string;
    lastError?: string;
}

export interface SocialMetric {
  platform: SocialPlatform;
  impressions: number;
  reach: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
}

/**
 * Common Interface for all Social Adapters
 */
export interface SocialAdapter {
    platform: SocialPlatform;
    publish: (job: PublishingJob, account: SocialAccount) => Promise<{ externalId: string }>;
    getMetrics: (externalId: string, account: SocialAccount) => Promise<Partial<SocialMetric>>;
}
