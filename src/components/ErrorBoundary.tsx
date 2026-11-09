import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface State {
  error: Error | null;
}

/** Catches rendering errors of a page, so the rest of the app (top bar, navigation) keeps working. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Page crashed:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" className="error">
        <div>
          <strong>This page could not be displayed</strong>
          <p>{this.state.error.message}</p>
        </div>
        <Link className="btn btn-primary" to="/devices" onClick={() => this.setState({ error: null })}>
          Back to dashboard
        </Link>
      </div>
    );
  }
}
