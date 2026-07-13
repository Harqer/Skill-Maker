/// <reference types="vite/client" />
import React, { StrictMode, Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App.tsx';
import './index.css';

// Import your publishable key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  console.error("Missing Publishable Key");
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("React Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', color: 'white', backgroundColor: '#050505', minHeight: '100vh', fontFamily: 'monospace' }}>
          <h1 style={{ color: '#ff4444' }}>Something went wrong.</h1>
          <pre style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#111', borderRadius: '8px', overflowX: 'auto' }}>
            {this.state.error?.toString()}
          </pre>
          <p style={{ marginTop: '1rem', color: '#888' }}>Check the browser console for more details.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      {PUBLISHABLE_KEY ? (
        <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
          <App />
        </ClerkProvider>
      ) : (
        <div style={{ padding: '2rem', color: 'white', backgroundColor: '#050505', minHeight: '100vh', fontFamily: 'monospace' }}>
          <h1 style={{ color: '#ff4444' }}>Missing Clerk Configuration</h1>
          <p style={{ marginTop: '1rem' }}>
            The application cannot start because the Clerk Publishable Key is missing.
          </p>
          <p style={{ marginTop: '1rem', color: '#888' }}>
            Ensure <code>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> is set in your environment variables via Infisical or a <code>.env</code> file.
          </p>
        </div>
      )}
    </ErrorBoundary>
  </StrictMode>,
);
