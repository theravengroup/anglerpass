"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  /** Optional fallback to render instead of the default error UI */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Catches render errors in child components and shows a recovery UI.
 * Use around dashboard page content to prevent full-page white screens.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback;
    }

    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-red-50">
          <AlertTriangle className="size-6 text-red-500" />
        </div>
        <h3 className="mt-4 text-base font-medium text-text-primary">
          Something went wrong
        </h3>
        <p className="mt-1 max-w-sm text-sm text-text-secondary">
          An unexpected error occurred. Try refreshing the page.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => this.setState({ hasError: false })}
        >
          Try Again
        </Button>
      </div>
    );
  }
}
