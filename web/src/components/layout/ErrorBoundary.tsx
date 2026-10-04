"use client";
import React from "react";

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error?: Error }> {
  constructor(props: { children: React.ReactNode }) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return <div className="p-8 text-center"><p className="text-sm text-[var(--text-secondary)]">Something went wrong. Please refresh.</p><p className="font-mono text-xs mt-2">{this.state.error?.message}</p></div>;
    }
    return this.props.children;
  }
}
