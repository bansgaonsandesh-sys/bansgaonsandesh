'use client'

import React from 'react'

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: React.ReactNode
  disabled?: boolean
  threshold?: number
  resistance?: number
}

export default function PullToRefresh({
  children,
}: PullToRefreshProps) {
  // Disabled pull-to-refresh to fix scroll performance on mobile
  // Just render children without touch event handlers
  return <>{children}</>
}
