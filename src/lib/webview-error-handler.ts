/**
 * Global error handler for WebView integration
 * Catches and reports unhandled errors to the native app
 */

export const initWebViewErrorHandler = () => {
  // Only run in browser environment
  if (typeof window === 'undefined') {
    return;
  }

  // Global error handler
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error || event.message);

    // Report to native app if in webview
    try {
      if ((window as any).ReactNativeWebView) {
        (window as any).ReactNativeWebView.postMessage(JSON.stringify({
          type: 'ERROR',
          error: event.error?.message || event.message,
          stack: event.error?.stack || '',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        }));
      }
    } catch (e) {
      console.error('Failed to send error to native app:', e);
    }

    // Prevent default behavior in production (shows error page)
    if (process.env.NODE_ENV === 'production') {
      event.preventDefault();
      return true;
    }
  });

  // Unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);

    // Report to native app if in webview
    try {
      if ((window as any).ReactNativeWebView) {
        (window as any).ReactNativeWebView.postMessage(JSON.stringify({
          type: 'UNHANDLED_REJECTION',
          error: event.reason?.message || String(event.reason),
          stack: event.reason?.stack || '',
        }));
      }
    } catch (e) {
      console.error('Failed to send rejection to native app:', e);
    }

    // Prevent default behavior in production
    if (process.env.NODE_ENV === 'production') {
      event.preventDefault();
      return true;
    }
  });

  // Check if we're in a webview
  const isWebView = !!(
    (window as any).ReactNativeWebView ||
    (window as any).nativeShare ||
    (window as any).openPost
  );

  if (isWebView) {
    console.log('🌐 WebView error handler initialized');
    
    // Notify native app that error handler is ready
    try {
      (window as any).ReactNativeWebView?.postMessage(JSON.stringify({
        type: 'ERROR_HANDLER_READY',
      }));
    } catch (e) {
      // Ignore
    }
  }
};

/**
 * Safe wrapper for async operations in webview
 * Catches errors and prevents crashes
 */
export const safeWebViewCall = async <T>(
  fn: () => Promise<T>,
  fallback?: T
): Promise<T | undefined> => {
  try {
    return await fn();
  } catch (error) {
    console.error('Safe webview call failed:', error);
    
    // Report to native app
    if (typeof window !== 'undefined' && (window as any).ReactNativeWebView) {
      try {
        (window as any).ReactNativeWebView.postMessage(JSON.stringify({
          type: 'SAFE_CALL_ERROR',
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : '',
        }));
      } catch (e) {
        // Ignore
      }
    }

    return fallback;
  }
};

/**
 * Check if running in webview
 */
export const isInWebView = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  return !!(
    (window as any).ReactNativeWebView ||
    (window as any).nativeShare ||
    (window as any).openPost
  );
};

export default initWebViewErrorHandler;
