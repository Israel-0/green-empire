import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: string | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: error.message + '\n' + error.stack };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-grow-darker flex items-center justify-center p-8">
          <div className="card-grow p-6 max-w-lg">
            <h2 className="text-grow-red text-xl font-bold mb-4">Error</h2>
            <pre className="text-grow-muted text-xs whitespace-pre-wrap overflow-auto max-h-96">
              {this.state.error}
            </pre>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="btn-primary mt-4"
            >
              Reintentar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
