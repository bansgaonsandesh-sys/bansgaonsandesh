'use client'

import React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
    HomeOutlined,
    CompassOutlined,
    PlusCircleOutlined,
    WalletOutlined,
    UserOutlined,
    LogoutOutlined,
    LoginOutlined
} from '@ant-design/icons'
import { message, Modal } from 'antd'
import { motion } from 'framer-motion'
import { useApp } from '../../lib/providers'
import { supabaseClient } from '../../lib/supabase-client'

export default function Sidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const { isGuest } = useApp()

    const handleAuthAction = (action: string) => {
        const returnPath = pathname !== '/auth/login' && pathname !== '/auth/register' ? pathname : '/'
        const authPath = action === 'register' ? '/auth/register' : '/auth/login'
        router.push(`${authPath}?returnTo=${encodeURIComponent(returnPath)}`)
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
        {
            key: 'register',
            icon: PlusCircleOutlined,
            label: 'Sign Up',
            onClick: () => handleAuthAction('register')
        },
    ] : [
        { key: '/', icon: HomeOutlined, label: 'Home' },
        { key: '/explore', icon: CompassOutlined, label: 'Explore' },
        { key: '/create', icon: PlusCircleOutlined, label: 'Create' },
        { key: '/wallet', icon: WalletOutlined, label: 'Wallet' },
        { key: '/profile', icon: UserOutlined, label: 'Profile' },
    ]

    return (
        <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 border-r border-gray-100 bg-white/80 backdrop-blur-xl px-4 py-6">
            <div className="mb-8 px-4">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Next Update
                </h1>
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
