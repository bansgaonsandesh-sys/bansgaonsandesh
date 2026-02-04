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
        if (ads.length === 0) return

        const fiveMinutes = 5 * 60 * 1000 // 5 minutes in milliseconds
        let initialTimer: NodeJS.Timeout
        let recurringTimer: NodeJS.Timeout

        const showRandomPopup = () => {
            // Select a random ad
            const randomIndex = Math.floor(Math.random() * ads.length)
            const randomAd = ads[randomIndex]
            setSelectedAd(randomAd)
            
            setVisible(true)
            setHasTrackedImpression(false) // Reset for new ad
            sessionStorage.setItem('popup_last_shown', Date.now().toString())
        }

        // Check if this is first visit (no last shown time)
        const lastShownTime = sessionStorage.getItem('popup_last_shown')
        
        if (!lastShownTime) {
            // First visit - show popup after 5 seconds
            initialTimer = setTimeout(() => {
                showRandomPopup()
                // Then continue showing every 5 minutes
                recurringTimer = setInterval(showRandomPopup, fiveMinutes)
            }, 5000)
        } else {
            // Not first visit - check time since last shown
            const now = Date.now()
            const timeSinceLastShown = now - parseInt(lastShownTime)
            
            if (timeSinceLastShown < fiveMinutes) {
                const remainingTime = fiveMinutes - timeSinceLastShown
                const remainingMinutes = Math.ceil(remainingTime / 1000 / 60)
                
                // Show next popup after remaining time
                initialTimer = setTimeout(() => {
                    showRandomPopup()
                    // Then continue showing every 5 minutes
                    recurringTimer = setInterval(showRandomPopup, fiveMinutes)
                }, remainingTime)
            } else {
                // More than 5 minutes passed, show after 5 seconds
                initialTimer = setTimeout(() => {
                    showRandomPopup()
                    // Then continue showing every 5 minutes
                    recurringTimer = setInterval(showRandomPopup, fiveMinutes)
                }, 5000)
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
            closeIcon={<CloseOutlined />}
            width={600}
            centered
            className="popup-ad-modal"
            maskClosable={true}
            keyboard={true}
            destroyOnClose={true}
            getContainer={false}
            style={{ position: 'fixed', zIndex: 1000 }}
        >
            <div>
                <div className="text-center">
                    <img
                        src={selectedAd.image_url}
                        alt={selectedAd.title}
                        className="w-full h-auto max-h-96 object-cover rounded-lg mb-4"
                    />

                    <h2 className="text-2xl font-bold mb-3">{selectedAd.title}</h2>

                    {selectedAd.description && (
                        <p className="text-gray-600 mb-6">{selectedAd.description}</p>
                    )}

                    <div className="flex flex-wrap gap-3 justify-center mb-4">
                        {selectedAd.contact_phone && (
                            <Button
                                type="primary"
                                size="large"
                                icon={<PhoneOutlined />}
                                onClick={() => handleActionClick('phone')}
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
                                className="bg-green-600 hover:bg-green-700"
                            >
                                WhatsApp
                            </Button>
                        )}
                        {selectedAd.contact_website && (
                            <Button
                                size="large"
                                icon={<GlobalOutlined />}
                                onClick={() => handleActionClick('website')}
                            >
                                Visit Website
                            </Button>
                        )}
                        {selectedAd.redirect_url && !selectedAd.contact_website && (
                            <Button
                                type="default"
                                size="large"
                                onClick={() => handleActionClick('redirect')}
                            >
                                Learn More
                            </Button>
                        )}
                    </div>

                    {/* Bottom Close Button for Mobile */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <Button
                            type="default"
                            size="large"
                            icon={<CloseOutlined />}
                            onClick={handleClose}
                            className="w-full md:w-auto"
                        >
                            Close
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    )
}
