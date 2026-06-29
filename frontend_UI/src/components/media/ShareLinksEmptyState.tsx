import { Box, Button, Typography } from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import { cv } from '../../theme/cssVars';

interface ShareLinksEmptyStateProps {
  onNewShareLink?: () => void;
}

function ShareLinksEmptyIllustration() {
  return (
    <Box
      aria-hidden
      sx={{
        width: 168,
        height: 132,
        position: 'relative',
        mx: 'auto',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          borderRadius: '20px',
          border: `1px dashed ${cv.border}`,
          backgroundColor: cv.surfaceSubtle,
        }}
      />
      <Box
        component="svg"
        viewBox="0 0 168 132"
        sx={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
        }}
      >
        <rect x="34" y="28" width="100" height="76" rx="14" fill={cv.panelTint} stroke={cv.border} />
        <path
          d="M52 52h64M52 66h44M52 80h28"
          stroke={cv.textMuted}
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.55"
        />
        <circle cx="118" cy="44" r="18" fill={cv.purpleSelectionSoft} stroke={cv.purpleSelectionBorder} />
        <path
          d="M110 44h16M118 36v16"
          stroke={cv.brandPurple}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M44 96c10-8 22-8 32 0s22 8 32 0"
          stroke={cv.purpleSelectionStrong}
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.7"
        />
      </Box>
    </Box>
  );
}

export default function ShareLinksEmptyState({ onNewShareLink }: ShareLinksEmptyStateProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        px: 3,
        py: { xs: 4, md: 5 },
        minHeight: { md: 320 },
        textAlign: 'center',
      }}
    >
      <ShareLinksEmptyIllustration />
      <Typography
        sx={{
          mt: 2.5,
          fontWeight: 600,
          fontSize: '1.0625rem',
          color: cv.textPrimary,
        }}
      >
        No share links yet
      </Typography>
      <Typography
        sx={{
          mt: 0.75,
          mb: 2.5,
          maxWidth: 360,
          fontSize: '0.875rem',
          color: cv.textSecondary,
          lineHeight: 1.55,
        }}
      >
        Create a share link to invite people or let anyone with the link view this project.
      </Typography>
      <Button
        type="button"
        variant="contained"
        startIcon={<AddOutlinedIcon />}
        onClick={onNewShareLink}
        sx={{
          borderRadius: '10px',
          py: 1.1,
          px: 2.5,
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.9375rem',
          background: cv.brandGradient,
          boxShadow: cv.brandShadowStrong,
          '&:hover': {
            background: cv.brandGradient,
            filter: 'brightness(1.08)',
          },
        }}
      >
        New Share Link
      </Button>
    </Box>
  );
}
