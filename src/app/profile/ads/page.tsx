'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Table, Tag, Button, Space, Typography, Empty, Spin, Statistic, Row, Col } from 'antd'
import {
    ArrowLeftOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    CalendarOutlined,
    PlusOutlined,
    EyeOutlined,
    PhoneOutlined,
    WhatsAppOutlined,
    GlobalOutlined
} from '@ant-design/icons'
import { motion } from 'framer-motion'
import { useApp } from '../../../lib/providers'
import { supabaseClient } from '../../../lib/supabase-client'
import { fetchUserAds } from '../../actions/adActions'
import { getProxiedImageUrl } from '../../../lib/r2-storage'

const { Title, Text, Paragraph } = Typography

interface UserAd {
    id: string
    content: string
    media_urls: string[]
    media_type: 'image' | 'video'
    status: 'pending' | 'active' | 'rejected' | 'expired'
    rejection_reason?: string | null
    daily_rate: number
    total_points: number
    start_date: string | null
    end_date: string | null
    created_at: string
    contact_mobile: string | null
    contact_whatsapp: string | null
    target_link: string | null
}

export default function MyAdsPage() {
    const { user, isLoading: userLoading } = useApp()
    const router = useRouter()
    const [ads, setAds] = useState<UserAd[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        console.log('🟣 [MyAds] Component mounted, user:', user?.id)
        if (!userLoading && !user) {
            console.log('🔴 [MyAds] No user, redirecting to login')
            router.push('/auth/login')
            return
        }

        if (user) {
            loadAds()
        }
    }, [user, userLoading])

    const loadAds = async () => {
        if (!user) return

        console.log('🟣 [MyAds] Loading ads for user:', user.id)
        setLoading(true)
        try {
            const { data: { session } } = await supabaseClient.auth.getSession()
            console.log('🟣 [MyAds] Session:', session ? 'Found' : 'Not found')

            if (!session) {
                console.log('🔴 [MyAds] No session, redirecting to login')
                router.push('/auth/login')
                return
            }

            console.log('🟣 [MyAds] Calling fetchUserAds...')
            const userAds = await fetchUserAds(session.access_token, user.id)
            console.log('🟣 [MyAds] Fetched ads:', userAds.length, userAds)
            setAds(userAds as UserAd[])
        } catch (error) {
            console.error('🔴 [MyAds] Error loading ads:', error)
        } finally {
            setLoading(false)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'gold'
            case 'active': return 'green'
            case 'rejected': return 'red'
            case 'expired': return 'default'
            default: return 'default'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending': return <ClockCircleOutlined />
            case 'active': return <CheckCircleOutlined />
            case 'rejected': return <CloseCircleOutlined />
            case 'expired': return <CalendarOutlined />
            default: return null
        }
    }

    const columns = [
        {
            title: 'Ad Content',
            key: 'content',
            render: (record: UserAd) => (
                <div className="flex gap-3">
                    {/* Media Preview */}
                    {record.media_urls.length > 0 && (
                        <div className="flex-shrink-0">
                            <div className="w-20 h-20 rounded-lg bg-gray-100 overflow-hidden border border-gray-200">
                                {record.media_type === 'image' ? (
                                    <img
                                        src={getProxiedImageUrl(record.media_urls[0]) || ''}
                                        className="w-full h-full object-cover"
                                        alt="ad"
                                    />
                                ) : (
                                    <video
                                        src={getProxiedImageUrl(record.media_urls[0]) || ''}
                                        className="w-full h-full object-cover"
                                    />
                                )}
                            </div>
                        </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <Paragraph
                            ellipsis={{ rows: 2, tooltip: record.content }}
                            className="mb-1 text-sm"
                        >
                            {record.content}
                        </Paragraph>

                        {/* Contact Info */}
                        <Space size="small" wrap>
                            {record.contact_mobile && (
                                <Tag icon={<PhoneOutlined />} color="blue" className="text-xs">
                                    {record.contact_mobile}
                                </Tag>
                            )}
                            {record.contact_whatsapp && (
                                <Tag icon={<WhatsAppOutlined />} color="green" className="text-xs">
                                    WhatsApp
                                </Tag>
                            )}
                            {record.target_link && (
                                <Tag icon={<GlobalOutlined />} color="purple" className="text-xs">
                                    Website
                                </Tag>
                            )}
                        </Space>
                    </div>
                </div>
            )
        },
        {
            title: 'Status',
            key: 'status',
            width: 150,
            render: (record: UserAd) => (
                <div>
                    <Tag color={getStatusColor(record.status)} icon={getStatusIcon(record.status)} className="mb-1">
                        {record.status.toUpperCase()}
                    </Tag>
                    {record.status === 'rejected' && record.rejection_reason && (
                        <div className="text-xs text-red-500 mt-1">
                            {record.rejection_reason}
                        </div>
                    )}
                </div>
            )
        },
        {
            title: 'Duration',
            key: 'duration',
            width: 120,
            render: (record: UserAd) => {
                // Calculate duration from dates
                if (record.start_date && record.end_date) {
                    const days = Math.ceil(
                        (new Date(record.end_date).getTime() - new Date(record.start_date).getTime())
                        / (1000 * 60 * 60 * 24)
                    )
                    return <Text className="text-sm">{days} day{days !== 1 ? 's' : ''}</Text>
                }
                return <Text className="text-sm text-gray-400">-</Text>
            }
        },
        {
            title: 'Timeline',
            key: 'dates',
            width: 180,
            render: (record: UserAd) => (
                <div className="text-xs space-y-1">
                    <div className="text-gray-500">
                        Created: {new Date(record.created_at).toLocaleDateString()}
                    </div>
                    {record.start_date && (
                        <div className="text-green-600">
                            Started: {new Date(record.start_date).toLocaleDateString()}
                        </div>
                    )}
                    {record.end_date && (
                        <div className="text-orange-600">
                            Ends: {new Date(record.end_date).toLocaleDateString()}
                        </div>
                    )}
                </div>
            )
        }
    ]

    const stats = {
        total: ads.length,
        pending: ads.filter(a => a.status === 'pending').length,
        active: ads.filter(a => a.status === 'active').length,
        rejected: ads.filter(a => a.status === 'rejected').length,
        expired: ads.filter(a => a.status === 'expired').length
    }

    if (userLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Spin size="large" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {/* Header */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <Button
                                icon={<ArrowLeftOutlined />}
                                onClick={() => router.push('/profile')}
                                size="large"
                                className="rounded-full"
                            >
                                Back
                            </Button>
                            <Button
                                type="primary"
                                size="large"
                                icon={<PlusOutlined />}
                                onClick={() => router.push('/ads/create')}
                                className="rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 border-0 shadow-lg hover:shadow-xl transition-shadow"
                            >
                                Create New Ad
                            </Button>
                        </div>
                        <Title level={2} className="mb-2">My Ad Campaigns</Title>
                        <Text type="secondary" className="text-base">
                            Track and manage all your advertising campaigns
                        </Text>
                    </div>

                    {/* Stats Cards */}
                    <Row gutter={[16, 16]} className="mb-6">
                        <Col xs={12} sm={12} md={8} lg={4}>
                            <Card className="text-center rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                <Statistic
                                    title="Total Ads"
                                    value={stats.total}
                                    valueStyle={{ color: '#1890ff', fontSize: '28px', fontWeight: 'bold' }}
                                />
                            </Card>
                        </Col>
                        <Col xs={12} sm={12} md={8} lg={5}>
                            <Card className="text-center rounded-xl shadow-sm hover:shadow-md transition-shadow bg-orange-50 border-orange-200">
                                <Statistic
                                    title="Pending Review"
                                    value={stats.pending}
                                    prefix={<ClockCircleOutlined />}
                                    valueStyle={{ color: '#faad14', fontSize: '28px', fontWeight: 'bold' }}
                                />
                            </Card>
                        </Col>
                        <Col xs={12} sm={12} md={8} lg={5}>
                            <Card className="text-center rounded-xl shadow-sm hover:shadow-md transition-shadow bg-green-50 border-green-200">
                                <Statistic
                                    title="Active"
                                    value={stats.active}
                                    prefix={<CheckCircleOutlined />}
                                    valueStyle={{ color: '#52c41a', fontSize: '28px', fontWeight: 'bold' }}
                                />
                            </Card>
                        </Col>
                        <Col xs={12} sm={12} md={8} lg={5}>
                            <Card className="text-center rounded-xl shadow-sm hover:shadow-md transition-shadow bg-red-50 border-red-200">
                                <Statistic
                                    title="Rejected"
                                    value={stats.rejected}
                                    prefix={<CloseCircleOutlined />}
                                    valueStyle={{ color: '#ff4d4f', fontSize: '28px', fontWeight: 'bold' }}
                                />
                            </Card>
                        </Col>
                        <Col xs={12} sm={12} md={8} lg={5}>
                            <Card className="text-center rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                <Statistic
                                    title="Expired"
                                    value={stats.expired}
                                    prefix={<CalendarOutlined />}
                                    valueStyle={{ fontSize: '28px', fontWeight: 'bold' }}
                                />
                            </Card>
                        </Col>
                    </Row>

                    {/* Ads Table */}
                    <Card className="rounded-2xl shadow-lg">
                        {ads.length === 0 ? (
                            <Empty
                                description={
                                    <div className="py-8">
                                        <Title level={4} className="text-gray-400">No ads yet</Title>
                                        <Paragraph type="secondary" className="mb-4">
                                            Start promoting your content by creating your first ad campaign
                                        </Paragraph>
                                        <Button
                                            type="primary"
                                            size="large"
                                            icon={<PlusOutlined />}
                                            onClick={() => router.push('/ads/create')}
                                            className="rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 border-0"
                                        >
                                            Create Your First Ad
                                        </Button>
                                    </div>
                                }
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                            />
                        ) : (
                            <Table
                                dataSource={ads}
                                columns={columns}
                                rowKey="id"
                                pagination={{
                                    pageSize: 10,
                                    showSizeChanger: true,
                                    showTotal: (total) => `Total ${total} ads`,
                                    className: 'px-4'
                                }}
                                className="ads-table"
                            />
                        )}
                    </Card>
                </motion.div>
            </div>
        </div>
    )
}
