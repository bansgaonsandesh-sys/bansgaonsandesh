'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Table, 
  Card, 
  Button, 
  Space, 
  Typography, 
  Avatar, 
  Tag, 
  Modal, 
  Form, 
  Input, 
  Select, 
  InputNumber, 
  message,
  Popconfirm,
  Divider,
  Badge,
  Tabs
} from 'antd'
import { 
  EditOutlined, 
  DeleteOutlined, 
  PlusOutlined, 
  SearchOutlined,
  UserOutlined,
  CrownOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  UserAddOutlined
} from '@ant-design/icons'
import { motion } from 'framer-motion'
import AdminLayout from '../../../components/layout/AdminLayout'
import { supabaseClient } from '../../../lib/supabase-client'
import { isAdmin } from '../../../lib/utils'
import { adminCreateUser, adminUpdateUser, getAdminCreatedUsers, toggleUserStatus } from '@/app/actions/userActions'

const { Title, Text } = Typography
const { Option } = Select

interface User {
  id: string
  email: string
  name: string
  phone: string | null
  city_id: string | null
  avatar_url: string | null
  points_balance: number
  is_verified: boolean
  has_blue_tick: boolean
  referral_code: string
  age: number | null
  gender: string | null
  created_at: string
  project_id: string
  cities?: { id: string; name: string }
}

interface City {
  id: string
  name: string
  state: string | null
}

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [adminUsers, setAdminUsers] = useState<any[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [createUserModalVisible, setCreateUserModalVisible] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [searchText, setSearchText] = useState('')
  const [projectFilter, setProjectFilter] = useState<string>('all')
  const [activeTab, setActiveTab] = useState('1')
  const [form] = Form.useForm()
  const [createUserForm] = Form.useForm()
  const router = useRouter()

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

      setIsAuthorized(true)
      fetchData()
    } catch (error) {
      router.replace('/auth/login')
    }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch registered users with city information
      const { data: usersData, error: usersError } = await supabaseClient
        .from('profiles')
        .select(`
          *,
          cities:city_id (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false })

      if (usersError) throw usersError

      // Fetch admin-created users
      const adminUsersResult = await getAdminCreatedUsers()
      if (adminUsersResult.success) {
        setAdminUsers(adminUsersResult.data || [])
      }

      // Fetch all cities for the form
      const { data: citiesData, error: citiesError } = await supabaseClient
        .from('cities')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (citiesError) throw citiesError

      setUsers(usersData || [])
      setCities(citiesData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      message.error('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const showModal = (user?: User) => {
    setEditingUser(user || null)
    setModalVisible(true)
    if (user) {
      form.setFieldsValue({
        ...user,
        city_id: user.cities?.id || null
      })
    } else {
      form.resetFields()
    }
  }

  const handleSubmit = async (values: any) => {
    try {
      if (editingUser) {
        // Get access token from current session
        const { data: { session } } = await supabaseClient.auth.getSession()
        if (!session) {
          message.error('Session expired. Please login again.')
          return
        }

        // Update existing user using admin server action
        const result = await adminUpdateUser(
          editingUser.id,
          {
            name: values.name,
            email: values.email,
            phone: values.phone,
            city_id: values.city_id,
            points_balance: values.points_balance,
            is_verified: values.is_verified,
            has_blue_tick: values.has_blue_tick,
            age: values.age,
            gender: values.gender,
          },
          session.access_token
        )

        if (result.success) {
          message.success('User updated successfully')
          setModalVisible(false)
          fetchData()
        } else {
          message.error(result.error || 'Failed to update user')
        }
      } else {
        // Create new user functionality would require additional setup
        message.info('Please use the "Create New User" button to add users')
      }
    } catch (error) {
      console.error('Error saving user:', error)
      message.error('Failed to save user')
    }
  }

  const handleDelete = async (userId: string) => {
    try {
      // Note: Deleting users requires careful consideration of related data
      const { error } = await supabaseClient
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (error) throw error
      message.success('User deleted successfully')
      fetchData()
    } catch (error) {
      console.error('Error deleting user:', error)
      message.error('Failed to delete user')
    }
  }

  const handleCreateNewUser = async (values: any) => {
    setLoading(true)
    console.log('🚀 Creating user with data:', values)
    
    // Get access token from current session
    const { data: { session } } = await supabaseClient.auth.getSession()
    if (!session) {
      message.error('Session expired. Please login again.')
      setLoading(false)
      return
    }
    
    const result = await adminCreateUser({ ...values, accessToken: session.access_token })
    console.log('📥 Server response:', result)
    
    if (result.success) {
      message.success('User created successfully! Invitation email sent.')
      createUserForm.resetFields()
      setCreateUserModalVisible(false)
      fetchData()
    } else {
      console.error('❌ User creation failed:', result.error)
      message.error(result.error || 'Failed to create user')
    }
    setLoading(false)
  }

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    const result = await toggleUserStatus(userId, !currentStatus)
    
    if (result.success) {
      message.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`)
      fetchData()
    } else {
      message.error(result.error || 'Failed to update user status')
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchText.toLowerCase())
    const matchesProject = projectFilter === 'all' || user.project_id === projectFilter
    return matchesSearch && matchesProject
  })

  const filteredAdminUsers = adminUsers.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchText.toLowerCase())
    const matchesProject = projectFilter === 'all' || user.project_id === projectFilter
    return matchesSearch && matchesProject
  })

  const columns = [
    {
      title: 'Avatar',
      dataIndex: 'avatar_url',
      key: 'avatar',
      render: (avatarUrl: string | null, record: User) => (
        <Avatar 
          src={avatarUrl} 
          icon={<UserOutlined />}
          size={40}
        />
      )
    },
    {
      title: 'User Info',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: User) => (
        <Space direction="vertical" size={0}>
          <Space>
            <Text strong>{name}</Text>
            {record.has_blue_tick && <CrownOutlined style={{ color: '#1890ff' }} />}
            {record.is_verified && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
          </Space>
          <Text type="secondary" style={{ fontSize: '12px' }}>{record.email}</Text>
        </Space>
      )
    },
    {
      title: 'Project',
      dataIndex: 'project_id',
      key: 'project',
      render: (projectId: string) => (
        <Tag color={projectId === 'bansgaonsandesh' ? 'blue' : 'green'}>
          {projectId === 'bansgaonsandesh' ? 'Bansgaon Sandesh' : 'Next Update'}
        </Tag>
      )
    },
    {
      title: 'City',
      dataIndex: 'cities',
      key: 'city',
      render: (city: any) => city?.name || 'No City'
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone: string | null) => phone || 'Not provided'
    },
    {
      title: 'Points',
      dataIndex: 'points_balance',
      key: 'points',
      render: (points: number) => (
        <Badge count={Math.round(points)} style={{ backgroundColor: '#52c41a' }} />
      )
    },
    {
      title: 'Status',
      key: 'status',
      render: (record: User) => (
        <Space direction="vertical" size={0}>
          {record.is_verified && <Tag color="green">Verified</Tag>}
          {record.has_blue_tick && <Tag color="blue">Blue Tick</Tag>}
          {!record.is_verified && !record.has_blue_tick && <Tag>Regular</Tag>}
        </Space>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: User) => (
        <Space>
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            onClick={() => showModal(record)}
            size="small"
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete user?"
            description="This action cannot be undone"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button 
              danger 
              icon={<DeleteOutlined />} 
              size="small"
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <AdminLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card>
          <div className="flex justify-between items-center mb-6">
            <Title level={2}>Users Management</Title>
          </div>

          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <Tabs.TabPane tab="Registered Users" key="1">
              <div className="mb-4 flex gap-4">
                <Input
                  placeholder="Search users by name or email"
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{ maxWidth: 300 }}
                />
                <Select
                  value={projectFilter}
                  onChange={setProjectFilter}
                  style={{ width: 200 }}
                  placeholder="Filter by project"
                >
                  <Option value="all">All Projects</Option>
                  <Option value="bansgaonsandesh">📰 Bansgaon Sandesh</Option>
                  <Option value="nextupdate">🌐 Next Update</Option>
                </Select>
              </div>

              <Table
                dataSource={filteredUsers}
                columns={columns}
                loading={loading}
                rowKey="id"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total) => `Total ${total} users`
                }}
              />
            </Tabs.TabPane>

            <Tabs.TabPane 
              tab={
                <span>
                  <UserAddOutlined /> Create New User
                </span>
              } 
              key="2"
            >
              <Card className="mb-4 bg-blue-50">
                <Text type="secondary">
                  <strong>Note:</strong> In Bansgaon Sandesh, only admins can create user accounts. 
                  Users will receive an invitation email to set their password and complete registration.
                </Text>
              </Card>
              
              <div className="flex justify-end mb-4">
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setCreateUserModalVisible(true)}
                >
                  Create New User
                </Button>
              </div>

              <Table
                dataSource={filteredAdminUsers}
                loading={loading}
                rowKey="id"
                columns={[
                  {
                    title: 'Name',
                    dataIndex: 'name',
                    key: 'name',
                  },
                  {
                    title: 'Email',
                    dataIndex: 'email',
                    key: 'email',
                  },
                  {
                    title: 'Phone',
                    dataIndex: 'phone',
                    key: 'phone',
                  },
                  {
                    title: 'Project',
                    dataIndex: 'project_id',
                    key: 'project',
                    render: (projectId: string) => (
                      <Tag color={projectId === 'bansgaonsandesh' ? 'blue' : 'green'}>
                        {projectId === 'bansgaonsandesh' ? 'Bansgaon Sandesh' : 'Next Update'}
                      </Tag>
                    ),
                  },
                  {
                    title: 'Status',
                    dataIndex: 'is_active',
                    key: 'is_active',
                    render: (isActive: boolean) => (
                      <Tag color={isActive ? 'green' : 'red'}>
                        {isActive ? 'Active' : 'Inactive'}
                      </Tag>
                    ),
                  },
                  {
                    title: 'Activated',
                    dataIndex: 'activated_at',
                    key: 'activated_at',
                    render: (activated: string | null) => (
                      <Tag color={activated ? 'blue' : 'orange'}>
                        {activated ? 'Yes' : 'Pending'}
                      </Tag>
                    ),
                  },
                  {
                    title: 'Created At',
                    dataIndex: 'created_at',
                    key: 'created_at',
                    render: (date: string) => new Date(date).toLocaleDateString('en-IN'),
                  },
                  {
                    title: 'Actions',
                    key: 'actions',
                    render: (_: any, record: any) => (
                      <Space>
                        <Popconfirm
                          title={`${record.is_active ? 'Deactivate' : 'Activate'} this user?`}
                          onConfirm={() => handleToggleUserStatus(record.id, record.is_active)}
                          okText="Yes"
                          cancelText="No"
                        >
                          <Button 
                            size="small"
                            icon={record.is_active ? <CloseCircleOutlined /> : <CheckCircleOutlined />}
                          >
                            {record.is_active ? 'Deactivate' : 'Activate'}
                          </Button>
                        </Popconfirm>
                      </Space>
                    ),
                  },
                ]}
                pagination={{
                  pageSize: 10,
                  showTotal: (total) => `Total ${total} users created by admin`
                }}
              />
            </Tabs.TabPane>
          </Tabs>
        </Card>

        <Modal
          title={editingUser ? 'Edit User' : 'Add User'}
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          onOk={form.submit}
          width={600}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Form.Item
              name="name"
              label="Name"
              rules={[{ required: true, message: 'Please enter name' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Please enter email' },
                { type: 'email', message: 'Please enter valid email' }
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item name="phone" label="Phone">
              <Input />
            </Form.Item>

            <Form.Item name="city_id" label="City">
              <Select placeholder="Select city" allowClear>
                {cities.map(city => (
                  <Option key={city.id} value={city.id}>
                    {city.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="age" label="Age">
              <InputNumber min={1} max={120} />
            </Form.Item>

            <Form.Item name="gender" label="Gender">
              <Select placeholder="Select gender">
                <Option value="male">Male</Option>
                <Option value="female">Female</Option>
                <Option value="other">Other</Option>
              </Select>
            </Form.Item>

            <Divider />

            <Form.Item name="points_balance" label="Points Balance">
              <InputNumber min={0} />
            </Form.Item>

            <Form.Item name="is_verified" label="Verified" valuePropName="checked">
              <Select>
                <Option value={true}>Yes</Option>
                <Option value={false}>No</Option>
              </Select>
            </Form.Item>

            <Form.Item name="has_blue_tick" label="Blue Tick" valuePropName="checked">
              <Select>
                <Option value={true}>Yes</Option>
                <Option value={false}>No</Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>

        {/* Create New User Modal */}
        <Modal
          title="Create New User"
          open={createUserModalVisible}
          onCancel={() => {
            setCreateUserModalVisible(false)
            createUserForm.resetFields()
          }}
          footer={null}
          width={500}
        >
          <Form
            form={createUserForm}
            layout="vertical"
            onFinish={handleCreateNewUser}
          >
            <Form.Item
              label="Name"
              name="name"
              rules={[
                { required: true, message: 'Please enter name' },
                { min: 2, message: 'Name must be at least 2 characters' }
              ]}
            >
              <Input placeholder="Full Name" />
            </Form.Item>

            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: 'Please enter email' },
                { type: 'email', message: 'Please enter a valid email' }
              ]}
            >
              <Input placeholder="user@example.com" />
            </Form.Item>

            <Form.Item
              label="Phone"
              name="phone"
              rules={[
                { required: true, message: 'Please enter phone number' },
                { pattern: /^[6-9]\d{9}$/, message: 'Please enter a valid 10-digit Indian phone number' }
              ]}
            >
              <Input placeholder="9876543210" maxLength={10} />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[
                { required: true, message: 'Please enter password' },
                { min: 6, message: 'Password must be at least 6 characters' }
              ]}
            >
              <Input.Password placeholder="Minimum 6 characters" />
            </Form.Item>

            <Form.Item
              label="City"
              name="city_id"
              rules={[{ required: true, message: 'Please select a city' }]}
            >
              <Select 
                placeholder="Select city" 
                showSearch
                filterOption={(input, option) =>
                  (option?.children?.toString().toLowerCase() || '').includes(input.toLowerCase())
                }
              >
                {cities.map((city) => (
                  <Option key={city.id} value={city.id}>
                    {city.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="Project"
              name="project_id"
              rules={[{ required: true, message: 'Please select a project' }]}
            >
              <Select placeholder="Select project">
                <Option value="bansgaonsandesh">
                  <span className="text-blue-600">📰 Bansgaon Sandesh</span>
                  <div className="text-xs text-gray-500">News Agency</div>
                </Option>
                <Option value="nextupdate">
                  <span className="text-green-600">🌐 Next Update</span>
                  <div className="text-xs text-gray-500">Social Platform</div>
                </Option>
              </Select>
            </Form.Item>

            <div className="flex justify-end gap-2">
              <Button onClick={() => {
                setCreateUserModalVisible(false)
                createUserForm.resetFields()
              }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Create User
              </Button>
            </div>
          </Form>
        </Modal>
      </motion.div>
    </AdminLayout>
  )
}