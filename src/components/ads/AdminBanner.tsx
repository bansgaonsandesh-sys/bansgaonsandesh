'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, Button, Space, Typography } from 'antd'
import { PhoneOutlined, WhatsAppOutlined, GlobalOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons'
import { motion, AnimatePresence } from 'framer-motion'

const { Title, Paragraph } = Typography

interface Ad {
    id: string
    title: string
    description: string | null
    image_url: string
    redirect_url: string | null
    contact_phone: string | null
    contact_whatsapp: string | null
    contact_website: string | null
}

interface AdminBannerProps {
    ads: Ad[]
    onImpression?: (adId: string) => void
    onClick?: (adId: string) => void
    autoSlideInterval?: number // in milliseconds, default 5000
}

export default function AdminBanner({ ads, onImpression, onClick, autoSlideInterval = 5000 }: AdminBannerProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isVisible, setIsVisible] = useState(false)
    const [impressionTracked, setImpressionTracked] = useState<Set<string>>(new Set())
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    console.log('📢 [AdminBanner] Rendering with ads:', ads.length, ads)

    const currentAd = ads[currentIndex]

    // Auto-slide functionality
    useEffect(() => {
        if (ads.length <= 1) return

        timerRef.current = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % ads.length)
        }, autoSlideInterval)

        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [ads.length, autoSlideInterval])

    // Intersection observer for impression tracking
    React.useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true)
                }
            },
            { threshold: 0.5 }
        )

        const element = document.getElementById('banner-carousel')
        if (element) observer.observe(element)

        return () => observer.disconnect()
    }, [])

    // Track impression when ad is visible
    useEffect(() => {
        if (isVisible && currentAd && !impressionTracked.has(currentAd.id)) {
            onImpression?.(currentAd.id)
            setImpressionTracked(prev => new Set(prev).add(currentAd.id))
        }
    }, [isVisible, currentAd, impressionTracked, onImpression])

    const handlePrevious = () => {
        setCurrentIndex((prev) => (prev - 1 + ads.length) % ads.length)
        // Reset timer
        if (timerRef.current) clearInterval(timerRef.current)
        timerRef.current = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % ads.length)
        }, autoSlideInterval)
    }

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % ads.length)
        // Reset timer
        if (timerRef.current) clearInterval(timerRef.current)
        timerRef.current = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % ads.length)
        }, autoSlideInterval)
    }

    const handleDotClick = (index: number) => {
        setCurrentIndex(index)
        // Reset timer
        if (timerRef.current) clearInterval(timerRef.current)
        timerRef.current = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % ads.length)
        }, autoSlideInterval)
    }

    const handleActionClick = (type: 'phone' | 'whatsapp' | 'website' | 'redirect') => {
        if (!currentAd) return
        onClick?.(currentAd.id)

        if (type === 'phone' && currentAd.contact_phone) {
            window.location.href = `tel:${currentAd.contact_phone}`
        } else if (type === 'whatsapp' && currentAd.contact_whatsapp) {
            window.open(`https://wa.me/${currentAd.contact_whatsapp.replace(/[^0-9]/g, '')}`, '_blank')
        } else if (type === 'website' && currentAd.contact_website) {
            window.open(currentAd.contact_website, '_blank')
        } else if (type === 'redirect' && currentAd.redirect_url) {
            window.open(currentAd.redirect_url, '_blank')
        }
    }

    if (!currentAd) {
        console.warn('⚠️ [AdminBanner] No current ad to display')
        return null
    }

    return (
        <div
            id="banner-carousel"
            className="mb-4"
        >
            <Card className="overflow-hidden border-2 border-blue-100 relative">
                <div className="flex items-center justify-between mb-2">
                    <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">Sponsored</span>
                    {ads.length > 1 && (
                        <span className="text-xs text-gray-500">{currentIndex + 1} / {ads.length}</span>
                    )}
                </div>

                <div className="relative">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentAd.id}
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="relative mb-3">
                                <img
                                    src={currentAd.image_url}
                                    alt={currentAd.title}
                                    className="w-full h-auto max-h-64 object-cover rounded-lg"
                                />
                            </div>

                            <Title level={4} className="mb-2">{currentAd.title}</Title>

                            {currentAd.description && (
                                <Paragraph className="mb-3 text-gray-600">{currentAd.description}</Paragraph>
                            )}

                            <Space wrap className="w-full">
                                {currentAd.contact_phone && (
                                    <Button
                                        type="primary"
                                        icon={<PhoneOutlined />}
                                        onClick={() => handleActionClick('phone')}
                                    >
                                        Call
                                    </Button>
                                )}
                                {currentAd.contact_whatsapp && (
                                    <Button
                                        type="primary"
                                        icon={<WhatsAppOutlined />}
                                        onClick={() => handleActionClick('whatsapp')}
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        WhatsApp
                                    </Button>
                                )}
                                {currentAd.contact_website && (
                                    <Button
                                        icon={<GlobalOutlined />}
                                        onClick={() => handleActionClick('website')}
                                    >
                                        Visit Website
                                    </Button>
                                )}
                                {currentAd.redirect_url && !currentAd.contact_website && (
                                    <Button
                                        type="default"
                                        onClick={() => handleActionClick('redirect')}
                                    >
                                        Learn More
                                    </Button>
                                )}
                            </Space>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </Card>
        </div>
    )
}
