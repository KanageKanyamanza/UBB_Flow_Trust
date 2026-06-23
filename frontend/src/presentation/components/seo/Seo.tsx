import React from 'react'
import { Helmet } from 'react-helmet-async'

const SITE_NAME = 'UBBFlow'
const DEFAULT_IMAGE = '/og-image.png'
const SITE_URL = 'https://ubbflow.app'

export interface SeoProps {
  /** Page-specific title. Will be rendered as-is (include the brand suffix yourself if desired). */
  title: string
  /** Page-specific meta description. */
  description?: string
  /** Absolute canonical URL for this page. Falls back to the site root if omitted. */
  canonical?: string
  /** Set true to render a noindex,nofollow robots meta tag (private/app pages). */
  noindex?: boolean
  /** Absolute or root-relative URL to the social preview image. */
  image?: string
  /** Open Graph type, e.g. "website", "profile", "article". */
  type?: string
  /** Optional raw JSON-LD object(s) to embed as <script type="application/ld+json">. */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[]
}

/**
 * Reusable per-page SEO component built on react-helmet-async.
 * Renders title, meta description, robots, canonical, Open Graph, Twitter Card
 * and optional JSON-LD structured data.
 */
export function Seo({
  title,
  description,
  canonical,
  noindex = false,
  image = DEFAULT_IMAGE,
  type = 'website',
  jsonLd,
}: SeoProps) {
  const resolvedCanonical = canonical || SITE_URL
  const resolvedImage = image.startsWith('http') ? image : `${SITE_URL}${image}`

  return (
    <Helmet>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      <meta name="robots" content={noindex ? 'noindex,nofollow' : 'index,follow'} />
      <link rel="canonical" href={resolvedCanonical} />

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:image" content={resolvedImage} />
      <meta property="og:url" content={resolvedCanonical} />
      <meta property="og:type" content={type} />
      <meta property="og:locale" content="fr_FR" />
      <meta property="og:site_name" content={SITE_NAME} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={resolvedImage} />

      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  )
}

export default Seo
