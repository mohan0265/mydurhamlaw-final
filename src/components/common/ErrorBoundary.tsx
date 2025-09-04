"use client";
import React from "react";

type State = { hasError: boolean; error?: any };
export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError(error: any) { return { hasError: true, error }; }
  componentDidCatch(error: any, info: any) { console.error("ErrorBoundary", error, info); }
  render() {
    if (this.state.hasError) { return <div className="p-4 text-sm text-red-600">Widget failed to load.</div>; }
    return this.props.children;
  }
}
