# MCP Server README

## Supabase Post Operations MCP Server

This MCP server provides tools for fetching post data from Supabase and generating sitemaps, RSS feeds, and news schemas.

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Usage

The server runs on stdio and provides the following tools:

- `get_post_by_id` - Fetch post details by UUID
- `get_posts_for_sitemap` - Fetch posts for sitemap generation
- `get_posts_for_rss` - Fetch posts for RSS feed
- `get_posts_for_news_sitemap` - Fetch posts for Google News
- `generate_sitemap_xml` - Generate complete sitemap
- `generate_rss_feed` - Generate RSS 2.0 feed
- `generate_news_sitemap` - Generate Google News sitemap

## Environment Variables

Create a `.env` file in the mcp-server directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Configuration

Update the SITE_CONFIG in `index.ts` to match your site settings:

```typescript
const SITE_CONFIG = {
  name: "Bansgavsandesh",
  url: "https://bansgavsandesh.com",
  description: "Latest News and Updates from India",
  language: "hi",
  locale: "hi_IN",
};
```
