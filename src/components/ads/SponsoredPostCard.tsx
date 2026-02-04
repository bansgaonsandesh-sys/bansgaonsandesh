'use client'

import React from 'react'
import { Card, Avatar, Button, Space, Typography, Tag } from 'antd'
import { PhoneOutlined, WhatsAppOutlined, GlobalOutlined } from '@ant-design/icons'

const { Text, Paragraph } = Typography

interface SponsoredPostCardProps {
    ad: {
        id: string
        content: string
        media_urls: string[]
        media_type: 'image' | 'video'
        target_link: string | null
        contact_mobile: string | null
        contact_whatsapp: string | null
        profiles?: {
            name?: string
            avatar_url?: string | null
        }
    }
    onImpression?: (adId: string) => void
    onClick?: (adId: string) => void
}

export default function SponsoredPostCard({ ad, onImpression, onClick }: SponsoredPostCardProps) {
    const [isVisible, setIsVisible] = React.useState(false)

    React.useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !isVisible) {
                    setIsVisible(true)
                    onImpression?.(ad.id)
                }
            },
            { threshold: 0.5 }
        )

        const element = document.getElementById(`ad-${ad.id}`)
        if (element) observer.observe(element)

        return () => observer.disconnect()
    }, [ad.id, isVisible, onImpression])

    const handleContactClick = (type: string) => {
        onClick?.(ad.id)
        if (type === 'phone' && ad.contact_mobile) {
            window.location.href = `tel:${ad.contact_mobile}`
        } else if (type === 'whatsapp' && ad.contact_whatsapp) {
            window.open(`https://wa.me/${ad.contact_whatsapp.replace(/[^0-9]/g, '')}`, '_blank')
        } else if (type === 'link' && ad.target_link) {
            window.open(ad.target_link, '_blank')
        }
    }

    return (
        <div id={`ad-${ad.id}`}>
            <Card className="mb-4 border-2 border-yellow-100 bg-gradient-to-br from-yellow-50 to-orange-50">
                {/* Sponsored Badge */}
                <div className="flex items-center justify-between mb-3">
                    <Space>
                        <Avatar src={ad.profiles?.avatar_url} size={40}>
                            {ad.profiles?.name?.[0] || 'A'}
                        </Avatar>
                        <div>
                            <Text strong className="block">{ad.profiles?.name || 'Advertiser'}</Text>
                            <Tag color="gold" className="text-xs">Sponsored</Tag>
                        </div>
                    </Space>
                </div>

                {/* Ad Content */}
                <Paragraph className="mb-3">{ad.content}</Paragraph>

                {/* Media */}
                {ad.media_urls.length > 0 && (
                    <div className="mb-3 grid gap-2" style={{ gridTemplateColumns: ad.media_urls.length === 1 ? '1fr' : 'repeat(2, 1fr)' }}>
                        {ad.media_urls.map((url, index) => (
                            <div key={index} className="rounded-lg overflow-hidden">
                                {ad.media_type === 'image' ? (
                                    <img src={url} alt="ad media" className="w-full h-auto" />
                                ) : (
                                    <video src={url} controls className="w-full h-auto" />
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Contact Buttons */}
                <Space wrap className="w-full">
                    {ad.contact_mobile && (
                        <Button
                            type="primary"
                            icon={<PhoneOutlined />}
                            onClick={() => handleContactClick('phone')}
                            className="bg-blue-600"
                        >
                            Call Now
                        </Button>
                    )}
                    {ad.contact_whatsapp && (
                        <Button
                            type="primary"
                            icon={<WhatsAppOutlined />}
                            onClick={() => handleContactClick('whatsapp')}
                            className="bg-green-600"
                        >
                            WhatsApp
                        </Button>
                    )}
                    {ad.target_link && (
                        <Button
                            icon={<GlobalOutlined />}
                            onClick={() => handleContactClick('link')}
                        >
                            Learn More
                        </Button>
                    )}
                </Space>
            </Card>
        </div>
    )
}
