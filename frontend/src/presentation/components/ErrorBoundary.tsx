import React from 'react'

interface State { hasError: boolean; error?: Error }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
          <p className="text-lg font-semibold text-white mb-2">Une erreur est survenue</p>
          <p className="text-sm text-muted-foreground mb-6">{this.state.error?.message}</p>
          <button
            onClick={() => { this.setState({ hasError: false }); window.location.href = '/dashboard' }}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm transition-all"
          >
            Recharger
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
