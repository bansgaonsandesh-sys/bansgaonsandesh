'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Card,
    Table,
    Button,
    Space,
    Typography,
    Avatar,
    message,
    Tag,
    Modal,
    Form,
    Input,
    Image,
    Statistic,
    Descriptions,
    Tabs,
    Select,
    Switch,
    Popconfirm,
    Upload,
    Radio
} from 'antd'
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    EyeOutlined,
    ClockCircleOutlined,
    PhoneOutlined,
    WhatsAppOutlined,
    PlusOutlined,
    DeleteOutlined,
    EditOutlined,
    UploadOutlined,
    GlobalOutlined
} from '@ant-design/icons'
import { motion } from 'framer-motion'
import { supabaseClient } from '../../../lib/supabase-client'
import AdminLayout from '../../../components/layout/AdminLayout'
import {
    fetchPendingAds,
    fetchAllAds,
    updateAdStatus,
    fetchAllSystemAds,
    createSystemAd,
    toggleSystemAd,
    deleteSystemAd,
    updateSystemAd
} from '../../actions/adActions'
import { getProxiedImageUrl, uploadToR2, generateFileKey } from '../../../lib/r2-storage'
import { isAdmin } from '../../../lib/utils'

const { Title, Text } = Typography
const { TextArea } = Input
const { Option } = Select

interface AdSubmission {
    id: string
    user_id: string
    content: string
    media_urls: string[]
    media_type: 'image' | 'video'
    target_link: string | null
    status: 'pending' | 'active' | 'rejected'
    rejection_reason: string | null
    duration_days: number
    daily_rate: number
    total_points: number
    start_date: string | null
    end_date: string | null
    contact_mobile: string | null
    contact_whatsapp: string | null
    created_at: string
    profiles?: {
        name?: string
        email?: string
        avatar_url?: string | null
    }
}

interface SystemAd {
    id: string
    type: 'banner' | 'popup'
    title: string
    description: string | null
    image_url: string
    redirect_url: string | null
    contact_phone: string | null
    contact_whatsapp: string | null
    contact_website: string | null
    is_active: boolean
    created_at: string
}

export default function AdminAdsPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [isAuthorized, setIsAuthorized] = useState(false)
    const [token, setToken] = useState<string>('')

    // User Ads State
    const [submissions, setSubmissions] = useState<AdSubmission[]>([])
    const [allAds, setAllAds] = useState<AdSubmission[]>([])
    const [stats, setStats] = useState({ pending: 0 })
    const [viewModalVisible, setViewModalVisible] = useState(false)
    const [actionModalVisible, setActionModalVisible] = useState(false)
    const [viewingAd, setViewingAd] = useState<AdSubmission | null>(null)
    const [actionAd, setActionAd] = useState<AdSubmission | null>(null)
    const [actionType, setActionType] = useState<'approve' | 'reject'>('approve')
    const [form] = Form.useForm()

    // System Ads State
    const [systemAds, setSystemAds] = useState<SystemAd[]>([])
    const [systemAdModalVisible, setSystemAdModalVisible] = useState(false)
    const [editingSystemAd, setEditingSystemAd] = useState<SystemAd | null>(null)
    const [creatingSystemAd, setCreatingSystemAd] = useState(false)
    const [uploadingImage, setUploadingImage] = useState(false)
    const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('')
    const [systemAdForm] = Form.useForm()

    useEffect(() => {
        checkAuth()
    }, [])

    const checkAuth = async () => {
        try {
            const { data: { session } } = await supabaseClient.auth.getSession()
            if (!session) {
                router.replace('/auth/login')
                return
            }

            const email = session.user.email || ''
            if (!isAdmin(email)) {
                router.replace('/auth/login')
                return
            }

            setToken(session.access_token)
            setIsAuthorized(true)
            loadData(session.access_token)
        } catch (error) {
            router.replace('/auth/login')
        }
    }

    const loadData = async (accessToken: string) => {
        setLoading(true)
        try {
            const [pendingAds, allUserAds, sysAds] = await Promise.all([
                fetchPendingAds(accessToken),
                fetchAllAds(accessToken),
                fetchAllSystemAds(accessToken)
            ])
            setSubmissions(pendingAds as any[])
            setAllAds(allUserAds as any[])
            setSystemAds(sysAds as any[])
            setStats({ pending: pendingAds.length })
        } catch (error) {
            message.error('Failed to load ads')
        } finally {
            setLoading(false)
        }
    }

    // --- User Ad Handlers ---

    const showViewModal = (ad: AdSubmission) => {
        setViewingAd(ad)
        setViewModalVisible(true)
    }

    const showActionModal = (ad: AdSubmission, action: 'approve' | 'reject') => {
        setActionAd(ad)
        setActionType(action)
        setActionModalVisible(true)
        form.resetFields()
    }

    const handleAction = async (values: any) => {
        if (!actionAd || !token) return

        try {
            const result = await updateAdStatus(
                token,
                actionAd.id,
                actionType === 'approve' ? 'active' : 'rejected',
                values.rejection_reason
            )

            if (result.success) {
                message.success(`Ad ${actionType === 'approve' ? 'approved' : 'rejected'} successfully`)
                setActionModalVisible(false)
                loadData(token) // Refresh all
            } else {
                message.error(result.error || 'Operation failed')
            }
        } catch (error) {
            message.error('Error processing request')
        }
    }

    // --- System Ad Handlers ---

    const handleCreateSystemAd = async (values: any) => {
        setCreatingSystemAd(true)
        try {
            let result
            if (editingSystemAd) {
                result = await updateSystemAd(token, editingSystemAd.id, values)
            } else {
                result = await createSystemAd(token, values)
            }

            if (result.success) {
                message.success(`System ad ${editingSystemAd ? 'updated' : 'created'}`)
                setSystemAdModalVisible(false)
                setEditingSystemAd(null)
                systemAdForm.resetFields()
                loadData(token)
            } else {
                message.error(result.error)
            }
        } catch (err) {
            message.error('Failed to save system ad')
        } finally {
            setCreatingSystemAd(false)
        }
    }

    const handleEditSystemAd = (ad: SystemAd) => {
        setEditingSystemAd(ad)
        systemAdForm.setFieldsValue({
            title: ad.title,
            description: ad.description,
            type: ad.type,
            image_url: ad.image_url,
            redirect_url: ad.redirect_url,
            contact_phone: ad.contact_phone,
            contact_whatsapp: ad.contact_whatsapp,
            contact_website: ad.contact_website
        })
        setUploadedImageUrl(ad.image_url)
        setSystemAdModalVisible(true)
    }

    const handleToggleSystemAd = async (ad: SystemAd, checked: boolean) => {
        const result = await toggleSystemAd(token, ad.id, checked)
        if (result.success) {
            message.success(`Ad ${checked ? 'activated' : 'deactivated'}`)
            loadData(token)
        } else {
            message.error('Failed to update status')
        }
    }

    const handleDeleteSystemAd = async (adId: string) => {
        const result = await deleteSystemAd(token, adId)
        if (result.success) {
            message.success('System ad deleted')
            loadData(token)
        } else {
            message.error('Failed to delete ad')
        }
    }

    const handleImageUpload = async (file: File) => {
        setUploadingImage(true)
        try {
            const fileKey = generateFileKey('system-ads', file.name)
            const result = await uploadToR2(file, fileKey)
            const url = typeof result === 'string' ? result : result.url || ''
            setUploadedImageUrl(url)
            systemAdForm.setFieldsValue({ image_url: url })
            message.success('Image uploaded successfully')
            return false // Prevent default upload behavior
        } catch (error) {
            message.error('Failed to upload image')
            return false
        } finally {
            setUploadingImage(false)
        }
    }


    // --- Columns ---

    const userAdColumns = [
        {
            title: 'User',
            key: 'user',
            width: 180,
            fixed: 'left' as const,
            render: (record: AdSubmission) => (
                <Space>
                    <Avatar src={getProxiedImageUrl(record.profiles?.avatar_url)} />
                    <div>
                        <Text strong className="block">{record.profiles?.name}</Text>
                        <Text type="secondary" className="text-xs">{record.profiles?.email}</Text>
                    </div>
                </Space>
            )
        },
        {
            title: 'Content',
            key: 'content',
            width: 250,
            render: (record: AdSubmission) => (
                <Space direction="vertical" size={4}>
                    <Text ellipsis={{ tooltip: record.content }} style={{ maxWidth: 230 }}>
                        {record.content}
                    </Text>
                    {record.media_urls.length > 0 && (
                        <div className="flex gap-1">
                            {record.media_urls.slice(0, 2).map((url, i) => (
                                <div key={i} className="w-12 h-12 rounded bg-gray-100 overflow-hidden">
                                    {record.media_type === 'image' ? (
                                        <img src={getProxiedImageUrl(url) || ''} className="w-full h-full object-cover" alt="ad-media" />
                                    ) : (
                                        <video src={getProxiedImageUrl(url) || ''} className="w-full h-full object-cover" />
                                    )}
                                </div>
                            ))}
                            {record.media_urls.length > 2 && (
                                <div className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center">
                                    <Text className="text-xs">+{record.media_urls.length - 2}</Text>
                                </div>
                            )}
                        </div>
                    )}
                </Space>
            )
        },
        {
            title: 'Contacts',
            key: 'contacts',
            width: 150,
            render: (r: AdSubmission) => (
                <Space direction="vertical" size={2}>
                    {r.contact_mobile && <Text className="text-xs"><PhoneOutlined /> {r.contact_mobile}</Text>}
                    {r.contact_whatsapp && <Text className="text-xs"><WhatsAppOutlined /> WhatsApp</Text>}
                    {!r.contact_mobile && !r.contact_whatsapp && <Text type="secondary">-</Text>}
                </Space>
            )
        },
        {
            title: 'Status',
            key: 'status',
            width: 100,
            render: () => <Tag color="gold">PENDING</Tag>
        },
        {
            title: 'Submitted',
            key: 'created_at',
            width: 120,
            render: (r: AdSubmission) => (
                <Text className="text-xs">{new Date(r.created_at).toLocaleDateString()}</Text>
            )
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 280,
            fixed: 'right' as const,
            render: (record: AdSubmission) => (
                <Space wrap>
                    <Button size="small" icon={<EyeOutlined />} onClick={() => showViewModal(record)}>View</Button>
                    <Button size="small" type="primary" style={{ background: '#52c41a' }} icon={<CheckCircleOutlined />} onClick={() => showActionModal(record, 'approve')}>Approve</Button>
                    <Button size="small" danger icon={<CloseCircleOutlined />} onClick={() => showActionModal(record, 'reject')}>Reject</Button>
                </Space>
            )
        }
    ]

    const systemAdColumns = [
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            width: 200,
            fixed: 'left' as const,
            render: (text: string) => <Text strong>{text}</Text>
        },
        {
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
            width: 100,
            render: (type: string) => <Tag color={type === 'banner' ? 'blue' : 'purple'}>{type.toUpperCase()}</Tag>
        },
        {
            title: 'Image',
            key: 'image',
            width: 120,
            render: (r: SystemAd) => (
                <div className="w-24 h-16 bg-gray-100 rounded overflow-hidden">
                    <img src={getProxiedImageUrl(r.image_url) || r.image_url} className="w-full h-full object-cover" alt="ad" />
                </div>
            )
        },
        {
            title: 'Contacts',
            key: 'contacts',
            width: 180,
            render: (r: SystemAd) => (
                <Space direction="vertical" size={2}>
                    {r.contact_phone && <Text className="text-xs"><PhoneOutlined /> {r.contact_phone}</Text>}
                    {r.contact_whatsapp && <Text className="text-xs"><WhatsAppOutlined /> WhatsApp</Text>}
                    {r.contact_website && <Text className="text-xs"><GlobalOutlined /> Website</Text>}
                    {!r.contact_phone && !r.contact_whatsapp && !r.contact_website && <Text type="secondary" className="text-xs">-</Text>}
                </Space>
            )
        },
        {
            title: 'Active',
            key: 'active',
            width: 80,
            render: (r: SystemAd) => (
                <Switch checked={r.is_active} onChange={(checked) => handleToggleSystemAd(r, checked)} />
            )
        },
        {
            title: 'Created',
            key: 'created_at',
            width: 120,
            render: (r: SystemAd) => <Text className="text-xs">{new Date(r.created_at).toLocaleDateString()}</Text>
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 80,
            render: (r: SystemAd) => (
                <Space>
                    <Button icon={<EditOutlined />} size="small" onClick={() => handleEditSystemAd(r)} />
                    <Popconfirm title="Delete this ad?" onConfirm={() => handleDeleteSystemAd(r.id)}>
                        <Button danger icon={<DeleteOutlined />} size="small" />
                    </Popconfirm>
                </Space>
            )
        }
    ]

    if (!isAuthorized) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Spin />
            </div>
        )
    }

    function Spin() {
        return <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    }

    const items = [
        {
            key: '1',
            label: `User Approvals (${stats.pending})`,
            children: (
                <Table
                    dataSource={submissions}
                    columns={userAdColumns}
                    loading={loading}
                    rowKey="id"
                    scroll={{ x: 1200 }}
                    pagination={{ pageSize: 10, showSizeChanger: true }}
                />
            )
        },
        {
            key: '2',
            label: `All Ads (${allAds.length})`,
            children: (
                <Table
                    dataSource={allAds}
                    columns={[
                        ...userAdColumns.slice(0, -2), // All columns except Status and Actions
                        {
                            title: 'Status',
                            key: 'status',
                            width: 120,
                            render: (r: AdSubmission) => {
                                const statusColors = {
                                    pending: 'gold',
                                    active: 'green',
                                    rejected: 'red',
                                    expired: 'gray'
                                }
                                return <Tag color={statusColors[r.status]}>{r.status.toUpperCase()}</Tag>
                            }
                        },
                        {
                            title: 'Actions',
                            key: 'actions',
                            width: 100,
                            fixed: 'right' as const,
                            render: (record: AdSubmission) => (
                                <Button size="small" icon={<EyeOutlined />} onClick={() => showViewModal(record)}>View</Button>
                            )
                        }
                    ]}
                    loading={loading}
                    rowKey="id"
                    scroll={{ x: 1200 }}
                    pagination={{ pageSize: 10, showSizeChanger: true }}
                />
            )
        },
        {
            key: '3',
            label: 'System Ads',
            children: (
                <div>
                    <div className="mb-4 flex justify-end">
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => {
                            setEditingSystemAd(null)
                            systemAdForm.resetFields()
                            setUploadedImageUrl('')
                            setSystemAdModalVisible(true)
                        }}>
                            Create System Ad
                        </Button>
                    </div>
                    <Table
                        dataSource={systemAds}
                        columns={systemAdColumns}
                        loading={loading}
                        rowKey="id"
                        scroll={{ x: 1000 }}
                        pagination={{ pageSize: 10, showSizeChanger: true }}
                    />
                </div>
            )
        }
    ]

    return (
        <AdminLayout>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex justify-between items-center mb-6">
                    <Title level={2}>Ad Management</Title>
                </div>

                <Card>
                    <Tabs defaultActiveKey="1" items={items} />
                </Card>

                {/* User Ad View Modal */}
                <Modal
                    open={viewModalVisible}
                    onCancel={() => setViewModalVisible(false)}
                    footer={[<Button key="close" onClick={() => setViewModalVisible(false)}>Close</Button>]}
                    width={800}
                    title="Ad Details"
                >
                    {viewingAd && (
                        <div className="space-y-6">
                            {/* User Info */}
                            <div className="flex gap-4 items-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                                <Avatar size={64} src={getProxiedImageUrl(viewingAd.profiles?.avatar_url)} />
                                <div>
                                    <Text strong className="block text-xl">{viewingAd.profiles?.name}</Text>
                                    <Text type="secondary" className="block">{viewingAd.profiles?.email}</Text>
                                    <Text type="secondary" className="text-xs">User ID: {viewingAd.user_id}</Text>
                                </div>
                            </div>

                            {/* Ad Content */}
                            <div>
                                <Text strong className="block mb-2 text-base">Ad Content</Text>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <Text className="text-base">{viewingAd.content}</Text>
                                </div>
                            </div>

                            {/* Media */}
                            {viewingAd.media_urls.length > 0 && (
                                <div>
                                    <Text strong className="block mb-3 text-base">Media ({viewingAd.media_urls.length})</Text>
                                    <div className="grid grid-cols-2 gap-4">
                                        {viewingAd.media_urls.map((url, i) => (
                                            <div key={i} className="rounded-lg overflow-hidden border-2 border-gray-200">
                                                {viewingAd.media_type === 'image' ? (
                                                    <img src={getProxiedImageUrl(url) || ''} alt="media" className="w-full" />
                                                ) : (
                                                    <video controls src={getProxiedImageUrl(url) || ''} className="w-full" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Campaign Details */}
                            <Descriptions title="Campaign Details" bordered column={2} size="small">
                                <Descriptions.Item label="Status">
                                    <Tag color="gold" className="text-sm">PENDING APPROVAL</Tag>
                                </Descriptions.Item>
                                <Descriptions.Item label="Daily Rate">
                                    <Text strong className="text-base">{viewingAd.daily_rate || 0} points/day</Text>
                                </Descriptions.Item>
                                <Descriptions.Item label="Total Points">
                                    <Text strong className="text-base text-green-600">{viewingAd.total_points || 0} points</Text>
                                </Descriptions.Item>
                                <Descriptions.Item label="Duration">
                                    {viewingAd.start_date && viewingAd.end_date ? (
                                        <Text>{Math.ceil((new Date(viewingAd.end_date).getTime() - new Date(viewingAd.start_date).getTime()) / (1000 * 60 * 60 * 24))} days</Text>
                                    ) : (
                                        <Text type="secondary">Not set</Text>
                                    )}
                                </Descriptions.Item>
                                <Descriptions.Item label="Start Date">
                                    {viewingAd.start_date ? new Date(viewingAd.start_date).toLocaleString() : 'Pending approval'}
                                </Descriptions.Item>
                                <Descriptions.Item label="End Date">
                                    {viewingAd.end_date ? new Date(viewingAd.end_date).toLocaleString() : 'Pending approval'}
                                </Descriptions.Item>
                                <Descriptions.Item label="Submitted On">
                                    {new Date(viewingAd.created_at).toLocaleString()}
                                </Descriptions.Item>
                                <Descriptions.Item label="Target Link">
                                    {viewingAd.target_link ? (
                                        <a href={viewingAd.target_link} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                                            {viewingAd.target_link}
                                        </a>
                                    ) : '-'}
                                </Descriptions.Item>
                            </Descriptions>

                            {/* Contact Information */}
                            <div>
                                <Text strong className="block mb-3 text-base">Contact Information</Text>
                                <div className="grid grid-cols-2 gap-3">
                                    {viewingAd.contact_mobile && (
                                        <div className="p-3 bg-blue-50 rounded-lg flex items-center gap-2">
                                            <PhoneOutlined className="text-blue-600 text-lg" />
                                            <div>
                                                <Text type="secondary" className="text-xs block">Mobile</Text>
                                                <Text strong>{viewingAd.contact_mobile}</Text>
                                            </div>
                                        </div>
                                    )}
                                    {viewingAd.contact_whatsapp && (
                                        <div className="p-3 bg-green-50 rounded-lg flex items-center gap-2">
                                            <WhatsAppOutlined className="text-green-600 text-lg" />
                                            <div>
                                                <Text type="secondary" className="text-xs block">WhatsApp</Text>
                                                <Text strong>{viewingAd.contact_whatsapp}</Text>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {!viewingAd.contact_mobile && !viewingAd.contact_whatsapp && (
                                    <Text type="secondary">No contact information provided</Text>
                                )}
                            </div>

                            {/* Rejection Reason (if any) */}
                            {viewingAd.rejection_reason && (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <Text strong className="block mb-2 text-red-700">Rejection Reason</Text>
                                    <Text className="text-red-600">{viewingAd.rejection_reason}</Text>
                                </div>
                            )}
                        </div>
                    )}
                </Modal>

                {/* User Ad Action Modal */}
                <Modal
                    title={`${actionType === 'approve' ? 'Approve' : 'Reject'} Ad`}
                    open={actionModalVisible}
                    onOk={form.submit}
                    onCancel={() => setActionModalVisible(false)}
                    okButtonProps={{ danger: actionType === 'reject', type: 'primary' }}
                    okText={actionType === 'approve' ? 'Approve & Publish' : 'Reject Ad'}
                >
                    <Form form={form} layout="vertical" onFinish={handleAction}>
                        {actionType === 'reject' ? (
                            <Form.Item name="rejection_reason" label="Reason for Rejection" rules={[{ required: true }]}>
                                <TextArea rows={4} placeholder="e.g. Inappropriate content, Low quality media..." />
                            </Form.Item>
                        ) : (
                            <p>Are you sure you want to approve this ad? It will go live immediately.</p>
                        )}
                    </Form>
                </Modal>

                {/* Create/Edit System Ad Modal */}
                <Modal
                    title={editingSystemAd ? "Edit System Ad" : "Create System Ad"}
                    open={systemAdModalVisible}
                    onOk={systemAdForm.submit}
                    onCancel={() => {
                        setSystemAdModalVisible(false)
                        setUploadedImageUrl('')
                        setEditingSystemAd(null)
                        systemAdForm.resetFields()
                    }}
                    confirmLoading={creatingSystemAd}
                    width={600}
                >
                    <Form form={systemAdForm} layout="vertical" onFinish={handleCreateSystemAd}>
                        <Form.Item name="title" label="Title" rules={[{ required: true, message: 'Title is required' }]}>
                            <Input placeholder="Ad Title" />
                        </Form.Item>

                        <Form.Item name="description" label="Description (Optional)">
                            <TextArea rows={2} placeholder="Brief description of the ad..." />
                        </Form.Item>

                        <Form.Item name="type" label="Ad Type" initialValue="banner" rules={[{ required: true }]}>
                            <Radio.Group>
                                <Radio value="banner">Banner (In-Feed)</Radio>
                                <Radio value="popup">Popup (Modal)</Radio>
                            </Radio.Group>
                        </Form.Item>

                        <Form.Item label="Ad Image">
                            <Space direction="vertical" style={{ width: '100%' }}>
                                <Upload
                                    beforeUpload={handleImageUpload}
                                    showUploadList={false}
                                    accept="image/*"
                                >
                                    <Button icon={<UploadOutlined />} loading={uploadingImage}>
                                        Upload Image
                                    </Button>
                                </Upload>

                                {uploadedImageUrl && (
                                    <div className="mt-2 p-2 bg-gray-50 rounded">
                                        <img src={uploadedImageUrl} alt="preview" className="max-h-32 rounded" />
                                    </div>
                                )}

                                <Text type="secondary" className="text-xs">Or enter image URL below</Text>
                            </Space>
                        </Form.Item>

                        <Form.Item
                            name="image_url"
                            label="Image URL"
                            rules={[{ required: true, message: 'Please upload an image or provide URL' }]}
                        >
                            <Input placeholder="https://example.com/image.jpg" />
                        </Form.Item>

                        <Form.Item name="redirect_url" label="Redirect URL (Optional)">
                            <Input placeholder="https://example.com/offer" />
                            <Text type="secondary" className="text-xs">
                                Used for the "Learn More" button.
                            </Text>
                        </Form.Item>

                        <Text strong className="block mb-2">Contact Information (Optional)</Text>

                        <Form.Item name="contact_phone" label="Phone Number">
                            <Input prefix={<PhoneOutlined />} placeholder="+91XXXXXXXXXX" />
                        </Form.Item>

                        <Form.Item name="contact_whatsapp" label="WhatsApp Number">
                            <Input prefix={<WhatsAppOutlined />} placeholder="+91XXXXXXXXXX" />
                        </Form.Item>

                        <Form.Item name="contact_website" label="Website URL">
                            <Input prefix={<GlobalOutlined />} placeholder="https://example.com" />
                        </Form.Item>
                    </Form>
                </Modal>

            </motion.div>
        </AdminLayout>
    )
}
