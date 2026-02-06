'use client'

import React, { useEffect, useState } from 'react'
import { Modal, Button } from 'antd'
import { PhoneOutlined, WhatsAppOutlined, GlobalOutlined, CloseOutlined } from '@ant-design/icons'

interface AdminPopupProps {
    ads: Array<{
        id: string
        title: string
        description: string | null
        image_url: string
        redirect_url: string | null
        contact_phone: string | null
        contact_whatsapp: string | null
        contact_website: string | null
    }>
    onImpression?: (adId: string) => void
    onClick?: (adId: string) => void
}

export default function AdminPopup({ ads, onImpression, onClick }: AdminPopupProps) {
    const [visible, setVisible] = useState(false)
    const [selectedAd, setSelectedAd] = useState<typeof ads[0] | null>(null)
    const [hasTrackedImpression, setHasTrackedImpression] = useState(false)

    useEffect(() => {
        if (ads.length === 0) {
            console.log('[AdminPopup] No ads provided')
            return
        }

        console.log('[AdminPopup] Ads available:', ads.length)

        const fiveMinutes = 5 * 60 * 1000 // 5 minutes in milliseconds
        let initialTimer: NodeJS.Timeout
        let recurringTimer: NodeJS.Timeout

        const showRandomPopup = () => {
            // Select a random ad
            const randomIndex = Math.floor(Math.random() * ads.length)
            const randomAd = ads[randomIndex]
            console.log('[AdminPopup] Showing popup:', randomAd.title)
            setSelectedAd(randomAd)
            
            setVisible(true)
            setHasTrackedImpression(false) // Reset for new ad
            sessionStorage.setItem('popup_last_shown', Date.now().toString())
        }

        // Check if this is first visit (no last shown time)
        const lastShownTime = sessionStorage.getItem('popup_last_shown')
        console.log('[AdminPopup] Last shown time:', lastShownTime)
        
        if (!lastShownTime) {
            // First visit - show popup after 1 second
            console.log('[AdminPopup] First visit - showing in 1 second')
            initialTimer = setTimeout(() => {
                showRandomPopup()
                // Then continue showing every 5 minutes
                recurringTimer = setInterval(showRandomPopup, fiveMinutes)
            }, 1000)
        } else {
            // Not first visit - check time since last shown
            const now = Date.now()
            const timeSinceLastShown = now - parseInt(lastShownTime)
            
            if (timeSinceLastShown < fiveMinutes) {
                const remainingTime = fiveMinutes - timeSinceLastShown
                const remainingMinutes = Math.ceil(remainingTime / 1000 / 60)
                console.log('[AdminPopup] Waiting', remainingMinutes, 'more minutes')
                // Show next popup after remaining time
                initialTimer = setTimeout(() => {
                    showRandomPopup()
                    // Then continue showing every 5 minutes
                    recurringTimer = setInterval(showRandomPopup, fiveMinutes)
                }, remainingTime)
            } else {
                // More than 5 minutes passed, show after 1 second
                console.log('[AdminPopup] 5 min passed - showing in 1 second')
                initialTimer = setTimeout(() => {
                    showRandomPopup()
                    // Then continue showing every 5 minutes
                    recurringTimer = setInterval(showRandomPopup, fiveMinutes)
                }, 1000)
            }
        }

        return () => {
            clearTimeout(initialTimer)
            clearInterval(recurringTimer)
        }
    }, [ads])

    useEffect(() => {
        if (visible && !hasTrackedImpression && selectedAd) {
            onImpression?.(selectedAd.id)
            setHasTrackedImpression(true)
        }
    }, [visible, hasTrackedImpression, selectedAd, onImpression])

    const handleClose = () => {
        setVisible(false)
    }

    const handleActionClick = (type: 'phone' | 'whatsapp' | 'website' | 'redirect') => {
        if (!selectedAd) return

        onClick?.(selectedAd.id)

        if (type === 'phone' && selectedAd.contact_phone) {
            window.location.href = `tel:${selectedAd.contact_phone}`
        } else if (type === 'whatsapp' && selectedAd.contact_whatsapp) {
            window.open(`https://wa.me/${selectedAd.contact_whatsapp.replace(/[^0-9]/g, '')}`, '_blank')
        } else if (type === 'website' && selectedAd.contact_website) {
            window.open(selectedAd.contact_website, '_blank')
        } else if (type === 'redirect' && selectedAd.redirect_url) {
            window.open(selectedAd.redirect_url, '_blank')
        }

        handleClose()
    }

    if (!selectedAd || !visible) return null

    return (
        <Modal
            open={true}
            onCancel={handleClose}
            footer={null}
            closeIcon={null}
            centered
            className="popup-ad-modal !p-0"
            maskClosable={true}
            keyboard={true}
            destroyOnClose={true}
            styles={{
                content: {
                    padding: 0,
                    borderRadius: 12,
                    overflow: 'hidden',
                    width: 'calc(100vw - 32px)',
                    maxWidth: 400,
                },
                mask: {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                },
                header: {
                    display: 'none',
                },
            }}
            closable={false}
        >
            <div className="relative">
                {/* Close button overlay */}
                <button
                    onClick={handleClose}
                    className="absolute top-2 right-2 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-white"
                >
                    <CloseOutlined />
                </button>

                {/* Image - responsive */}
                <img
                    src={selectedAd.image_url}
                    alt={selectedAd.title}
                    className="w-full h-auto max-h-[40vh] object-contain"
                />

                {/* Content */}
                <div className="p-4">
                    <h2 className="text-lg font-bold text-gray-900 mb-2 text-center">
                        {selectedAd.title}
                    </h2>

                    {selectedAd.description && (
                        <p className="text-gray-600 text-sm mb-4 text-center">
                            {selectedAd.description}
                        </p>
                    )}

                    {/* Action Buttons - Stack vertically on mobile */}
                    <div className="flex flex-col gap-2">
                        {selectedAd.contact_phone && (
                            <Button
                                type="primary"
                                size="large"
                                icon={<PhoneOutlined />}
                                onClick={() => handleActionClick('phone')}
                                block
                            >
                                Call Now
                            </Button>
                        )}
                        {selectedAd.contact_whatsapp && (
                            <Button
                                type="primary"
                                size="large"
                                icon={<WhatsAppOutlined />}
                                onClick={() => handleActionClick('whatsapp')}
                                className="!bg-green-600 hover:!bg-green-700"
                                block
                            >
                                WhatsApp
                            </Button>
                        )}
                        {selectedAd.contact_website && (
                            <Button
                                size="large"
                                icon={<GlobalOutlined />}
                                onClick={() => handleActionClick('website')}
                                block
                            >
                                Visit Website
                            </Button>
                        )}
                        {selectedAd.redirect_url && !selectedAd.contact_website && (
                            <Button
                                type="default"
                                size="large"
                                onClick={() => handleActionClick('redirect')}
                                block
                            >
                                Learn More
                            </Button>
                        )}

                        {/* Close Button */}
                        <Button
                            type="default"
                            size="large"
                            icon={<CloseOutlined />}
                            onClick={handleClose}
                            block
                            className="mt-2"
                        >
                            Close
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    )
}
