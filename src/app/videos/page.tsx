'use client'

import React, { useState, useEffect } from 'react'
import { Card, Spin, Empty, Typography, Input, Row, Col, message } from 'antd'
import { PlayCircleOutlined, YoutubeOutlined, EyeOutlined, CalendarOutlined, SearchOutlined } from '@ant-design/icons'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { fetchYouTubeVideos } from '../actions/youtubeActions'

const { Title, Text, Paragraph } = Typography

interface Video {
  id: string
  title: string
  description: string
  thumbnail: string
  publishedAt: string
  url: string
  channelTitle: string
}

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const channelHandle = '@thebansgaonsandesh'
  const channelUrl = `https://www.youtube.com/${channelHandle}`

  useEffect(() => {
    loadVideos()
  }, [])

  const loadVideos = async () => {
    try {
      setLoading(true)
      const fetchedVideos = await fetchYouTubeVideos()
      setVideos(fetchedVideos)
    } catch (error) {
      console.error('Error loading videos:', error)
      message.error('Failed to load videos. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  const handleVideoClick = (videoUrl: string) => {
    window.open(videoUrl, '_blank', 'noopener,noreferrer')
  }

  const filteredVideos = videos.filter(video =>
    video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    video.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <Title level={2} className="mb-2 flex items-center gap-3">
                <YoutubeOutlined className="text-red-600" />
                Our Videos
              </Title>
              <Text className="text-gray-600">
                Watch latest news and updates from Bansgaon Sandesh
              </Text>
            </div>
            <motion.a
              href={channelUrl}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full shadow-lg transition-all"
            >
              <YoutubeOutlined className="text-xl" />
              <span className="font-semibold">Subscribe</span>
            </motion.a>
          </div>

          {/* Search Bar */}
          <Input
            size="large"
            placeholder="Search videos..."
            prefix={<SearchOutlined className="text-gray-400" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md rounded-full"
          />
        </motion.div>

        {/* Videos Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Spin size="large" />
          </div>
        ) : filteredVideos.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div className="text-center">
                <Paragraph className="text-gray-600 mb-4">
                  {searchQuery ? 'No videos found matching your search' : 'No videos available yet'}
                </Paragraph>
                <motion.a
                  href={channelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.05 }}
                  className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 font-medium"
                >
                  <YoutubeOutlined />
                  Visit our YouTube channel
                </motion.a>
              </div>
            }
          />
        ) : (
          <Row gutter={[24, 24]}>
            {filteredVideos.map((video, index) => (
              <Col xs={24} sm={12} lg={8} xl={6} key={video.id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card
                    hoverable
                    className="overflow-hidden rounded-xl shadow-lg border-0 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
                    cover={
                      <div className="relative group cursor-pointer" onClick={() => handleVideoClick(video.url)}>
                        <div className="relative w-full pt-[56.25%] bg-gray-200">
                          <Image
                            src={video.thumbnail}
                            alt={video.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                          <PlayCircleOutlined className="text-6xl text-white opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-75 group-hover:scale-100" />
                        </div>
                      </div>
                    }
                    onClick={() => handleVideoClick(video.url)}
                  >
                    <div className="p-2">
                      <Title level={5} className="mb-2 line-clamp-2" ellipsis={{ rows: 2 }}>
                        {video.title}
                      </Title>
                      <Paragraph className="text-gray-600 text-sm mb-3 line-clamp-2" ellipsis={{ rows: 2 }}>
                        {video.description}
                      </Paragraph>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <CalendarOutlined />
                          <span>{formatDistanceToNow(new Date(video.publishedAt), { addSuffix: true })}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </Col>
            ))}
          </Row>
        )}

        {/* Channel Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12"
        >
          <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
            <div className="text-center">
              <YoutubeOutlined className="text-6xl text-red-600 mb-4" />
              <Title level={3} className="mb-2">
                Join Our YouTube Community
              </Title>
              <Paragraph className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Subscribe to our YouTube channel for the latest news, updates, and stories from Bansgaon.
                Get notified whenever we upload new content!
              </Paragraph>
              <motion.a
                href={channelUrl}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-3 bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-full shadow-lg text-lg font-semibold transition-all"
              >
                <YoutubeOutlined className="text-2xl" />
                <span>Subscribe Now</span>
              </motion.a>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
