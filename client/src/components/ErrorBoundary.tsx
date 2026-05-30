import React from 'react';

interface State { hasError: boolean; error: Error | null; }

export default class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div style={{ minHeight:'100dvh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24, background:'var(--bg-deep)', color:'var(--t1)', textAlign:'center' }}>
        <div style={{ fontSize:40, marginBottom:16 }}>⚠️</div>
        <h2 style={{ fontSize:20, fontWeight:800, marginBottom:8, letterSpacing:'-0.02em' }}>Something went wrong</h2>
        <p style={{ fontSize:13, color:'var(--t3)', maxWidth:280, lineHeight:1.6, marginBottom:24 }}>
          {this.state.error?.message || 'An unexpected error occurred.'}
        </p>
        <button className="btn-primary" onClick={() => window.location.reload()}>Reload App</button>
      </div>
    );
  }
}
