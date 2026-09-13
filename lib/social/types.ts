export type SocialPlatform =
  | "instagram"
  | "facebook"
  | "tiktok"
  | "youtube"
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

export interface SocialPost {
  id: string;
  platform: SocialPlatform;
  content: string;
  mediaUrl?: string;
  publishedAt?: string;
  status: "draft" | "scheduled" | "published" | "failed";
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
