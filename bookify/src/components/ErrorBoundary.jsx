import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error, info) {
    console.error('Bookify crashed while rendering:', error, info.componentStack)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <main className="auth-loading">
        <div>
          <p>Something went wrong while showing this page.</p>
          <button className="primary-button" onClick={() => window.location.reload()}>Reload Bookify</button>
        </div>
      </main>
    )
  }
}
