import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    // A simple way to reset state is to reload the page.
    // For more complex apps, this could dispatch a "reset state" action.
    window.location.reload();
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-screen h-screen bg-canvas-bg flex flex-col items-center justify-center text-text-primary p-8">
            <div className="aurora-background fixed top-0 left-0 w-full h-full" />
            <div className="relative z-10 flex flex-col items-center justify-center p-8 rounded-xl bg-sidebar-bg glass-pane border border-border-color text-center max-w-lg">
                <AlertTriangle className="text-red-500 w-16 h-16 mb-4" />
                <h1 className="text-2xl font-bold mb-2">Something went wrong.</h1>
                <p className="text-text-secondary mb-6">
                    A critical error occurred, which has prevented the application from running correctly.
                    You can try refreshing the page to resolve the issue.
                </p>
                <button
                    onClick={this.handleReset}
                    className="flex items-center gap-2 px-4 py-2 rounded-md bg-accent hover:bg-accent-hover text-white transition-colors"
                >
                    <RefreshCw size={18} />
                    Refresh Application
                </button>
            </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
