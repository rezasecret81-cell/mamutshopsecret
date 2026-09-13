import { useEffect } from 'react';
import { SITE_NAME, SITE_DESCRIPTION, SITE_URL } from '@/lib/site';
import type { Product, Category, Brand, BlogPost, Review } from '@/lib/types';

type SeoProps = {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  type?: 'website' | 'product' | 'article' | 'category' | 'brand';
  canonicalPath?: string;
  noIndex?: boolean;
  product?: Product;
  category?: Category;
  brand?: Brand;
  article?: BlogPost;
  reviews?: Review[];
  breadcrumbs?: { name: string; url: string }[];
  faq?: { question: string; answer: string }[];
};

const DEFAULT_TITLE = `${SITE_NAME} | فروشگاه آنلاین لوازم دیجیتال`;
const DEFAULT_DESC = SITE_DESCRIPTION;
const DEFAULT_KEYWORDS = 'فروشگاه آنلاین, خرید آنلاین, موبایل, لپ تاپ, لوازم دیجیتال, گوشی, تبلت, کنسول بازی, لوازم خانگی';
const LOGO_URL = 'https://images.pexels.com/photos/799443/pexels-photo-799443.jpeg';

function setMeta(name: string, content: string, property = false) {
  const attr = property ? 'property' : 'name';
  let el = document.head.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.content = content;
}

function setLink(rel: string, href: string) {
  let el = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.href = href;
}

function setJsonLd(id: string, data: unknown) {
  const scriptId = `jsonld-${id}`;
  let el = document.getElementById(scriptId) as HTMLScriptElement | null;
  if (!data) {
    if (el) el.remove();
    return;
  }
  if (!el) {
    el = document.createElement('script');
    el.id = scriptId;
    el.setAttribute('type', 'application/ld+json');
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

function removeJsonLd(id: string) {
  const el = document.getElementById(`jsonld-${id}`);
  if (el) el.remove();
}

export function Seo({ title, description, keywords, image, type = 'website', canonicalPath, noIndex, product, category, brand, article, reviews, breadcrumbs, faq }: SeoProps) {
  useEffect(() => {
    const seoTitle = title || (product?.seo_title) || (category?.seo_title) || (brand?.seo_title) || (article?.seo_title);
    const seoDesc = description || (product?.meta_description) || (product?.seo_description) || (category?.seo_description) || (brand?.seo_description) || (article?.seo_description);
    const seoKeywords = keywords || (product?.seo_keywords) || (category?.seo_keywords) || (brand?.seo_keywords) || (article?.seo_keywords);
    const seoImage = image || (product?.og_image) || (category?.og_image) || (brand?.og_image) || (article?.og_image) || (product?.image_url) || (brand?.logo_url) || LOGO_URL;
    const metaRobots = product?.meta_robots || category?.meta_robots || brand?.meta_robots || article?.meta_robots;

    const fullTitle = seoTitle ? `${seoTitle} | ${SITE_NAME}` : DEFAULT_TITLE;
    const desc = seoDesc || DEFAULT_DESC;
    const kw = seoKeywords || DEFAULT_KEYWORDS;
    const url = window.location.href;

    document.title = fullTitle;

    setMeta('description', desc);
    setMeta('keywords', kw);
    setMeta('author', SITE_NAME);
    setMeta('robots', noIndex ? 'noindex, nofollow' : (metaRobots || 'index, follow'));

    // Open Graph
    setMeta('og:title', fullTitle, true);
    setMeta('og:description', desc, true);
    setMeta('og:type', type === 'product' ? 'product' : type === 'article' ? 'article' : 'website', true);
    setMeta('og:url', url, true);
    setMeta('og:image', seoImage, true);
    setMeta('og:site_name', SITE_NAME, true);
    setMeta('og:locale', 'fa_IR', true);
    if (type === 'product' && product) {
      setMeta('product:price:amount', (product.discount_price || product.price).toString(), true);
      setMeta('product:price:currency', 'IRR', true);
      setMeta('product:availability', product.stock > 0 ? 'in stock' : 'out of stock', true);
    }

    // Twitter
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', fullTitle);
    setMeta('twitter:description', desc);
    setMeta('twitter:image', seoImage);

    // Canonical
    const canonicalUrl = canonicalPath ? `${SITE_URL}${canonicalPath}` : url;
    setLink('canonical', canonicalUrl);

    // Structured Data
    // Organization
    setJsonLd('org', {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
      logo: LOGO_URL,
      description: SITE_DESCRIPTION,
      contactPoint: { '@type': 'ContactPoint', telephone: '+98-21-12345678', contactType: 'customer service', availableLanguage: 'Persian' },
    });

    // Website with SearchAction
    setJsonLd('website', {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL,
      description: desc,
      potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/shop?search={search_term_string}` },
        'query-input': 'required name=search_term_string',
      },
    });

    // Breadcrumbs
    if (breadcrumbs && breadcrumbs.length > 0) {
      setJsonLd('breadcrumb', {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((b, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: b.name,
          item: `${SITE_URL}${b.url}`,
        })),
      });
    } else {
      removeJsonLd('breadcrumb');
    }

    // Product Schema
    if (product) {
      const price = product.discount_price || product.price;
      const avgRating = product.rating || 0;
      const reviewCount = product.review_count || 0;

      const productSchema: Record<string, unknown> = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: product.description || desc,
        image: product.images?.map(i => i.url) || [product.image_url].filter(Boolean),
        sku: product.sku || product.id,
        brand: product.brand ? { '@type': 'Brand', name: product.brand.name } : undefined,
        offers: {
          '@type': 'Offer',
          url,
          priceCurrency: 'IRR',
          price: price.toString(),
          priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          seller: { '@type': 'Organization', name: SITE_NAME },
          shippingDetails: product.weight ? {
            '@type': 'OfferShippingDetails',
            weight: { '@type': 'QuantitativeValue', value: product.weight, unitCode: 'KGM' },
          } : undefined,
        },
      };

      if (avgRating > 0) {
        productSchema.aggregateRating = {
          '@type': 'AggregateRating',
          ratingValue: avgRating.toString(),
          reviewCount: reviewCount.toString(),
          bestRating: '5',
          worstRating: '1',
        };
      }

      if (reviews && reviews.length > 0) {
        productSchema.review = reviews.filter(r => r.is_approved).slice(0, 10).map(r => ({
          '@type': 'Review',
          reviewRating: { '@type': 'Rating', ratingValue: r.rating.toString(), bestRating: '5' },
          author: { '@type': 'Person', name: 'کاربر' },
          reviewBody: r.body || '',
          datePublished: new Date(r.created_at).toISOString().split('T')[0],
        }));
      }

      setJsonLd('product', productSchema);
    } else {
      removeJsonLd('product');
    }

    // Category Schema
    if (category) {
      setJsonLd('category', {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: category.name,
        description: category.description || desc,
        url,
        isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: SITE_URL },
      });
    } else {
      removeJsonLd('category');
    }

    // Brand Schema
    if (brand) {
      setJsonLd('brand', {
        '@context': 'https://schema.org',
        '@type': 'Brand',
        name: brand.name,
        description: brand.description || desc,
        logo: brand.logo_url,
        url,
      });
    } else {
      removeJsonLd('brand');
    }

    // Article Schema
    if (article) {
      setJsonLd('article', {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: article.title,
        description: article.seo_description || article.excerpt || desc,
        image: article.featured_image || seoImage,
        datePublished: article.published_at ? new Date(article.published_at).toISOString() : undefined,
        dateModified: new Date(article.updated_at).toISOString(),
        author: { '@type': 'Organization', name: SITE_NAME },
        publisher: { '@type': 'Organization', name: SITE_NAME, logo: { '@type': 'ImageObject', url: LOGO_URL } },
        mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      });
    } else {
      removeJsonLd('article');
    }

    // FAQ Schema
    if (faq && faq.length > 0) {
      setJsonLd('faq', {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faq.map(f => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: { '@type': 'Answer', text: f.answer },
        })),
      });
    } else {
      removeJsonLd('faq');
    }

    return () => {
      // Cleanup on unmount
      ['org', 'website', 'breadcrumb', 'product', 'category', 'brand', 'article', 'faq'].forEach(removeJsonLd);
    };
  }, [title, description, keywords, image, type, canonicalPath, noIndex, product, category, brand, article, reviews, breadcrumbs, faq]);

  return null;
}

// Utility functions for SEO score calculation
export function calculateSeoScore(data: {
  title?: string | null;
  description?: string | null;
  keywords?: string | null;
  content?: string | null;
  imageAlt?: boolean;
  h1Count?: number;
  internalLinks?: number;
  externalLinks?: number;
}): { score: number; issues: string[]; suggestions: string[] } {
  let score = 100;
  const issues: string[] = [];
  const suggestions: string[] = [];

  // Title checks
  if (!data.title) {
    score -= 20;
    issues.push('عنوان سئو وجود ندارد');
  } else if (data.title.length < 30) {
    score -= 10;
    suggestions.push('عنوان باید حداقل ۳۰ کاراکتر باشد');
  } else if (data.title.length > 60) {
    score -= 5;
    suggestions.push('عنوان نباید بیشتر از ۶۰ کاراکتر باشد');
  }

  // Description checks
  if (!data.description) {
    score -= 20;
    issues.push('توضیحات سئو وجود ندارد');
  } else if (data.description.length < 120) {
    score -= 10;
    suggestions.push('توضیحات باید حداقل ۱۲۰ کاراکتر باشد');
  } else if (data.description.length > 160) {
    score -= 5;
    suggestions.push('توضیحات نباید بیشتر از ۱۶۰ کاراکتر باشد');
  }

  // Keywords
  if (!data.keywords) {
    score -= 10;
    suggestions.push('کلمات کلیدی اضافه کنید');
  }

  // Image Alt
  if (data.imageAlt === false) {
    score -= 15;
    issues.push('تصاویر فاقد متن جایگزین هستند');
  }

  // H1 count
  if (data.h1Count === 0) {
    score -= 15;
    issues.push('هیچ H1 در صفحه وجود ندارد');
  } else if (data.h1Count && data.h1Count > 1) {
    score -= 10;
    issues.push('بیش از یک H1 در صفحه وجود دارد');
  }

  // Internal links
  if (data.internalLinks === 0) {
    score -= 10;
    suggestions.push('لینک‌های داخلی اضافه کنید');
  }

  score = Math.max(0, Math.min(100, score));

  return { score, issues, suggestions };
}
