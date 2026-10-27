import React, { Component, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { FinancialDataProvider } from './context/FinancialDataContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'

// Global Error Listeners
window.addEventListener('error', (event) => {
  console.error('[Global Window Error]', event.error || event.message)
  try {
    sessionStorage.setItem('GFI_CRASH_LOG', JSON.stringify({
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      stack: event.error?.stack
    }))
  } catch (e) {}
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('[Global Unhandled Rejection]', event.reason)
  try {
    sessionStorage.setItem('GFI_CRASH_REJECTION', String(event.reason))
  } catch (e) {}
})

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[React ErrorBoundary Caught Error]', error, errorInfo)
    this.setState({ error, errorInfo })
  }

  handleReset = () => {
    localStorage.removeItem('gfi_auth_user')
    localStorage.removeItem('gfi_auth_role')
    localStorage.removeItem('gfi_auth_token')
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#f6f8fa',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            maxWidth: '720px',
            width: '100%',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #d0d7de',
            padding: '24px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                backgroundColor: '#ffebe9',
                color: '#cf222e',
                borderRadius: '6px',
                padding: '8px 12px',
                fontWeight: 'bold',
                fontSize: '18px'
              }}>
                ⚠️
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#1f2328' }}>
                  Platform Interface Exception Detected
                </h2>
                <p style={{ margin: 0, fontSize: '12px', color: '#656d76' }}>
                  Karnataka Department of Higher Education • Financial Intelligence Platform
                </p>
              </div>
            </div>

            <div style={{
              backgroundColor: '#fff8c5',
              border: '1px solid #d4a72c',
              borderRadius: '6px',
              padding: '12px',
              fontSize: '13px',
              color: '#9a6700',
              marginBottom: '16px',
              fontFamily: 'monospace'
            }}>
              <strong>Error:</strong> {this.state.error?.message || 'Unknown render exception'}
            </div>

            {this.state.error?.stack && (
              <pre style={{
                backgroundColor: '#f6f8fa',
                border: '1px solid #d0d7de',
                borderRadius: '6px',
                padding: '12px',
                fontSize: '11px',
                color: '#1f2328',
                maxHeight: '220px',
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                marginBottom: '16px'
              }}>
                {this.state.error.stack}
              </pre>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid #0969da',
                  backgroundColor: '#ddf4ff',
                  color: '#0969da',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Try Again
              </button>
              <button
                onClick={() => {
                  window.location.href = window.location.origin + '/?refresh=' + Date.now()
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid #d0d7de',
                  backgroundColor: '#f6f8fa',
                  color: '#1f2328',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Reload Page
              </button>
              <button
                onClick={this.handleReset}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#0969da',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Clear Session & Re-login
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <FinancialDataProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </FinancialDataProvider>
    </ErrorBoundary>
  </StrictMode>,
)

