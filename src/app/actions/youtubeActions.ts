'use server'

import { parseStringPromise } from 'xml2js'

interface YouTubeVideo {
  id: string
  title: string
  description: string
  thumbnail: string
  publishedAt: string
  url: string
  channelTitle: string
}

const CHANNEL_HANDLE = '@thebansgaonsandesh'
const CHANNEL_URL = `https://www.youtube.com/${CHANNEL_HANDLE}`

/**
 * Fetch videos from YouTube channel using RSS feed
 * No API key required, but limited data available
 */
export async function fetchYouTubeVideos(): Promise<YouTubeVideo[]> {
  try {
    // For YouTube RSS feed, we need the channel ID
    // You can get channel ID from: https://www.youtube.com/channel_switcher
    // Or from the channel page source code
    
    // Using a hardcoded channel ID for now
    // Replace 'UCxxxxxxxxxxxxxxxxx' with your actual channel ID
    const channelId = 'UCR0j7h4_vxqEbYE1O-kIZyQ' // Replace with actual channel ID
    
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`
    
    const response = await fetch(rssUrl, {
      next: { revalidate: 3600 } // Cache for 1 hour
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch YouTube RSS feed')
    }
    
    const xmlData = await response.text()
    const parsedData = await parseStringPromise(xmlData)
    
    const entries = parsedData.feed?.entry || []
    
    const videos: YouTubeVideo[] = entries.map((entry: any) => {
      const videoId = entry['yt:videoId']?.[0] || ''
      const mediaGroup = entry['media:group']?.[0] || {}
      
      return {
        id: videoId,
        title: entry.title?.[0] || '',
        description: mediaGroup['media:description']?.[0] || '',
        thumbnail: mediaGroup['media:thumbnail']?.[0]?.$.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        publishedAt: entry.published?.[0] || new Date().toISOString(),
        url: `https://www.youtube.com/watch?v=${videoId}`,
        channelTitle: entry.author?.[0]?.name?.[0] || 'The Bansgaon Sandesh'
      }
    })
    
    return videos
  } catch (error) {
    console.error('Error fetching YouTube videos:', error)
    // Return empty array instead of throwing to prevent page crash
    return []
  }
}

/**
 * Get channel information
 */
export async function getChannelInfo() {
  return {
    handle: CHANNEL_HANDLE,
    url: CHANNEL_URL,
    name: 'The Bansgaon Sandesh'
  }
}
