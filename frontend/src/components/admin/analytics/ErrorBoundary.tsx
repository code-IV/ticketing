import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card } from '@/components/ui/Card';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export class AnalyticsErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    
    // Log error for debugging
    console.error('Analytics Error Boundary caught an error:', error, errorInfo);
    
    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              
              <h1 className="text-xl font-bold text-gray-900 mb-2">Analytics Error</h1>
              <p className="text-gray-600 mb-4">
                Something went wrong while loading the analytics dashboard.
              </p>
              
              {this.state.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-left">
                  <p className="text-sm font-medium text-red-800 mb-2">Error Details:</p>
                  <p className="text-xs text-red-700 font-mono">
                    {this.state.error.message}
                  </p>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={this.handleRetry}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </button>
                
                <button
                  onClick={() => window.location.href = '/admin'}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Back to Admin
                </button>
              </div>
              
              <div className="mt-6 text-xs text-gray-500">
                <p>If this problem persists, please contact the development team.</p>
                <p className="mt-1">Error ID: {Date.now().toString(36)}</p>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for using error boundary in functional components
export function useAnalyticsErrorBoundary() {
  return {
    handleError: (error: Error, errorInfo: ErrorInfo) => {
      console.error('Analytics Error:', error, errorInfo);
      
      // In a real app, you might send this to an error reporting service
      // reportError(error, errorInfo);
    }
  };
}
