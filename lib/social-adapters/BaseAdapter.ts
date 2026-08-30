import { Platform, SocialPostRequest, PlatformResponse } from '../socialService';

export interface SocialAdapter {
    platform: Platform;
    connect(): Promise<boolean>;
    validateConnection(tokens: { access_token?: string; refresh_token?: string; whatsapp_token?: string }): Promise<boolean>;
    publish(content: SocialPostRequest, credentials: Record<string, unknown>): Promise<PlatformResponse>;
}
