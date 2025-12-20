'use client'

import React from 'react'
import { Spin } from 'antd'
import PostCard, { PostWithAuthor } from './PostCard'
import SponsoredPostCard from '../ads/SponsoredPostCard'
import AdminBanner from '../ads/AdminBanner'
import { fetchActiveUserAds, fetchActiveBanners, trackAdImpression, trackAdClick } from '../../app/actions/adActions'

interface PostListProps {
  posts: PostWithAuthor[]
  currentUserId?: string // Made optional for guest users
  isGuest?: boolean
  isLoading?: boolean
  onUpdate?: (post: PostWithAuthor) => void
  onDelete?: (postId: string) => void
  onLoginRequired?: () => void
  emptyState?: React.ReactNode
  className?: string
}

export function PostList({
  posts,
  currentUserId,
  isGuest = false,
  isLoading = false,
  onUpdate,
  onDelete,
  onLoginRequired,
  emptyState,
  className,
}: PostListProps) {
  const [userAds, setUserAds] = React.useState<any[]>([])
  const [adminBanners, setAdminBanners] = React.useState<any[]>([])

  React.useEffect(() => {
    const fetchAds = async () => {
      try {
        const [ads, banners] = await Promise.all([
          fetchActiveUserAds(),
          fetchActiveBanners()
        ])
        setUserAds(ads)
        setAdminBanners(banners)
      } catch (error) {
        console.error('Error fetching ads for feed:', error)
      }
    }
    fetchAds()
  }, [])

  const handleAdImpression = async (adId: string, type: 'post' | 'banner') => {
    await trackAdImpression(adId, type)
  }

  const handleAdClick = async (adId: string, type: 'post' | 'banner') => {
    await trackAdClick(adId, type)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spin size="large" />
      </div>
    )
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="py-8">
        {emptyState || (
          <div className="text-center text-gray-500">
            <p>No posts yet.</p>
          </div>
        )}
      </div>
    )
  }

  const containerClassName = ['space-y-4', className].filter(Boolean).join(' ')

  return (
    <div className={containerClassName}>
      {posts.map((post, index) => (
        <React.Fragment key={`post-wrapper-${post.id}`}>
          <PostCard
            post={post}
            currentUserId={currentUserId}
            isGuest={isGuest}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onLoginRequired={onLoginRequired}
          />
          {/* Inject Ads every 5 posts */}
          {(index + 1) % 5 === 0 && userAds.length > 0 && (
            <SponsoredPostCard
              ad={userAds[(Math.floor((index + 1) / 5) - 1) % userAds.length]}
              onImpression={(id) => handleAdImpression(id, 'post')}
              onClick={(id) => handleAdClick(id, 'post')}
            />
          )}
          {/* Inject Admin Banner every 8 posts (offset) */}
          {(index + 1) % 8 === 0 && adminBanners.length > 0 && (
            <AdminBanner
              ad={adminBanners[(Math.floor((index + 1) / 8) - 1) % adminBanners.length]}
              onImpression={(id) => handleAdImpression(id, 'banner')}
              onClick={(id) => handleAdClick(id, 'banner')}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

