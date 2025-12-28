'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { siteConfig as SITE_CONFIG } from '@/config/site'
import {
    HomeOutlined,
    CompassOutlined,
    PlusCircleOutlined,
    WalletOutlined,
    UserOutlined,
    LogoutOutlined,
    LoginOutlined,
    EnvironmentOutlined,
    SearchOutlined
} from '@ant-design/icons'
import { message, Modal, Dropdown, Input } from 'antd'
import { motion } from 'framer-motion'
import { useApp } from '../../lib/providers'
import { supabaseClient } from '../../lib/supabase-client'

export default function Sidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const { isGuest, selectedCity, userCity, setSelectedCity, user } = useApp()
    const [citiesFromDB, setCitiesFromDB] = useState<Array<{ id: string; name: string }>>([])
    const [citySearchText, setCitySearchText] = useState('')

    // Fetch cities from database
    useEffect(() => {
        const fetchCities = async () => {
            const { data: cityData } = await supabaseClient
                .from('cities')
                .select('id, name')
                .eq('is_active', true)
                .order('name')
            if (cityData) setCitiesFromDB(cityData)
        }
        fetchCities()
    }, [])

    const handleAuthAction = (action: string) => {
        const returnPath = pathname !== '/auth/login' ? pathname : '/'
        router.push(`/auth/login?returnTo=${encodeURIComponent(returnPath)}`)
    }

    const handleLogout = async () => {
        Modal.confirm({
            title: 'Sign Out',
            content: 'Are you sure you want to sign out?',
            okText: 'Sign Out',
            cancelText: 'Cancel',
            onOk: async () => {
                try {
                    await supabaseClient.auth.signOut()
                    message.success('Logged out successfully')
                    // Optional: redirect to home or login
                    // router.push('/auth/login') 
                } catch (e) {
                    message.error('Failed to log out')
                }
            }
        })
    }

    // Same navigation items logic as MobileLayout
    const navigationItems = isGuest ? [
        { key: '/', icon: HomeOutlined, label: 'Home' },
        { key: '/explore', icon: CompassOutlined, label: 'Explore' },
        {
            key: 'login',
            icon: LoginOutlined,
            label: 'Login',
            onClick: () => handleAuthAction('login')
        },
    ] : [
        { key: '/', icon: HomeOutlined, label: 'Home' },
        { key: '/explore', icon: CompassOutlined, label: 'Explore' },
        // Only show Create button for bansgaonsandesh users
        ...(user?.user_projects?.some(up => up.is_active && up.project_id === 'bansgaonsandesh') || user?.project_id === 'bansgaonsandesh' ? [{ key: '/create', icon: PlusCircleOutlined, label: 'Create' }] : []),
        { key: '/wallet', icon: WalletOutlined, label: 'Wallet' },
        { key: '/profile', icon: UserOutlined, label: 'Profile' },
    ]

    // Filter cities based on search
    const cities = citiesFromDB.map(c => c.name)
    const filteredCities = cities.filter(city =>
        city.toLowerCase().includes(citySearchText.toLowerCase())
    )

    const cityPopupRender = () => (
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden w-64">
            <div className="p-2 border-b border-gray-200 sticky top-0 bg-white z-10">
                <Input
                    placeholder="Search cities..."
                    prefix={<SearchOutlined className="text-gray-400" />}
                    value={citySearchText}
                    onChange={(e) => setCitySearchText(e.target.value)}
                    className="w-full"
                    autoFocus
                />
            </div>
            <div className="max-h-64 overflow-y-auto">
                {filteredCities.length > 0 ? (
                    filteredCities.map(city => (
                        <div
                            key={city}
                            onClick={() => {
                                setSelectedCity(city)
                                setCitySearchText('')
                            }}
                            className={`px-4 py-2.5 cursor-pointer transition-colors ${selectedCity === city
                                    ? 'bg-blue-50 text-blue-600 font-medium'
                                    : 'hover:bg-gray-50 text-gray-700'
                                }`}
                        >
                            {city}
                        </div>
                    ))
                ) : (
                    <div className="px-4 py-6 text-center text-gray-500">
                        No cities found
                    </div>
                )}
            </div>
        </div>
    )

    return (
        <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 border-r border-gray-100 bg-white/80 backdrop-blur-xl px-4 py-6">
            <div className="mb-8 px-4 cursor-pointer" onClick={() => router.push('/')}>
                <Image 
                    src="/logoo.jpeg" 
                    alt={SITE_CONFIG.name}
                    width={180}
                    height={60}
                    className="w-auto h-12 object-contain"
                    priority
                />
            </div>

            {/* City Selector */}
            <div className="mb-4 px-2">
                <Dropdown
                    popupRender={cityPopupRender}
                    trigger={['click']}
                    placement="bottomLeft"
                    onOpenChange={(open) => {
                        if (!open) setCitySearchText('')
                    }}
                >
                    <div className="flex items-center cursor-pointer hover:bg-gray-50 rounded-xl px-3 py-2.5 transition-all duration-200 border border-gray-200">
                        <EnvironmentOutlined className="text-blue-600 mr-2 text-lg" />
                        <div className="flex-1 min-w-0">
                            <span className="font-medium text-gray-800 text-sm block truncate">
                                {selectedCity || 'Select City'}
                            </span>
                            {userCity && userCity !== selectedCity && (
                                <span className="text-xs text-gray-500">Home: {userCity}</span>
                            )}
                        </div>
                    </div>
                </Dropdown>
            </div>

            <nav className="flex-1 space-y-2">
                {navigationItems.map((item) => {
                    const isActive = pathname === item.key
                    const Icon = item.icon

                    return (
                        <button
                            key={item.key}
                            onClick={() => item.onClick ? item.onClick() : router.push(item.key)}
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                    ? 'bg-blue-50 text-blue-600 font-medium'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                        >
                            <Icon className={`text-xl ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                            <span className="text-base">{item.label}</span>
                        </button>
                    )
                })}
            </nav>

            {!isGuest && (
                <div className="mt-auto pt-6 border-t border-gray-100">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors group"
                    >
                        <LogoutOutlined className="text-xl text-slate-400 group-hover:text-red-500" />
                        <span className="text-base">Sign Out</span>
                    </button>
                </div>
            )}
        </aside>
    )
}
