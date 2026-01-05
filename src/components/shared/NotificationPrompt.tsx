'use client';

import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { requestNotificationPermission, saveFCMToken, onMessageListener, showNotification } from '@/lib/notifications';

interface NotificationPromptProps {
  userId?: string;
}

export default function NotificationPrompt({ userId }: NotificationPromptProps) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if user has already dismissed or granted permission
    const dismissed = localStorage.getItem('notification-prompt-dismissed');
    const permission = typeof window !== 'undefined' ? Notification.permission : 'default';

    if (!dismissed && permission === 'default' && userId) {
      // Show prompt after 5 seconds
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [userId]);

  // Listen for foreground messages
  useEffect(() => {
    if (userId) {
      onMessageListener()
        .then((payload: any) => {
          console.log('Notification received:', payload);
          showNotification(
            payload.notification?.title || 'New Post',
            payload.notification?.body || 'Someone posted new content',
            payload.data?.url
          );
        })
        .catch((err) => console.error('Failed to listen for messages:', err));
    }
  }, [userId]);

  const handleEnable = async () => {
    setIsLoading(true);
    try {
      const token = await requestNotificationPermission();
      
      if (token && userId) {
        // Save token to database
        await saveFCMToken(userId, token);
        setShowPrompt(false);
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('notification-prompt-dismissed', 'true');
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm bg-white rounded-lg shadow-lg border border-gray-200 p-4">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
      >
        <X size={18} />
      </button>

      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Bell className="text-blue-600" size={20} />
          </div>
        </div>

        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">
            Stay Updated!
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            Get notified when new posts are shared in your city
          </p>

          <div className="flex space-x-2">
            <button
              onClick={handleEnable}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Enabling...' : 'Enable'}
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 text-gray-600 text-sm font-medium hover:bg-gray-100 rounded-lg transition-colors"
            >
              Not Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
