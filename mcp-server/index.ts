/**
 * MCP Server for Supabase Post Operations
 * Provides post details, sitemap, RSS feed, and news schema generation
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { createClient } from "@supabase/supabase-js";

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// Site configuration
const SITE_CONFIG = {
  name: "Bansgavsandesh",
  url: "https://bansgavsandesh.com",
  description: "Latest News and Updates from India",
  language: "hi",
  locale: "hi_IN",
};

const server = new Server(
  {
    name: "supabase-post-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool definitions
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_post_by_id",
        description: "Fetch post details by post ID from Supabase",
        inputSchema: {
          type: "object",
          properties: {
            postId: {
              type: "string",
              description: "The UUID of the post",
            },
          },
          required: ["postId"],
        },
      },
      {
        name: "get_posts_for_sitemap",
        description: "Fetch all active posts for XML sitemap generation",
        inputSchema: {
          type: "object",
          properties: {
            limit: {
              type: "number",
              description: "Maximum number of posts to fetch",
              default: 1000,
            },
          },
        },
      },
      {
        name: "get_posts_for_rss",
        description: "Fetch recent posts for RSS feed generation",
        inputSchema: {
          type: "object",
          properties: {
            limit: {
              type: "number",
              description: "Maximum number of posts to fetch",
              default: 50,
            },
          },
        },
      },
      {
        name: "get_posts_for_news_sitemap",
        description: "Fetch recent posts for Google News sitemap",
        inputSchema: {
          type: "object",
          properties: {
            daysLimit: {
              type: "number",
              description: "Number of days to look back for news",
              default: 2,
            },
            limit: {
              type: "number",
              description: "Maximum number of posts to fetch",
              default: 1000,
            },
          },
        },
      },
      {
        name: "generate_sitemap_xml",
        description: "Generate complete XML sitemap",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "generate_rss_feed",
        description: "Generate RSS 2.0 feed",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "generate_news_sitemap",
        description: "Generate Google News sitemap",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  };
});

// Tool handlers
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "get_post_by_id": {
        const { postId } = args as { postId: string };
        
        const { data: post, error } = await supabase
          .from("posts")
          .select(`
            *,
            profiles:user_id(name, avatar_url),
            cities:city_id(name)
          `)
          .eq("id", postId)
          .eq("is_active", true)
          .single();

        if (error) throw error;
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(post, null, 2),
            },
          ],
        };
      }

      case "get_posts_for_sitemap": {
        const { limit = 1000 } = args as { limit?: number };
        
        const { data: posts, error } = await supabase
          .from("posts")
          .select("id, title, created_at, updated_at")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(limit);

        if (error) throw error;

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(posts, null, 2),
            },
          ],
        };
      }

      case "get_posts_for_rss": {
        const { limit = 50 } = args as { limit?: number };
        
        const { data: posts, error } = await supabase
          .from("posts")
          .select(`
            id,
            title,
            caption,
            media_urls,
            media_type,
            created_at,
            updated_at,
            profiles:user_id(name),
            cities:city_id(name)
          `)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(limit);

        if (error) throw error;

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(posts, null, 2),
            },
          ],
        };
      }

      case "get_posts_for_news_sitemap": {
        const { daysLimit = 2, limit = 1000 } = args as { daysLimit?: number; limit?: number };
        const daysAgo = new Date(Date.now() - daysLimit * 24 * 60 * 60 * 1000).toISOString();
        
        const { data: posts, error } = await supabase
          .from("posts")
          .select(`
            id,
            title,
            caption,
            media_urls,
            created_at,
            profiles:user_id(name),
            cities:city_id(name)
          `)
          .eq("is_active", true)
          .gte("created_at", daysAgo)
          .order("created_at", { ascending: false })
          .limit(limit);

        if (error) throw error;

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(posts, null, 2),
            },
          ],
        };
      }

      case "generate_sitemap_xml": {
        const { data: posts } = await supabase
          .from("posts")
          .select("id, title, created_at, updated_at")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(1000);

        const { data: cities } = await supabase
          .from("cities")
          .select("id, name")
          .order("name");

        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_CONFIG.url}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
  </url>
  
  <url>
    <loc>${SITE_CONFIG.url}/explore</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>

  ${cities?.map(city => `
  <url>
    <loc>${SITE_CONFIG.url}/explore?city=${encodeURIComponent(city.id)}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`).join('') || ''}

  ${posts?.map(post => {
    const lastmod = post.updated_at || post.created_at;
    const isRecent = new Date(post.created_at) > new Date(Date.now() - 48 * 60 * 60 * 1000);
    
    return `
  <url>
    <loc>${SITE_CONFIG.url}/post/${post.id}</loc>
    <lastmod>${new Date(lastmod).toISOString()}</lastmod>
    <changefreq>${isRecent ? 'hourly' : 'daily'}</changefreq>
    <priority>${isRecent ? '0.9' : '0.7'}</priority>
  </url>`;
  }).join('') || ''}

</urlset>`;

        return {
          content: [
            {
              type: "text",
              text: sitemap,
            },
          ],
        };
      }

      case "generate_rss_feed": {
        const { data: posts } = await supabase
          .from("posts")
          .select(`
            id,
            title,
            caption,
            media_urls,
            media_type,
            created_at,
            updated_at,
            profiles:user_id(name),
            cities:city_id(name)
          `)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(50);

        const buildDate = new Date().toUTCString();
        const lastBuildDate = posts?.[0]?.created_at 
          ? new Date(posts[0].created_at).toUTCString() 
          : buildDate;

        const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:dc="http://purl.org/dc/elements/1.1/"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${SITE_CONFIG.name}</title>
    <link>${SITE_CONFIG.url}</link>
    <description>${SITE_CONFIG.description}</description>
    <language>${SITE_CONFIG.language}</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <pubDate>${buildDate}</pubDate>
    <ttl>60</ttl>
    <atom:link href="${SITE_CONFIG.url}/rss.xml" rel="self" type="application/rss+xml"/>

${posts?.map(post => {
  const title = post.title || 'Latest Update';
  const description = post.caption || title;
  const pubDate = new Date(post.created_at).toUTCString();
  const postUrl = `${SITE_CONFIG.url}/post/${post.id}`;
  const author = post.profiles?.name || SITE_CONFIG.name;
  const category = post.cities?.name || 'News';

  let content = `<![CDATA[`;
  if (post.media_urls && post.media_urls[0]) {
    if (post.media_type === 'video') {
      content += `<video controls style="max-width: 100%; height: auto;">
        <source src="${post.media_urls[0]}" type="video/mp4">
      </video><br/>`;
    } else {
      content += `<img src="${post.media_urls[0]}" alt="${title}" style="max-width: 100%; height: auto;"/><br/>`;
    }
  }
  content += `<p>${description}</p>]]>`;

  return `
    <item>
      <title><![CDATA[${title}]]></title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <description><![CDATA[${description}]]></description>
      <content:encoded>${content}</content:encoded>
      <pubDate>${pubDate}</pubDate>
      <dc:creator>${author}</dc:creator>
      <category>${category}</category>
      ${post.media_urls && post.media_urls[0] ? `
      <enclosure url="${post.media_urls[0]}" type="${post.media_type === 'video' ? 'video/mp4' : 'image/jpeg'}"/>
      <media:content url="${post.media_urls[0]}" medium="${post.media_type === 'video' ? 'video' : 'image'}" type="${post.media_type === 'video' ? 'video/mp4' : 'image/jpeg'}"/>` : ''}
    </item>`;
}).join('') || ''}

  </channel>
</rss>`;

        return {
          content: [
            {
              type: "text",
              text: rss,
            },
          ],
        };
      }

      case "generate_news_sitemap": {
        const daysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
        
        const { data: posts } = await supabase
          .from("posts")
          .select(`
            id,
            title,
            caption,
            media_urls,
            created_at,
            profiles:user_id(name),
            cities:city_id(name)
          `)
          .eq("is_active", true)
          .gte("created_at", daysAgo)
          .order("created_at", { ascending: false })
          .limit(1000);

        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  
  ${posts?.map(post => {
    const title = post.title || 'Latest Update';
    const keywords = `${post.cities?.name || 'India'}, news, updates`;
    const publicationDate = new Date(post.created_at).toISOString();
    
    return `
  <url>
    <loc>${SITE_CONFIG.url}/post/${post.id}</loc>
    <news:news>
      <news:publication>
        <news:name>${SITE_CONFIG.name}</news:name>
        <news:language>${SITE_CONFIG.language}</news:language>
      </news:publication>
      <news:publication_date>${publicationDate}</news:publication_date>
      <news:title><![CDATA[${title}]]></news:title>
      <news:keywords>${keywords}</news:keywords>
    </news:news>
    ${post.media_urls && post.media_urls[0] ? `
    <image:image>
      <image:loc>${post.media_urls[0]}</image:loc>
      <image:caption><![CDATA[${title}]]></image:caption>
      <image:title><![CDATA[${title}]]></image:title>
    </image:image>` : ''}
    <lastmod>${publicationDate}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
  </url>`;
  }).join('') || ''}

</urlset>`;

        return {
          content: [
            {
              type: "text",
              text: sitemap,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
