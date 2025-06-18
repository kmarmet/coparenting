import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = {hasError: false, error: null}
  }

  static getDerivedStateFromError(error) {
    return {hasError: true, error}
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught an error:', error, info)
    // Optionally log to an error reporting service here
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ? this.props.fallback : <div>Something went wrong.</div>
    }

    return this.props.children
  }
}

export default ErrorBoundary