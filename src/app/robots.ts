import type { MetadataRoute } from 'next'

import { siteConfig as SITE_CONFIG, getAbsoluteUrl as getFullUrl } from '@/config/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/auth/', '/api/', '/wallet', '/profile/edit'],
      },
      {
        userAgent: 'Googlebot-News',
        allow: ['/post/', '/'],
        disallow: ['/auth/', '/admin/', '/api/'],
      },
    ],
    sitemap: [
      getFullUrl('/sitemap.xml'),
      getFullUrl('/news-sitemap.xml'),
    ],
  }
}
