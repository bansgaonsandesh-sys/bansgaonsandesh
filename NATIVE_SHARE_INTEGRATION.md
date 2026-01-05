# Native Share Integration for Bansgaon Sandesh Website

## Overview

The website now seamlessly detects whether it's running in the native mobile app or web browser, and provides the optimal sharing experience for each platform.

## Features

✅ **Auto-Detection** - Automatically detects if running in mobile app  
✅ **Native Sharing** - Uses app's native share with image previews  
✅ **Web Fallback** - Falls back to Web Share API on browser  
✅ **Rich Content** - Shares with title, image, description, hashtags  
✅ **Page Meta Tags** - Auto-extracts Open Graph data for previews  
✅ **Deep Linking** - Can trigger app navigation from shares  

## Files Created

1. **[native-share-bridge.ts](src/lib/native-share-bridge.ts)** - Core bridge library
2. **[useNativeShare.ts](src/hooks/useNativeShare.ts)** - React hook for sharing
3. **[ShareButton.tsx](src/components/shared/ShareButton.tsx)** - Reusable share button component
4. **[NATIVE_SHARE_INTEGRATION.md](NATIVE_SHARE_INTEGRATION.md)** - This guide

## Quick Start

### 1. Add Share Button to News List

```tsx
import ShareButton from '@/components/shared/ShareButton';

// In PostCard.tsx or similar
<ShareButton
  postId={post.id}
  title={post.title}
  description={post.caption}
  imageUrl={post.media_urls?.[0]}
  variant="icon"
  size="small"
/>
```

### 2. Add Share Button to Detail Page

```tsx
import ShareButton from '@/components/shared/ShareButton';

// In PostDetail component
<ShareButton
  postId={postId}
  title={title}
  description={caption}
  imageUrl={mediaUrl}
  author={authorName}
  showText={true}
/>
```

### 3. Use the Hook Directly

```tsx
import useNativeShare from '@/hooks/useNativeShare';

export function MyComponent() {
  const { isNativeApp, sharePost, error } = useNativeShare();

  return (
    <button onClick={() => sharePost({
      id: 'post-123',
      title: 'Amazing News',
      description: 'Read the full story',
      imageUrl: 'https://...',
    })}>
      Share {isNativeApp && '(in App)'}
    </button>
  );
}
```

## API Reference

### Native Share Bridge Library

#### `detectNativeApp()`

Detect if running in mobile app.

```typescript
import { detectNativeApp } from '@/lib/native-share-bridge';

const { isNativeApp, platform } = detectNativeApp();
// Returns: { isNativeApp: boolean, platform: 'android' | 'ios' | 'web', ... }
```

#### `shareNatively(data)`

Share with native bridge or Web Share API.

```typescript
import { shareNatively } from '@/lib/native-share-bridge';

await shareNatively({
  title: 'Check this out!',
  text: 'Description of content',
  url: 'https://bansgaonsandesh.com/post/123',
  imageUrl: 'https://cdn.example.com/image.jpg',
  hashtags: ['#News', '#Breaking'],
});
```

#### `sharePageNatively(overrides?)`

Auto-detect page data and share.

```typescript
import { sharePageNatively } from '@/lib/native-share-bridge';

// Automatically extracts:
// - Page title (from og:title or document.title)
// - Page description (from og:description)
// - Page image (from og:image)
// - Current URL (window.location.href)
// - Hashtags (from page keywords)

await sharePageNatively({
  // Optional overrides
  hashtags: ['#Custom', '#Tags'],
});
```

#### `getPagePreview()`

Extract page meta data.

```typescript
import { getPagePreview } from '@/lib/native-share-bridge';

const preview = getPagePreview();
// Returns: { title, description, imageUrl, url, text }
```

### React Hook: `useNativeShare()`

```typescript
const {
  isNativeApp,        // boolean - running in mobile app
  isLoading,          // boolean - sharing in progress
  error,              // Error | null
  detection,          // DetectionResult - platform details
  share,              // (data) => Promise<boolean>
  sharePage,          // (overrides?) => Promise<boolean>
  sharePost,          // (postData) => Promise<boolean>
  getPreview,         // () => PagePreview
  getHashtags,        // () => string[]
} = useNativeShare({
  onSuccess: () => { /* ... */ },
  onError: (error) => { /* ... */ },
  autoDetect: true,
});
```

### ShareButton Component

```tsx
<ShareButton
  postId="123"
  title="Post Title"
  description="Post description"
  imageUrl="https://..."
  author="Author Name"
  variant="icon" | "default" | "text"
  size="small" | "middle" | "large"
  showText={false}
  className="custom-class"
  customData={{...}}  // Optional custom share data
/>
```

## Open Graph Meta Tags

Ensure these are set on all pages for proper link previews:

```html
<!-- Title -->
<meta property="og:title" content="Your News Title" />

<!-- Description -->
<meta property="og:description" content="Brief description of the news" />

<!-- Image (IMPORTANT for share preview) -->
<meta property="og:image" content="https://cdn.example.com/image.jpg" />

<!-- URL -->
<meta property="og:url" content="https://bansgaonsandesh.com/post/123" />

<!-- Type -->
<meta property="og:type" content="article" />

<!-- Twitter Card (optional but recommended) -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="https://cdn.example.com/image.jpg" />

<!-- Keywords (used for auto-hashtags) -->
<meta name="keywords" content="news, breaking, update, bansgaon" />
```

## Implementation Examples

### Example 1: Share Button in Post Card

```tsx
'use client'

import ShareButton from '@/components/shared/ShareButton';
import { Card, Row, Col } from 'antd';

interface PostCardProps {
  post: {
    id: string;
    title: string;
    caption: string;
    media_urls?: string[];
    author?: string;
  };
}

export function PostCard({ post }: PostCardProps) {
  return (
    <Card>
      <Row justify="space-between">
        <Col>
          <h3>{post.title}</h3>
          <p>{post.caption}</p>
        </Col>
        <Col>
          <ShareButton
            postId={post.id}
            title={post.title}
            description={post.caption}
            imageUrl={post.media_urls?.[0]}
            variant="icon"
          />
        </Col>
      </Row>
    </Card>
  );
}
```

### Example 2: Share with Custom Hook

```tsx
'use client'

import { useNativeShare } from '@/hooks/useNativeShare';
import { Button, Space } from 'antd';
import { ShareAltOutlined } from '@ant-design/icons';

interface ArticleViewProps {
  articleId: string;
  title: string;
  content: string;
  imageUrl: string;
}

export function ArticleView({ articleId, title, content, imageUrl }: ArticleViewProps) {
  const { isNativeApp, sharePost, isLoading } = useNativeShare();

  return (
    <div>
      <h1>{title}</h1>
      <img src={imageUrl} alt={title} />
      <article>{content}</article>

      <Space>
        <Button
          type="primary"
          icon={<ShareAltOutlined />}
          loading={isLoading}
          onClick={() => sharePost({
            id: articleId,
            title,
            description: content.substring(0, 100),
            imageUrl,
          })}
        >
          Share {isNativeApp ? '(App)' : '(Web)'}
        </Button>
      </Space>
    </div>
  );
}
```

### Example 3: Share Current Page

```tsx
'use client'

import { useNativeShare } from '@/hooks/useNativeShare';
import { Button } from 'antd';

export function PageShareButton() {
  const { sharePage, isLoading } = useNativeShare();

  return (
    <Button
      loading={isLoading}
      onClick={() => sharePage({
        hashtags: ['#MyCustomTag'],
      })}
    >
      Share This Page
    </Button>
  );
}
```

## Platform Detection

The bridge automatically detects:

- **Mobile App** (Android/iOS)
  - `ReactNativeWebView` object available
  - `window.nativeShare()` function available
  - Custom user agent includes WebView identifier

- **Web Browser**
  - Falls back to Web Share API
  - Falls back to copy link on older browsers

## Sharing Flow

```
┌─────────────────┐
│  User clicks    │
│  Share Button   │
└────────┬────────┘
         │
    ┌────▼──────────┐
    │ Detect if app │
    └────┬──────────┘
         │
    ┌────▼────────────────────┐
    │ Is Native App?          │
    └────┬──────────────┬──────┘
         │ Yes          │ No
    ┌────▼───────┐  ┌──▼──────────┐
    │ Use Native │  │ Web Share API│
    │ Share with │  │ or Copy Link │
    │ Image      │  └──────────────┘
    │ Preview    │
    └────┬───────┘
         │
    ┌────▼─────────────┐
    │ Share with       │
    │ - Title          │
    │ - Description    │
    │ - Image          │
    │ - Hashtags       │
    │ - App Store Link │
    └──────────────────┘
```

## Best Practices

### 1. Always Set Open Graph Tags

```html
<!-- ✅ Good - user sees preview -->
<meta property="og:image" content="https://cdn.example.com/news-123.jpg" />
<meta property="og:title" content="Breaking News Title" />
<meta property="og:description" content="News summary here" />

<!-- ❌ Bad - no preview in share sheet -->
<meta property="og:title" content="Click here for news" />
```

### 2. Use Descriptive Titles

```typescript
// ✅ Good
sharePost({
  title: 'Mumbai Traffic Alert: Highway Closure Expected Today',
  description: 'Stay informed about travel delays...',
})

// ❌ Bad
sharePost({
  title: 'News',
  description: 'Read more...',
})
```

### 3. Always Include Images

```typescript
// ✅ Good - image will show in share preview
const preview = getPagePreview();
await shareNatively({
  ...preview,
  imageUrl: imageUrl, // Always include
});

// ❌ Bad - no visual preview
shareNatively({
  title: 'News',
  url: 'https://...',
  // Missing imageUrl
});
```

### 4. Optimize Images

- Size: 400x300px or 1200x630px
- Format: JPG or PNG
- Size: < 100KB
- HTTPS URL only

### 5. Include Relevant Hashtags

```typescript
// ✅ Good
hashtags: ['#Mumbai', '#News', '#Breaking', '#BansgaonSandesh']

// ❌ Bad
hashtags: ['#a', '#b', '#c', '#d', '#e', '#f', '#g', '#h']  // Too many
```

## Troubleshooting

### Share Button Doesn't Appear

- Check if `ReactNativeWebView` is available in dev tools console
- Ensure Open Graph tags are set
- Verify image URL is HTTPS

### Sharing Fails on Mobile

- Check app has proper permissions (see [app.json permissions](../bansgavsandesh-webview-app/app.json))
- Test on physical device, not emulator
- Check network connectivity

### Image Not Showing in Share Preview

- Verify image URL is accessible and HTTPS
- Check image size and format (JPG/PNG)
- Ensure `og:image` meta tag is correctly set
- Test with small image URL directly

### Web Share API Not Working

- Only works on HTTPS (except localhost)
- Not supported on older browsers
- Check if user has gesture (must be user-triggered)

## Testing Checklist

- [ ] Share button appears on post cards
- [ ] Share button appears on detail pages
- [ ] Clicking share opens native sheet (app) or Web Share API (web)
- [ ] Image preview shows correctly
- [ ] Title and description are present
- [ ] Hashtags are included
- [ ] App store link is in message
- [ ] Link opens post correctly when shared

## Related Documentation

- [Deep Linking Guide](../bansgavsandesh-webview-app/DEEP_LINKING_GUIDE.md)
- [Rich Share Guide](../bansgavsandesh-webview-app/RICH_SHARE_GUIDE.md)
- [AdvancedWebView](../bansgavsandesh-webview-app/AdvancedWebView.js)
- [OpenGraph Documentation](https://ogp.me/)
- [Web Share API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API)
