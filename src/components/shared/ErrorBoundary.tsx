'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button, Result } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo)
    this.setState({
      error,
      errorInfo,
    })

    // Log to external service if needed
    if (typeof window !== 'undefined') {
      // You can integrate with error tracking services here
      console.error('Component Stack:', errorInfo.componentStack)
      
      // Check if we're in a webview and notify the native app
      try {
        if ((window as any).ReactNativeWebView) {
          (window as any).ReactNativeWebView.postMessage(JSON.stringify({
            type: 'ERROR',
            error: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
          }))
        }
      } catch (e) {
        console.error('Failed to send error to native app:', e)
      }
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
    
    // Reload the page to reset the app state
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full">
            <Result
              status="error"
              title="Something went wrong"
              subTitle="We're sorry, but something unexpected happened. Please try refreshing the page."
              extra={[
                <Button
                  key="reload"
                  type="primary"
                  icon={<ReloadOutlined />}
                  onClick={this.handleReset}
                  size="large"
                >
                  Reload Page
                </Button>,
              ]}
            />
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 p-4 bg-white rounded-lg border border-red-200">
                <summary className="cursor-pointer text-red-600 font-medium mb-2">
                  Error Details (Development Only)
                </summary>
                <pre className="text-xs overflow-auto bg-gray-50 p-2 rounded">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
