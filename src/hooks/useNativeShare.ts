import { useState, useCallback, useEffect } from 'react';
import {
  detectNativeApp,
  shareNatively,
  sharePageNatively,
  getPagePreview,
  extractHashtags,
  NativeShareData,
  DetectionResult,
  waitForNativeBridge,
} from '@/lib/native-share-bridge';

interface UseNativeShareOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  autoDetect?: boolean;
}

export const useNativeShare = (options: UseNativeShareOptions = {}) => {
  const [isNativeApp, setIsNativeApp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [detection, setDetection] = useState<DetectionResult | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Detect native app on mount
  useEffect(() => {
    if (options.autoDetect !== false) {
      const result = detectNativeApp();
      setDetection(result);
      setIsNativeApp(result.isNativeApp);

      if (result.isNativeApp) {
        waitForNativeBridge().then(() => {
          console.log('Native bridge is ready!');
        });
      }
    }
  }, [options.autoDetect]);

  /**
   * Share custom data
   */
  const share = useCallback(
    async (data: NativeShareData) => {
      try {
        setIsLoading(true);
        setError(null);

        const success = await shareNatively(data);

        if (success) {
          options.onSuccess?.();
        } else {
          throw new Error('Share cancelled or not supported');
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options.onError?.(error);
      } finally {
        setIsLoading(false);
      }
    },
    [options]
  );

  /**
   * Share current page with auto-extracted data
   */
  const sharePage = useCallback(
    async (overrides?: Partial<NativeShareData>) => {
      try {
        setIsLoading(true);
        setError(null);

        const success = await sharePageNatively(overrides);

        if (success) {
          options.onSuccess?.();
        } else {
          throw new Error('Share cancelled or not supported');
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options.onError?.(error);
      } finally {
        setIsLoading(false);
      }
    },
    [options]
  );

  /**
   * Share a specific post
   */
  const sharePost = useCallback(
    async (postData: {
      id: string;
      title: string;
      description?: string;
      imageUrl?: string;
      author?: string;
    }) => {
      const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/post/${postData.id}`;

      // Create short snippet (max 100 characters)
      const shortDescription = postData.description 
        ? postData.description.substring(0, 100) + (postData.description.length > 100 ? '...' : '')
        : postData.title;

      // Format share message with app download CTA
      const shareMessage = `${postData.title}\n\n${shortDescription}\n\n📰 Read the full story on Bansgaon Sandesh\n🔗 ${url}\n\n📱 Download our app:\nhttps://play.google.com/store/apps/details?id=com.bansgaonsandesh.app`;

      return share({
        title: postData.title,
        text: shareMessage,
        url,
        imageUrl: postData.imageUrl,
        description: shortDescription,
        hashtags: ['#BansgaonSandesh', '#News'],
      });
    },
    [share]
  );

  /**
   * Get current page preview
   */
  const getPreview = useCallback(() => {
    return getPagePreview();
  }, []);

  /**
   * Get hashtags for current page
   */
  const getHashtags = useCallback(() => {
    return extractHashtags();
  }, []);

  return {
    isNativeApp,
    isLoading,
    error,
    detection,
    share,
    sharePage,
    sharePost,
    getPreview,
    getHashtags,
  };
};

export default useNativeShare;
