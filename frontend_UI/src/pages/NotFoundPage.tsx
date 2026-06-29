import { Box, Button, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { cv } from '../theme/cssVars';

export default function NotFoundPage() {
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
      <Box
        sx={{
          maxWidth: 480,
          width: '100%',
          py: 8,
          px: 3,
          textAlign: 'center',
          color: cv.textMuted,
          borderRadius: '16px',
          border: `1px dashed var(--noah-border)`,
        }}
      >
        <Typography variant="body1" sx={{ mb: 0.5, color: cv.textPrimary, fontWeight: 600 }}>
          Page not found
        </Typography>
        <Typography variant="body2" sx={{ fontSize: '0.875rem', mb: 2.5 }}>
          The page you requested does not exist or may have been moved.
        </Typography>
        <Button
          component={RouterLink}
          to="/home"
          variant="contained"
          sx={{
            textTransform: 'none',
            borderRadius: '10px',
            background: cv.brandGradient,
            boxShadow: 'none',
          }}
        >
          Go to dashboard
        </Button>
      </Box>
    </Box>
  );
}
