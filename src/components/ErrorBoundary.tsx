import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Application boundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#EDF1F2] text-[#0B2228] flex items-center justify-center p-6">
          <div className="neu-raised rounded-3xl max-w-md w-full p-8 text-center space-y-4">
            <p className="text-xs font-medium text-[#0B5563]">Ajentir Ventures</p>
            <h1 className="font-display text-2xl font-semibold tracking-[-0.025em]">
              Something went wrong
            </h1>
            <p className="text-sm text-[#43585D] leading-relaxed">
              We encountered an unexpected error while loading this view. Please reload to continue.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-6 py-3 text-xs font-semibold text-white neu-btn-teal rounded-xl cursor-pointer"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
