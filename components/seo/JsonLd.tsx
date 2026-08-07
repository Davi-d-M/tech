"use client";

import { useSettings } from "@/lib/useSettings";

export default function JsonLd() {
  const { settings } = useSettings();

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://tech-paxv.onrender.com';

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": settings.store_info.name || "Apexstores Tech",
    "url": baseUrl,
    "logo": `${baseUrl}/favicon.svg`,
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": `+${settings.contact.whatsapp}`,
      "contactType": "customer service",
      "areaServed": "KE",
      "availableLanguage": "English"
    },
    "sameAs": [
      settings.social_links.instagram,
      settings.social_links.tiktok,
      settings.social_links.facebook
    ].filter(Boolean)
  };

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": settings.store_info.name || "Apexstores Tech",
    "image": `${baseUrl}/favicon.svg`,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": settings.contact.address || "Tom Mboya Street",
      "addressLocality": "Nairobi",
      "addressRegion": "Nairobi County",
      "addressCountry": "KE"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": -1.286389,
      "longitude": 36.817223
    },
    "url": baseUrl,
    "telephone": `+${settings.contact.whatsapp}`,
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "09:00",
        "closes": "18:00"
      },
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": "Saturday",
        "opens": "10:00",
        "closes": "16:00"
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
    </>
  );
}
