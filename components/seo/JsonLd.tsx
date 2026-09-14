"use client";

import { useSettings } from "@/lib/useSettings";
import { Product } from "@/types/product";

interface JsonLdProps {
    product?: Product;
    breadcrumbs?: { name: string; item: string }[];
    hideOrganization?: boolean;
}

export default function JsonLd({ product, breadcrumbs, hideOrganization }: JsonLdProps) {
  const { settings } = useSettings();

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://tech-paxv.onrender.com';

  const organizationSchema = !hideOrganization ? {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": settings.store_info.name || "Apexstores Tech",
    "url": baseUrl,
    "logo": `${baseUrl}/favicon.svg`,
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": `+${settings.contact.whatsapp}`,
      "customerService": "customer service",
      "areaServed": "KE",
      "availableLanguage": "English"
    }
  } : null;

  const productSchema = product ? {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": product.name,
      "image": [product.image_url || product.image],
      "description": product.description,
      "sku": product.sku || product.id,
      "brand": {
          "@type": "Brand",
          "name": product.brand || settings.store_info.name
      },
      "offers": {
          "@type": "Offer",
          "url": `${baseUrl}/product/${product.id}`,
          "priceCurrency": "KES",
          "price": product.price,
          "availability": (product.stock || 0) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          "itemCondition": "https://schema.org/NewCondition"
      }
  } : null;

  const breadcrumbSchema = breadcrumbs ? {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": breadcrumbs.map((b, i) => ({
          "@type": "ListItem",
          "position": i + 1,
          "name": b.name,
          "item": b.item.startsWith('http') ? b.item : `${baseUrl}${b.item}`
      }))
  } : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      {productSchema && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
          />
      )}
      {breadcrumbSchema && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
          />
      )}
    </>
  );
}
