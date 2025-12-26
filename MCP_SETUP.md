# MCP Server Setup for Bansgavsandesh

## Overview
This project now uses MCP (Model Context Protocol) server for Supabase operations to fetch post details and generate sitemaps, RSS feeds, and news schemas.

## Database Schema Reference

### Posts Table Columns
- `id` (UUID) - Primary key
- `title` (TEXT)
- `caption` (TEXT)
- `content` (TEXT)
- `media_urls` (TEXT[])
- `media_type` (TEXT)
- `user_id` (UUID) - FK to profiles
- `city_id` (UUID) - FK to cities
- `is_active` (BOOLEAN)
- `likes_count` (INTEGER)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

### Post Comments Table Columns
- `id` (UUID) - Primary key
- `post_id` (UUID) - FK to posts
- `user_id` (UUID) - FK to profiles
- **`content`** (TEXT) - Comment text (NOT 'comment')
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

### Post Likes Table Columns
- `id` (UUID) - Primary key
- `post_id` (UUID) - FK to posts
- `user_id` (UUID) - FK to profiles
- `created_at` (TIMESTAMPTZ)

### Profiles Table Columns
- `id` (UUID) - Primary key
- `name` (TEXT)
- `avatar_url` (TEXT)
- `has_blue_tick` (BOOLEAN)

### Cities Table Columns
- `id` (UUID) - Primary key
- `name` (TEXT)

## URL Structure Changes

### Before (Slug-based)
```
/post/स्वर्गीय-ब्रह्मदेव-मद्धेशिया-54eb0a03-2a43-4c3b-9ffd-ec2f74113e28
```

### After (ID-based)
```
/post/54eb0a03-2a43-4c3b-9ffd-ec2f74113e28
```

## MCP Server Installation

1. Install MCP server dependencies:
```bash
cd mcp-server
npm install
```

2. Build the MCP server:
```bash
npm run build
```

3. Run the MCP server:
```bash
npm start
```

## Available MCP Tools

### 1. get_post_by_id
Fetch complete post details including relations.
```json
{
  "postId": "uuid-here"
}
```

### 2. get_posts_for_sitemap
Fetch all active posts for sitemap generation.
```json
{
  "limit": 1000
}
```

### 3. get_posts_for_rss
Fetch recent posts for RSS feed.
```json
{
  "limit": 50
}
```

### 4. get_posts_for_news_sitemap
Fetch recent posts for Google News sitemap.
```json
{
  "daysLimit": 2,
  "limit": 1000
}
```

### 5. generate_sitemap_xml
Generate complete XML sitemap.

### 6. generate_rss_feed
Generate RSS 2.0 feed.

### 7. generate_news_sitemap
Generate Google News sitemap.

## Updated Files

### Routes Updated to Use Post ID
- ✅ `/src/app/post/[id]/page.tsx` - Post detail page
- ✅ `/src/app/sitemap.xml/route.ts` - XML sitemap
- ✅ `/src/app/rss.xml/route.ts` - RSS feed
- ✅ `/src/app/news-sitemap.xml/route.ts` - Google News sitemap
- ✅ `/src/app/feed.json/route.ts` - JSON feed

### Components Updated
- ✅ `/src/components/post/PostDetail.tsx` - Share URLs use ID
- ✅ `/src/components/posts/PostCard.tsx` - Navigation and sharing use ID

## Environment Variables

Ensure these are set in your `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Testing

Test the new ID-based URLs:
```bash
# Home page
curl http://localhost:3000/

# Post by ID
curl http://localhost:3000/post/b8d621b7-46d2-4573-94b7-4d45a948e281

# Sitemap
curl http://localhost:3000/sitemap.xml

# RSS Feed
curl http://localhost:3000/rss.xml

# News Sitemap
curl http://localhost:3000/news-sitemap.xml

# JSON Feed
curl http://localhost:3000/feed.json
```

## Benefits of ID-based URLs

1. **No slug encoding issues** - No problems with Hindi/Devanagari characters
2. **Simpler routing** - Direct UUID lookup in database
3. **Better performance** - No need to parse/extract ID from slug
4. **Cleaner URLs** - Shorter and more predictable
5. **SEO maintained** - Title in metadata and JSON-LD for search engines

## Common Supabase Query Patterns

### Fetch Post with Relations
```typescript
const { data: post, error } = await supabase
  .from('posts')
  .select(`
    *,
    profiles:user_id(id, name, avatar_url, has_blue_tick),
    cities:city_id(id, name),
    post_likes(user_id),
    post_comments(id, content, created_at, profiles:user_id(name, avatar_url))
  `)
  .eq('id', postId)
  .eq('is_active', true)
  .single()
```

### Important Notes
- Always use `content` for post_comments, not `comment`
- Include relations using the foreign key notation: `profiles:user_id(...)`
- Filter by `is_active: true` for public posts
