'use client'

import React, { useEffect, useState } from 'react'
import { Modal, Button } from 'antd'
import { PhoneOutlined, WhatsAppOutlined, GlobalOutlined, CloseOutlined } from '@ant-design/icons'
import { motion } from 'framer-motion'

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

        // Check if popup was already shown in this session
        const popupShown = sessionStorage.getItem('popup_shown')
        if (popupShown) {
            console.log('⚠️ [POPUP] Already shown in this session')
            return
        }

        // Select a random ad
        const randomIndex = Math.floor(Math.random() * ads.length)
        const randomAd = ads[randomIndex]
        setSelectedAd(randomAd)

        console.log('🎯 [POPUP] Selected random ad:', randomAd.title)

        // Show popup after 5 seconds
        const timer = setTimeout(() => {
            console.log('✅ [POPUP] Showing popup')
            setVisible(true)
            sessionStorage.setItem('popup_shown', 'true')
        }, 5000)

        return () => clearTimeout(timer)
    }, [ads])

    useEffect(() => {
        if (visible && !hasTrackedImpression && selectedAd) {
            console.log('📊 [POPUP] Tracking impression for:', selectedAd.id)
            onImpression?.(selectedAd.id)
            setHasTrackedImpression(true)
        }
    }, [visible, hasTrackedImpression, selectedAd, onImpression])

    const handleClose = () => {
        console.log('❌ [POPUP] Closing popup')
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
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
            >
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

                    <div className="flex flex-wrap gap-3 justify-center">
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
                </div>
            </motion.div>
        </Modal>
    )
}
