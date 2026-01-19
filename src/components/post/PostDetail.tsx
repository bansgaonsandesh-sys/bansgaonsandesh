'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { hi } from 'date-fns/locale'
import { Heart, MessageCircle, Share2, MapPin, Calendar, Eye } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import ShareButton from '@/components/shared/ShareButton'
import { getPostProjectFilter } from '@/config/projects'

interface PostDetailProps {
  post: any
}

export default function PostDetail({ post }: PostDetailProps) {
  const [likes, setLikes] = useState(post.likes_count || 0)
  const [isLiked, setIsLiked] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [relatedPosts, setRelatedPosts] = useState<any[]>([])

  useEffect(() => {
    fetchRelatedPosts()
  }, [post.id])

  const fetchRelatedPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          caption,
          media_urls,
          media_type,
          likes_count,
          created_at,
          profiles:user_id(name, avatar_url),
          cities:city_id(name)
        `)
        .eq('is_active', true)
        .in('project_id', getPostProjectFilter())
        .eq('city_id', post.city_id)
        .neq('id', post.id)
        .order('created_at', { ascending: false })
        .limit(4)

      if (!error && data) {
        setRelatedPosts(data)
      }
    } catch (error) {
      console.error('Error fetching related posts:', error)
    }
  }

  const handleLike = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        // Redirect to login
        window.location.href = '/auth/login'
        return
      }

      if (isLiked) {
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id)
        setLikes(likes - 1)
      } else {
        await supabase
          .from('post_likes')
          .insert({ post_id: post.id, user_id: user.id })
        setLikes(likes + 1)
      }
      setIsLiked(!isLiked)
    } catch (error) {
      console.error('Error liking post:', error)
    }
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/post/${post.id}`
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.caption,
          url,
        })
        // Track share
        await supabase.from('post_shares').insert({
          post_id: post.id,
          platform: 'native',
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(url)
      alert('Link copied to clipboard!')
    }
  }

  return (
    <article className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <Link href="/" className="text-blue-600 text-sm font-medium">
            ← Back to Feed
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Post Header */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Author Info */}
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                {post.profiles?.avatar_url ? (
                  <Image
                    src={post.profiles.avatar_url}
                    alt={post.profiles.name}
                    width={48}
                    height={48}
                    className="object-cover"
                  />
                ) : (
                  <span className="text-lg font-bold text-blue-600">
                    {post.profiles?.name?.[0]?.toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/user/${post.user_id}`}
                    className="font-semibold text-gray-900 hover:text-blue-600"
                  >
                    {post.profiles?.name}
                  </Link>
                  {post.profiles?.has_blue_tick && (
                    <svg className="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                    </svg>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  {post.cities?.name && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {post.cities.name}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDistanceToNow(new Date(post.created_at), {
                      addSuffix: true,
                      locale: hi,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Title */}
          {post.title && (
            <div className="p-4 border-b">
              <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                {post.title}
              </h1>
            </div>
          )}

          {/* Media */}
          {post.media_urls && post.media_urls.length > 0 && (
            <div className="relative w-full">
              {post.media_type === 'video' ? (
                <video
                  src={post.media_urls[0]}
                  controls
                  className="w-full max-h-[600px] object-contain bg-black"
                  poster={post.media_urls[1] || undefined}
                />
              ) : (
                <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
                  <Image
                    src={post.media_urls[0]}
                    alt={post.title || 'Post image'}
                    fill
                    className="object-contain bg-gray-100"
                    priority
                    sizes="(max-width: 768px) 100vw, 800px"
                  />
                </div>
              )}
            </div>
          )}

          {/* Caption */}
          {post.caption && (
            <div className="p-4 border-b">
              <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                {post.caption}
              </p>
            </div>
          )}

          {/* Engagement Stats */}
          <div className="px-4 py-3 border-b flex items-center justify-between text-sm text-gray-500">
            <span>{likes} likes</span>
            <div className="flex items-center gap-4">
              <span>{post.comments_count || 0} comments</span>
              <span>{post.shares_count || 0} shares</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-4 py-3 flex items-center gap-4">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                isLiked
                  ? 'text-red-600 bg-red-50'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              Like
            </button>
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              Comment
            </button>
            <ShareButton
              postId={post.id}
              title={post.title || 'Check out this post'}
              description={post.caption}
              imageUrl={post.media_urls?.[0]}
              author={post.profiles?.name}
              showText={true}
              variant="plain"
              iconType="lucide"
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            />
          </div>

          {/* Comments Section */}
          {showComments && (
            <div className="border-t p-4">
              <h3 className="font-semibold mb-4">Comments</h3>
              {post.post_comments && post.post_comments.length > 0 ? (
                <div className="space-y-4">
                  {post.post_comments.map((comment: any) => (
                    <div key={comment.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        {comment.profiles?.avatar_url ? (
                          <Image
                            src={comment.profiles.avatar_url}
                            alt={comment.profiles.name}
                            width={32}
                            height={32}
                            className="rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-bold text-blue-600">
                            {comment.profiles?.name?.[0]?.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="bg-gray-100 rounded-lg px-3 py-2">
                          <p className="font-medium text-sm">{comment.profiles?.name}</p>
                          <p className="text-gray-800 text-sm">{comment.comment}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 ml-3">
                          {formatDistanceToNow(new Date(comment.created_at), {
                            addSuffix: true,
                            locale: hi,
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No comments yet</p>
              )}
            </div>
          )}
        </div>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">Related News from {post.cities?.name}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {relatedPosts.map((relatedPost) => (
                <Link
                  key={relatedPost.id}
                  href={`/post/${relatedPost.id}`}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden border"
                >
                  {relatedPost.media_urls?.[0] && (
                    <div className="relative w-full h-48">
                      <Image
                        src={relatedPost.media_urls[0]}
                        alt={relatedPost.title || 'News image'}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2">
                      {relatedPost.title || relatedPost.caption?.substring(0, 100)}
                    </h3>
                    {relatedPost.caption && !relatedPost.title && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {relatedPost.caption}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        {relatedPost.likes_count || 0}
                      </span>
                      <span>
                        {formatDistanceToNow(new Date(relatedPost.created_at), {
                          addSuffix: true,
                          locale: hi,
                        })}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  )
}
