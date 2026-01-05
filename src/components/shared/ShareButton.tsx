'use client'

import React from 'react';
import { message } from 'antd';
import { Share2 } from 'lucide-react';
import { ShareAltOutlined } from '@ant-design/icons';
import useNativeShare from '@/hooks/useNativeShare';
import { formatNumber } from '@/lib/utils';

interface ShareButtonProps {
  postId?: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  author?: string;
  variant?: 'default' | 'icon' | 'text' | 'plain';
  size?: 'small' | 'middle' | 'large';
  showText?: boolean;
  showCount?: boolean;
  count?: number;
  className?: string;
  iconType?: 'ant' | 'lucide';
  customData?: {
    title: string;
    text?: string;
    url: string;
    imageUrl?: string;
    description?: string;
    hashtags?: string[];
  };
}

/**
 * Universal Share Button Component
 * Works on web with Web Share API and on app with native share
 */
export const ShareButton: React.FC<ShareButtonProps> = ({
  postId,
  title,
  description,
  imageUrl,
  author,
  variant = 'icon',
  size = 'middle',
  showText = false,
  showCount = false,
  count = 0,
  className = '',
  iconType = 'ant',
  customData,
}) => {
  const { isNativeApp, isLoading, error, sharePost, share } = useNativeShare({
    onSuccess: () => {
      message.success('Shared successfully!');
    },
    onError: (err) => {
      if (err.message !== 'Share cancelled or not supported') {
        message.error('Failed to share content');
      }
    },
  });

  const handleShare = async () => {
    try {
      if (customData) {
        await share(customData);
      } else if (postId && title) {
        await sharePost({
          id: postId,
          title,
          description,
          imageUrl,
          author,
        });
      } else {
        message.error('Missing required data for sharing');
      }
    } catch (err) {
      console.error('Share error:', err);
    }
  };

  // For plain variant, render as plain button
  if (variant === 'plain') {
    return (
      <button
        onClick={handleShare}
        disabled={isLoading}
        className={className}
      >
        {iconType === 'lucide' ? (
          <Share2 className="w-5 h-5" />
        ) : (
          <ShareAltOutlined className="text-lg" />
        )}
        {showText && <span>{isLoading ? 'Sharing...' : 'Share'}</span>}
        {showCount && count > 0 && <span>{formatNumber(count)}</span>}
      </button>
    );
  }

  // For Ant Design button variants (includes count display)
  return (
    <button
      onClick={handleShare}
      disabled={isLoading}
      className={className}
    >
      {iconType === 'lucide' ? (
        <Share2 className="w-5 h-5" />
      ) : (
        <ShareAltOutlined />
      )}
      {showText && (
        <span style={{ marginLeft: '8px' }}>
          {isLoading ? 'Sharing...' : 'Share'}
        </span>
      )}
      {showCount && count > 0 && <span>{formatNumber(count)}</span>}
    </button>
  );
};

export default ShareButton;
