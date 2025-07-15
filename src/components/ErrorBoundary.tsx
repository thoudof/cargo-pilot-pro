import React, { Component, ReactNode } from 'react';
import { clearBrowserCache } from '@/utils/performance';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  handleClearCache = () => {
    clearBrowserCache();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center p-6 max-w-md">
            <div className="mb-4">
              <h1 className="text-2xl font-bold text-destructive mb-2">
                Произошла ошибка
              </h1>
              <p className="text-muted-foreground">
                Что-то пошло не так. Попробуйте перезагрузить страницу или очистить кэш.
              </p>
            </div>
            
            {this.state.error && (
              <div className="mb-4 p-3 bg-destructive/10 rounded text-sm text-left">
                <pre className="whitespace-pre-wrap break-words">
                  {this.state.error.message}
                </pre>
              </div>
            )}
            
            <div className="space-y-2">
              <button
                onClick={this.handleReset}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                Попробовать снова
              </button>
              
              <button
                onClick={this.handleClearCache}
                className="w-full px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90"
              >
                Очистить кэш и перезагрузить
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}