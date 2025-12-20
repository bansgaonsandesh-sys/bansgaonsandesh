'use client'

import React from 'react'
import { Card, Button, Avatar, Typography, Carousel, Tag, Space } from 'antd'
import { GlobalOutlined, LinkOutlined, PhoneOutlined, WhatsAppOutlined } from '@ant-design/icons'
import { getProxiedImageUrl } from '../../lib/r2-storage'
import LinkifiedText from '../shared/LinkifiedText'

const { Text, Paragraph } = Typography

interface AdCardProps {
    ad: any
}

export default function AdCard({ ad }: AdCardProps) {
    if (!ad) return null

    const profile = ad.profiles

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden mb-4 relative">
            {/* Sponsored Label */}
            <div className="absolute top-2 right-2 z-10">
                <Tag color="#fff" className="text-xs text-gray-400 border-gray-200 m-0">Sponsored</Tag>
            </div>

            {/* Header */}
            <div className="p-4 flex items-center space-x-3">
                <Avatar src={getProxiedImageUrl(profile?.avatar_url)} size={40}>
                    {profile?.name?.[0]?.toUpperCase()}
                </Avatar>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-1">
                        <Text strong className="text-gray-900 truncate">
                            {profile?.name}
                        </Text>
                        {profile?.is_verified && (
                            <GlobalOutlined className="text-blue-500 text-xs" />
                        )}
                    </div>
                    <Text type="secondary" className="text-xs">
                        Suggested for you
                    </Text>
                </div>
            </div>

            {/* Content */}
            <div className="px-4 pb-2">
                <div className="text-gray-800 leading-relaxed mb-2">
                    <LinkifiedText text={ad.content} />
                </div>
            </div>

            {/* Media */}
            {ad.media_urls && ad.media_urls.length > 0 && (
                <div className="relative">
                    {ad.media_urls.length === 1 ? (
                        <div className="relative aspect-video bg-gray-100">
                            {ad.media_type === 'video' ? (
                                <video
                                    src={getProxiedImageUrl(ad.media_urls[0]) || undefined}
                                    controls
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <img
                                    src={getProxiedImageUrl(ad.media_urls[0]) || undefined}
                                    alt="Ad media"
                                    className="w-full h-full object-cover"
                                />
                            )}
                        </div>
                    ) : (
                        <Carousel arrows infinite={false} className="bg-gray-100">
                            {ad.media_urls.map((url: string, idx: number) => (
                                <div key={idx} className="relative aspect-video">
                                    {ad.media_type === 'video' ? (
                                        <video
                                            src={getProxiedImageUrl(url) || undefined}
                                            controls
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <img
                                            src={getProxiedImageUrl(url) || undefined}
                                            alt={`Ad media ${idx}`}
                                            className="w-full h-full object-cover"
                                        />
                                    )}
                                </div>
                            ))}
                        </Carousel>
                    )}
                </div>
            )}

            {/* Footer / Call to Actions */}
            <div className="p-4 bg-gray-50">
                <Space wrap className="w-full justify-between">
                    <div /> {/* Spacer */}
                    <div className="flex gap-2">
                        {ad.contact_whatsapp && (
                            <Button
                                href={`https://wa.me/${ad.contact_whatsapp}`}
                                target="_blank"
                                icon={<WhatsAppOutlined />}
                                className="bg-green-500 text-white border-green-500 hover:bg-green-600 hover:border-green-600"
                            >
                                WhatsApp
                            </Button>
                        )}
                        {ad.contact_mobile && (
                            <Button
                                href={`tel:${ad.contact_mobile}`}
                                icon={<PhoneOutlined />}
                            >
                                Call
                            </Button>
                        )}
                        {ad.target_link && (
                            <Button
                                type="primary"
                                href={ad.target_link}
                                target="_blank"
                                icon={<GlobalOutlined />} // Changed from LinkOutlined to Global to match website intent
                            >
                                Website
                            </Button>
                        )}
                    </div>
                </Space>
            </div>
        </div>
    )
}
