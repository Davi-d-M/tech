import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://tech-paxv.onrender.com';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
          '/admin/',
          '/account/',
          '/checkout/',
          '/cart/',
          '/api/',
          '/login/',
          '/register/',
          '/verify/',
          '/supplier/login',
          '/rider/login',
          '/rider/dashboard'
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
