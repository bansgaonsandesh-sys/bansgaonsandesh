'use client'

import React from 'react'
import { Card, Button, Space, Typography } from 'antd'
import { PhoneOutlined, WhatsAppOutlined, GlobalOutlined } from '@ant-design/icons'
import { motion } from 'framer-motion'

const { Title, Paragraph } = Typography

interface AdminBannerProps {
    ad: {
        id: string
        title: string
        description: string | null
        image_url: string
        redirect_url: string | null
        contact_phone: string | null
        contact_whatsapp: string | null
        contact_website: string | null
    }
    onImpression?: (adId: string) => void
    onClick?: (adId: string) => void
}

export default function AdminBanner({ ad, onImpression, onClick }: AdminBannerProps) {
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

        const element = document.getElementById(`banner-${ad.id}`)
        if (element) observer.observe(element)

        return () => observer.disconnect()
    }, [ad.id, isVisible, onImpression])

    const handleActionClick = (type: 'phone' | 'whatsapp' | 'website' | 'redirect') => {
        onClick?.(ad.id)

        if (type === 'phone' && ad.contact_phone) {
            window.location.href = `tel:${ad.contact_phone}`
        } else if (type === 'whatsapp' && ad.contact_whatsapp) {
            window.open(`https://wa.me/${ad.contact_whatsapp.replace(/[^0-9]/g, '')}`, '_blank')
        } else if (type === 'website' && ad.contact_website) {
            window.open(ad.contact_website, '_blank')
        } else if (type === 'redirect' && ad.redirect_url) {
            window.open(ad.redirect_url, '_blank')
        }
    }

    return (
        <motion.div
            id={`banner-${ad.id}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="mb-4"
        >
            <Card className="overflow-hidden border-2 border-blue-100">
                <div className="flex items-center justify-between mb-2">
                    <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">Sponsored</span>
                </div>

                <div className="relative mb-3">
                    <img
                        src={ad.image_url}
                        alt={ad.title}
                        className="w-full h-auto max-h-64 object-cover rounded-lg"
                    />
                </div>

                <Title level={4} className="mb-2">{ad.title}</Title>

                {ad.description && (
                    <Paragraph className="mb-3 text-gray-600">{ad.description}</Paragraph>
                )}

                <Space wrap className="w-full">
                    {ad.contact_phone && (
                        <Button
                            type="primary"
                            icon={<PhoneOutlined />}
                            onClick={() => handleActionClick('phone')}
                        >
                            Call
                        </Button>
                    )}
                    {ad.contact_whatsapp && (
                        <Button
                            type="primary"
                            icon={<WhatsAppOutlined />}
                            onClick={() => handleActionClick('whatsapp')}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            WhatsApp
                        </Button>
                    )}
                    {ad.contact_website && (
                        <Button
                            icon={<GlobalOutlined />}
                            onClick={() => handleActionClick('website')}
                        >
                            Visit Website
                        </Button>
                    )}
                    {ad.redirect_url && !ad.contact_website && (
                        <Button
                            type="default"
                            onClick={() => handleActionClick('redirect')}
                        >
                            Learn More
                        </Button>
                    )}
                </Space>
            </Card>
        </motion.div>
    )
}
