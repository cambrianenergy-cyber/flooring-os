"use client";
import React from "react";

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: any }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    // Optionally log error
    // logErrorToService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center text-red-700 bg-red-50 border border-red-200 rounded">
          <div className="text-2xl font-bold mb-2">Something went wrong.</div>
          <div className="mb-2">
            {this.state.error?.message || "An unexpected error occurred."}
          </div>
          <button
            className="mt-4 px-4 py-2 bg-red-600 text-background rounded"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
