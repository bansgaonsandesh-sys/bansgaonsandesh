'use client'

import React, { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Spin } from 'antd'
import { useQueryClient } from '@tanstack/react-query'
import { useApp } from '../lib/providers'
import { useInfinitePosts } from '../hooks/useInfinitePosts'
import { usePostUpdateHandlers } from '../hooks/usePostUpdateHandlers'
import PostCard from '../components/posts/PostCard'
import InfiniteScrollList from '../components/shared/InfiniteScrollList'
import PullToRefresh from '../components/shared/PullToRefresh'
import SponsoredPostCard from '../components/ads/SponsoredPostCard'
import AdminBanner from '../components/ads/AdminBanner'
import { siteConfig } from '@/config/site'

interface Post {
  id: string
  user_id: string
  title: string | null
  caption: string | null
  media_urls: string[]
  media_type: 'image' | 'video'
  likes_count: number
  comments_count: number
  shares_count: number
  created_at: string
  profiles: {
    id: string
    name: string
    avatar_url: string | null
    is_verified: boolean
    has_blue_tick: boolean
  }
  is_liked?: boolean
}

export default function HomePage() {
  const {
    user,
    selectedCity,
    isLoading: isUserLoading,
    isCityReady,
    isGuest
  } = useApp()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [ads, setAds] = React.useState<any[]>([])
  const [bannerAds, setBannerAds] = React.useState<any[]>([])

  // Fetch Ads
  useEffect(() => {
    import('./actions/adActions').then(async ({ fetchActiveUserAds, fetchActiveBanners }) => {
      const userAds = await fetchActiveUserAds()
      const banners = await fetchActiveBanners()
      setAds(userAds)
      setBannerAds(banners)
    })
  }, [])

  // No longer redirect to auth - allow public access
  // Users can browse content and will be prompted to login only when needed

  // Use infinite query for posts - only enabled when city is ready
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
    refetch,
  } = useInfinitePosts(selectedCity, user?.id || null)

  // Flatten paginated data
  const posts = useMemo(() => {
    return data?.pages.flatMap(page => page.data) || []
  }, [data])

  // Handle pull to refresh
  const handleRefresh = async () => {
    console.log('🔄 Refreshing posts...')
    await queryClient.invalidateQueries({ queryKey: ['posts', 'infinite'] })
    await refetch()
  }

  const { handleUpdate: handleUpdatePost, handleDelete: handleDeletePost } = usePostUpdateHandlers({
    mode: 'react-query',
    queryClient,
    queryKey: ['posts', 'infinite', selectedCity, user?.id],
  })

  // Loading state - show spinner while user authentication is loading
  // For guests, we only need city to be ready
  if (isUserLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <Spin size="large" />
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    )
  }

  // If city is not ready, the CitySelectionModal will show (handled in layout)
  // But we can still show the page structure

  // No city selected (should not happen but handle gracefully)
  if (!selectedCity) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-600">Please select a city to continue</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto md:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Main Feed Column */}
          <div className="lg:col-span-8 xl:col-span-7 space-y-4">
            {/* Admin Banner Carousel - Show all banners */}
            {bannerAds.length > 0 && <AdminBanner ads={bannerAds} />}

            <PullToRefresh onRefresh={handleRefresh}>
              <InfiniteScrollList
                data={posts}
                isLoading={isLoading}
                isFetchingNextPage={isFetchingNextPage}
                hasNextPage={hasNextPage || false}
                fetchNextPage={fetchNextPage}
                error={error}
                retry={refetch}
                renderItem={(post, index) => {
                  // Interleave Ads: Show ad after every 5th post
                  // adIndex calculation:
                  // index 4 -> 1st ad (index 0)
                  // index 9 -> 2nd ad (index 1)
                  const showAd = (index + 1) % 5 === 0
                  const adIndex = Math.floor((index + 1) / 5) - 1
                  const ad = ads[adIndex]

                  return (
                    <div className="mb-4" key={post.id}>
                      <PostCard
                        post={post}
                        currentUserId={user?.id}
                        isGuest={isGuest}
                        onUpdate={handleUpdatePost}
                        onDelete={handleDeletePost}
                        onLoginRequired={() => router.push('/auth/login')}
                      />
                      {showAd && ad && (
                        <div className="mt-4">
                          <SponsoredPostCard ad={ad} />
                        </div>
                      )}
                    </div>
                  )
                }}
                emptyMessage={`No posts in ${selectedCity || 'your city'} yet. Be the first to share!`}
                loadingMessage="Loading your feed..."
                className="space-y-0"
              />
            </PullToRefresh>
          </div>

          {/* Right Sidebar (Desktop Only) */}
          <div className="hidden lg:block lg:col-span-4 xl:col-span-5 space-y-6">
            <div className="sticky top-24 space-y-6">

              {/* Community Info Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-2">
                  {selectedCity || 'Your City'}
                </h2>
                <p className="text-gray-500 mb-4">
                  Connect with your local community. Share updates, news, and events happening around you.
                </p>
                {user && user.is_verified && (
                  <button
                    onClick={() => router.push('/ads/create')}
                    className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-xl hover:opacity-90 transition-opacity mt-2"
                  >
                    Create Ads
                  </button>
                )}
              </div>

              {/* Quick Links / Footer */}
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-400 px-2">
                <a href="/about" className="hover:underline">About</a>
                <a href="/privacy" className="hover:underline">Privacy</a>
                <a href="/terms" className="hover:underline">Terms</a>
                <span>© {new Date().getFullYear()} {siteConfig.name}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
