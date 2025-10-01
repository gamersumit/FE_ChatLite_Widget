import { Component, type ErrorInfo, type ReactNode } from 'react';
import StaticBackground from './StaticBackground';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error Boundary specifically for widget components
 * Prevents widget crashes from affecting the parent page
 */
class WidgetErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Widget Error Boundary caught an error:', error, errorInfo);

    // In production, you might want to log this to an error reporting service
    // but avoid exposing sensitive information
    if (process.env.NODE_ENV === 'production') {
      // Log to error service without sensitive data
      console.error('Widget crashed:', {
        message: error.message,
        name: error.name,
        stack: error.stack?.substring(0, 500) // Limit stack trace
      });
    }

    // Notify parent window if in embedded mode that widget encountered an error
    if (window.parent !== window) {
      try {
        window.parent.postMessage({
          type: 'widget-error',
          data: {
            message: 'Widget encountered an error',
            timestamp: new Date().toISOString()
          }
        }, '*');
      } catch (e) {
        console.warn('Failed to notify parent of widget error:', e);
      }
    }
  }

  public render() {
    if (this.state.hasError) {
      // Render fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <StaticBackground variant="solid" color="#f8fafc">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="bg-white rounded-lg shadow-md p-6 max-w-md text-center">
              <div className="text-red-500 text-4xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Chat Temporarily Unavailable
              </h3>
              <p className="text-gray-600 mb-4">
                We're experiencing a technical issue. Please refresh the page or try again later.
              </p>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: undefined });
                  window.location.reload();
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Reload Chat
              </button>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="text-sm text-gray-500 cursor-pointer">
                    Development Info
                  </summary>
                  <pre className="text-xs text-red-600 mt-2 overflow-auto">
                    {this.state.error.message}
                    {'\n'}
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </StaticBackground>
      );
    }

    return this.props.children;
  }
}

export default WidgetErrorBoundary;