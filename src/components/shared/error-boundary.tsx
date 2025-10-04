'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: (error: Error, reset: () => void) => ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

class ErrorBoundaryImpl extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary captured an error', error, info)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset)
      }
      return (
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-red-200 bg-red-50 p-6 text-red-900">
          <div className="text-center">
            <h2 className="text-lg font-semibold">Ha ocurrido un error</h2>
            <p className="text-sm text-red-800">{this.state.error.message}</p>
          </div>
          <Button variant="destructive" onClick={this.handleReset}>
            Reintentar
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}

export const ErrorBoundary = ({ children, fallback }: ErrorBoundaryProps) => (
  <ErrorBoundaryImpl fallback={fallback}>{children}</ErrorBoundaryImpl>
)
