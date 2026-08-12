import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { cv } from '../../theme/cssVars';

interface RouteErrorBoundaryProps {
  children: ReactNode;
}

interface RouteErrorBoundaryState {
  hasError: boolean;
  errorMessage: string | null;
}

export default class RouteErrorBoundary extends Component<
  RouteErrorBoundaryProps,
  RouteErrorBoundaryState
> {
  state: RouteErrorBoundaryState = { hasError: false, errorMessage: null };

  static getDerivedStateFromError(error: Error): RouteErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'Unknown render error',
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Route render error', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, errorMessage: null });
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 3,
          backgroundColor: cv.bg,
        }}
      >
        <Box sx={{ maxWidth: 420, textAlign: 'center' }}>
          <Typography sx={{ fontSize: '1.125rem', fontWeight: 600, color: cv.textPrimary, mb: 1 }}>
            Something went wrong
          </Typography>
          <Typography sx={{ fontSize: '0.875rem', color: cv.textSecondary, mb: 1.5 }}>
            This section encountered an unexpected error. Reload to continue.
          </Typography>
          {this.state.errorMessage ? (
            <Typography
              sx={{
                fontSize: '0.75rem',
                color: cv.textMuted,
                mb: 2.5,
                wordBreak: 'break-word',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              }}
            >
              {this.state.errorMessage}
            </Typography>
          ) : null}
          <Button
            variant="contained"
            onClick={this.handleRetry}
            sx={{
              textTransform: 'none',
              borderRadius: '10px',
              background: cv.brandGradient,
              boxShadow: 'none',
            }}
          >
            Reload page
          </Button>
        </Box>
      </Box>
    );
  }
}
