import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center space-y-5">

            <div className="flex justify-center">
              <div className="p-4 rounded-2xl bg-red-900/30 border border-red-700/40">
                <AlertTriangle className="w-10 h-10 text-red-400" />
              </div>
            </div>

            <div>
              <h1 className="text-white text-lg font-semibold mb-2">Something went wrong</h1>
              <p className="text-[#7e7b99] text-sm leading-relaxed">
                {this.props.fallbackMessage ||
                  "An unexpected error occurred. This has been noted. Try refreshing or going back to the dashboard."}
              </p>
              {this.state.error && (
                <p className="mt-3 text-[11px] font-mono text-red-400/70 bg-[#1a0f0f] border border-red-900/40 rounded-lg px-3 py-2 text-left break-words">
                  {this.state.error.message}
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 px-5 py-2.5 bg-purple-700 hover:bg-purple-600 text-white text-sm font-semibold rounded-xl transition-colors w-full sm:w-auto justify-center"
              >
                <RotateCcw className="w-4 h-4" />
                Try Again
              </button>
              <a
                href="/sections/new_startups"
                className="flex items-center gap-2 px-5 py-2.5 bg-[#181623] border border-[#29253b] hover:border-[#3b3754] text-[#a19dbf] hover:text-white text-sm font-medium rounded-xl transition-colors w-full sm:w-auto justify-center"
              >
                <Home className="w-4 h-4" />
                Go to Dashboard
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
