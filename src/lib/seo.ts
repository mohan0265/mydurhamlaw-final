// src/lib/seo.ts
/**
 * SEO Metadata Helper
 * 
 * Generates consistent metadata for public pages including:
 * - Page title
 * - Meta description
 * - Canonical URL
 * - OpenGraph tags
 * - Twitter Card tags
 */

export interface SEOMetadata {
  title: string;
  description: string;
  canonical: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  keywords?: string;
}

export interface GeneratedSEOTags {
  title: string;
  description: string;
  canonical: string;
  ogTitle: string;
  ogDescription: string;
  ogUrl: string;
  ogType: string;
  ogImage: string;
  ogImageWidth: string;
  ogImageHeight: string;
  twitterCard: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  keywords?: string;
}

const SITE_URL = 'https://mydurhamlaw.com';
const SITE_NAME = 'MyDurhamLaw';
const SITE_TAGLINE = 'Learn law. Write law. Speak law.';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og/og-default.png`;
const DEFAULT_OG_WIDTH = '1200';
const DEFAULT_OG_HEIGHT = '630';

/**
 * Generate complete SEO metadata for a page
 */
export function generateSEOTags(metadata: SEOMetadata & { version?: string }): GeneratedSEOTags {
  const {
    title,
    canonical,
    ogImage = DEFAULT_OG_IMAGE,
    ogType = 'website',
    keywords,
    version
  } = metadata;

  // Ensure canonical URL is absolute
  const absoluteCanonical = canonical.startsWith('http') 
    ? canonical 
    : `${SITE_URL}${canonical.startsWith('/') ? '' : '/'}${canonical}`;

  // Ensure OG image is absolute and add versioning if provided
  let absoluteOgImage = ogImage.startsWith('http')
    ? ogImage
    : `${SITE_URL}${ogImage.startsWith('/') ? '' : '/'}${ogImage}`;
  
  if (version) {
    absoluteOgImage = absoluteOgImage.includes('?') 
      ? `${absoluteOgImage}&v=${version}` 
      : `${absoluteOgImage}?v=${version}`;
  }

  const description = metadata.description || 'Durham Law support, 24/7. Learn concepts, write with integrity, and practise speaking law with "Quiz Me" — built for Durham students.';

  return {
    title: `${metadata.title} | ${SITE_NAME}`,
    description,
    canonical: absoluteCanonical,
    ogTitle: title,
    ogDescription: description,
    ogUrl: absoluteCanonical,
    ogType,
    ogImage: absoluteOgImage,
    ogImageWidth: DEFAULT_OG_WIDTH,
    ogImageHeight: DEFAULT_OG_HEIGHT,
    twitterCard: 'summary_large_image',
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: absoluteOgImage,
    keywords
  };
}

/**
 * Generate article-specific metadata
 */
export function generateArticleSEO(params: {
  title: string;
  description: string;
  slug: string;
  keywords?: string;
}): GeneratedSEOTags {
  const { title, description, slug, keywords } = params;
  
  return generateSEOTags({
    title: `${title} - MyDurhamLaw Learn`,
    description,
    canonical: `/learn/${slug}`,
    ogImage: DEFAULT_OG_IMAGE,
    ogType: 'article',
    keywords
  });
}

/**
 * Generate FAQ JSON-LD schema
 */
export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqs.map(faq => ({
      '@type': 'Question',
      'name': faq.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': faq.answer
      }
    }))
  };

  return JSON.stringify(schema);
}

/**
 * Generate Article JSON-LD schema
 */
export function generateArticleSchema(params: {
  headline: string;
  description: string;
  datePublished: string;
  dateModified?: string;
  author?: string;
  image?: string;
}): string {
  const {
    headline,
    description,
    datePublished,
    dateModified = datePublished,
    author = 'MyDurhamLaw Team',
    image = DEFAULT_OG_IMAGE
  } = params;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    'headline': headline,
    'description': description,
    'image': image.startsWith('http') ? image : `${SITE_URL}${image}`,
    'datePublished': datePublished,
    'dateModified': dateModified,
    'author': {
      '@type': 'Organization',
      'name': author
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'MyDurhamLaw',
      'logo': {
        '@type': 'ImageObject',
        'url': `${SITE_URL}/android-chrome-512x512.png`
      }
    }
  };

  return JSON.stringify(schema);
}

/**
 * Calculate reading time from word count
 */
export function calculateReadingTime(wordCount: number): string {
  const wordsPerMinute = 200;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return `${minutes} min read`;
}
