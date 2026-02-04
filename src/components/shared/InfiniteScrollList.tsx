'use client'

import React, { useRef, useEffect, useCallback } from 'react'
import { Spin, Empty, Button, Space } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'

interface InfiniteScrollListProps<T> {
  data: T[]
  isLoading: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean
  fetchNextPage: () => void
  error?: Error | null
  retry?: () => void
  renderItem: (item: T, index: number) => React.ReactNode
  emptyMessage?: string
  loadingMessage?: string
  threshold?: number // Distance from bottom to trigger load (default: 300px)
  className?: string
}

export default function InfiniteScrollList<T extends { id: string }>({
  data,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
  error,
  retry,
  renderItem,
  emptyMessage = 'No items found',
  loadingMessage = 'Loading...',
  threshold = 300,
  className = '',
}: InfiniteScrollListProps<T>) {
  const observerTarget = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Intersection Observer for infinite scroll
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0]
      if (target.isIntersecting && hasNextPage && !isFetchingNextPage && !isLoading) {
        console.log('🔄 Loading more items...')
        fetchNextPage()
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage, isLoading]
  )

  useEffect(() => {
    const element = observerTarget.current
    if (!element) return

    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: `${threshold}px`,
      threshold: 0,
    })

    observer.observe(element)

    return () => {
      if (element) observer.unobserve(element)
    }
  }, [handleObserver, threshold])

  // Initial loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-3">
        <Spin size="large" />
        <p className="text-gray-500 text-sm">{loadingMessage}</p>
      </div>
    )
  }

  // Error state
  if (error && !data.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <p className="text-red-500 text-sm">Failed to load data</p>
        {retry && (
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={retry}
          >
            Retry
          </Button>
        )}
      </div>
    )
  }

  // Empty state
  if (!data || !data.length) {
    return (
      <div className="py-12">
        <Empty description={emptyMessage} />
      </div>
    )
  }

  return (
    <div ref={listRef} className={className}>
        {data.map((item, index) => (
          <div key={item?.id || index}>
            {renderItem(item, index)}
          </div>
        ))}

      {/* Loading indicator for next page */}
      {isFetchingNextPage && (
        <div className="flex justify-center py-6">
          <Space>
            <Spin />
            <span className="text-gray-500 text-sm">Loading more...</span>
          </Space>
        </div>
      )}

      {/* End of list indicator */}
      {!hasNextPage && data.length > 0 && (
        <div className="text-center py-6 text-gray-400 text-sm">
          You&apos;ve reached the end 🎉
        </div>
      )}

      {/* Intersection observer target */}
      <div ref={observerTarget} className="h-4" />
    </div>
  )
}
