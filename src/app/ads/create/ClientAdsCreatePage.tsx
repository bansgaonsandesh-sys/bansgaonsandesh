'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Typography, Form, Input, InputNumber, Button, Upload, Alert, App } from 'antd'
import { UploadOutlined, RocketOutlined, DollarOutlined, InfoCircleOutlined, PhoneOutlined, WhatsAppOutlined, GlobalOutlined } from '@ant-design/icons'
import { useApp } from '../../../lib/providers'
import { uploadToR2, generateFileKey } from '../../../lib/r2-storage'
import { createAd } from '../../actions/adActions'
import { formatNumber } from '../../../lib/utils'
import { supabaseClient } from '../../../lib/supabase-client'

const { Title, Text, Paragraph } = Typography

const AD_DAILY_RATE = 2000

export default function ClientAdsCreatePage() {
    const { user, isLoading } = useApp()
    const router = useRouter()
    const { message, modal } = App.useApp()
    const [form] = Form.useForm()
    const [fileList, setFileList] = useState<any[]>([])
    const [submitting, setSubmitting] = useState(false)
    const [duration, setDuration] = useState<number>(1)

    const totalCost = duration * AD_DAILY_RATE

    const handleUploadChange = ({ fileList: newFileList }: any) => {
        setFileList(newFileList)
    }

    const handleSubmit = async (values: any) => {
        if (!user) return

        if (fileList.length === 0) {
            message.error('Please upload at least one image or video')
            return
        }

        if (user.points_balance < totalCost) {
            modal.error({
                title: 'Insufficient Points',
                content: (
                    <div>
                        <p>You need {formatNumber(totalCost)} points but only have {formatNumber(user.points_balance)}.</p>
                        <p>Please purchase more points in your wallet.</p>
                    </div>
                ),
                okText: 'Go to Wallet',
                onOk: () => router.push('/wallet')
            })
            return
        }

        setSubmitting(true)
        try {
            // 1. Upload Media
            const uploadedUrls: string[] = []
            let mediaType: 'image' | 'video' = 'image'

            for (const file of fileList) {
                const originFile = file.originFileObj
                if (originFile) {
                    const key = generateFileKey(originFile.name, 'ads')
                    const result = await uploadToR2(originFile, key, originFile.type)
                    if (result.success && result.url) {
                        uploadedUrls.push(result.url)
                        if (originFile.type.startsWith('video/')) {
                            mediaType = 'video'
                        }
                    }
                }
            }

            if (uploadedUrls.length === 0) {
                throw new Error('Media upload failed')
            }


            // 2. Create Ad
            console.log('🟢 [Client] Getting session...')
            const { data: { session } } = await supabaseClient.auth.getSession()
            console.log('🟢 [Client] Session:', session ? 'Found' : 'Not found')
            console.log('🟢 [Client] Access token present:', !!session?.access_token)

            if (!session) {
                console.error('🔴 [Client] No session found')
                message.error('Session expired. Please login again.')
                router.push('/auth/login')
                return
            }

            console.log('🟢 [Client] Calling createAd server action...')
            console.log('🟢 [Client] Parameters:', {
                userId: user.id,
                contentLength: values.content?.length,
                mediaCount: uploadedUrls.length,
                mediaType,
                duration: values.duration,
                hasTargetLink: !!values.targetLink,
                hasMobile: !!values.contactMobile,
                hasWhatsapp: !!values.contactWhatsapp
            })

            const result = await createAd(
                session.access_token,
                user.id,
                values.content,
                uploadedUrls,
                mediaType,
                values.targetLink || null,
                values.duration,
                values.contactMobile || null,
                values.contactWhatsapp || null
            )

            console.log('🟢 [Client] createAd result:', result)

            if (result.success) {
                console.log('✅ [Client] Ad created successfully!')
                message.success('Ad campaign submitted for approval! 📝')
                modal.success({
                    title: 'Campaign Submitted',
                    content: 'Your ad has been submitted and is pending admin approval. It will go live once verified.',
                    onOk: () => router.push('/')
                })
            } else {
                console.error('🔴 [Client] Ad creation failed:', result.error)
                message.error(result.error)
            }
        } catch (error) {
            console.error('🔴 [Client] Exception in ad creation:', error)
            console.error('🔴 [Client] Error details:', JSON.stringify(error, null, 2))
            message.error('Failed to create ad. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    // Auth & Verification Gate
    if (isLoading) return null

    if (!user) {
        router.push('/auth/login?returnTo=/ads/create')
        return null
    }

    if (!user.is_verified) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <Card className="max-w-md w-full text-center p-8 rounded-2xl">
                    <InfoCircleOutlined className="text-4xl text-blue-500 mb-4" />
                    <Title level={3}>Verification Required</Title>
                    <Paragraph className="text-gray-600 mb-6">
                        Only verified users can create ad campaigns. Please complete KYC verification in your profile.
                    </Paragraph>
                    <Button type="primary" onClick={() => router.push('/profile')} size="large" className="rounded-full">
                        Go to Profile
                    </Button>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:py-8">
            <div className="max-w-2xl mx-auto">
                <div className="mb-6">
                    <Title level={2}>Create Ad Campaign</Title>
                    <Text className="text-gray-500">Reach the community with sponsored posts.</Text>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Main Form */}
                    <div className="md:col-span-2">
                        <Card className="rounded-2xl shadow-sm">
                            <Form
                                form={form}
                                layout="vertical"
                                onFinish={handleSubmit}
                                initialValues={{ duration: 1 }}
                            >
                                <Form.Item
                                    name="content"
                                    label="Ad Content"
                                    rules={[{ required: true, message: 'Please enter ad content' }]}
                                >
                                    <Input.TextArea
                                        rows={4}
                                        placeholder="What would you like to promote?"
                                        className="rounded-xl"
                                    />
                                </Form.Item>

                                <Form.Item label="Media (Image or Video)">
                                    <Upload
                                        listType="picture-card"
                                        fileList={fileList}
                                        onChange={handleUploadChange}
                                        beforeUpload={() => false}
                                        maxCount={3}
                                        accept="image/*,video/*"
                                    >
                                        {fileList.length < 3 && (
                                            <div>
                                                <UploadOutlined />
                                                <div style={{ marginTop: 8 }}>Upload</div>
                                            </div>
                                        )}
                                    </Upload>
                                </Form.Item>

                                <Form.Item label="Contact Buttons (Optional)">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Form.Item name="contactMobile" noStyle>
                                            <Input prefix={<PhoneOutlined />} placeholder="Mobile Number (Call)" className="rounded-lg" />
                                        </Form.Item>
                                        <Form.Item name="contactWhatsapp" noStyle>
                                            <Input prefix={<WhatsAppOutlined />} placeholder="WhatsApp Number" className="rounded-lg" />
                                        </Form.Item>
                                    </div>
                                </Form.Item>

                                <Form.Item
                                    name="targetLink"
                                    label="Website Link (Optional)"
                                    rules={[{ type: 'url', message: 'Please enter a valid URL' }]}
                                >
                                    <Input prefix={<GlobalOutlined />} placeholder="https://yourwebsite.com" className="rounded-lg" />
                                </Form.Item>

                                <Form.Item
                                    name="duration"
                                    label="Duration (Days)"
                                    rules={[{ required: true }]}
                                >
                                    <InputNumber
                                        min={1}
                                        max={30}
                                        className="w-full"
                                        size="large"
                                        onChange={(val) => setDuration(val || 1)}
                                    />
                                </Form.Item>

                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    size="large"
                                    block
                                    loading={submitting}
                                    icon={<RocketOutlined />}
                                    className="rounded-full h-12 mt-4 bg-gradient-to-r from-blue-600 to-purple-600 border-0"
                                >
                                    Pay & Post Ad
                                </Button>
                            </Form>
                        </Card>
                    </div>

                    {/* Sidebar Summary */}
                    <div className="md:col-span-1">
                        <Card className="rounded-2xl shadow-sm sticky top-24 bg-blue-50 border-blue-100">
                            <Title level={4} className="mb-4">Summary</Title>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <Text>Daily Rate</Text>
                                    <Text strong>{formatNumber(AD_DAILY_RATE)} pts</Text>
                                </div>
                                <div className="flex justify-between items-center">
                                    <Text>Duration</Text>
                                    <Text strong>{duration} Days</Text>
                                </div>

                                <div className="border-t border-blue-200 pt-3 flex justify-between items-center">
                                    <Text strong className="text-lg">Total Cost</Text>
                                    <Text strong className="text-lg text-blue-600">
                                        {formatNumber(totalCost)} pts
                                    </Text>
                                </div>
                            </div>

                            <Alert
                                type="info"
                                showIcon
                                className="mt-6 bg-white/50 border-blue-200"
                                message="Wallet Balance"
                                description={
                                    <div className="mt-1">
                                        <Text strong className={user.points_balance < totalCost ? 'text-red-500' : 'text-green-600'}>
                                            {formatNumber(user.points_balance)} pts
                                        </Text>
                                    </div>
                                }
                            />
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
