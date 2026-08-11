import type { ReactNode } from 'react';
import { cv } from '../../theme/cssVars';
import { Box, Typography } from '@mui/material';

interface SettingsSectionCardProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}

export function SettingsSectionCard({ title, description, action, children }: SettingsSectionCardProps) {
  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: description ? 0.5 : 1.5 }}>
        <Box>
          <Typography
            sx={{
              fontSize: '1.125rem',
              fontWeight: 600,
              color: cv.textPrimary,
              letterSpacing: '-0.01em',
            }}
          >
            {title}
          </Typography>
          {description ? (
            <Typography sx={{ mt: 0.5, mb: 1.5, fontSize: '0.875rem', color: cv.textSecondary }}>
              {description}
            </Typography>
          ) : null}
        </Box>
        {action ? <Box sx={{ flexShrink: 0, mb: description ? 1.5 : 0 }}>{action}</Box> : null}
      </Box>
      <Box
        sx={{
          borderRadius: '12px',
          border: `1px solid ${cv.border}`,
          backgroundColor: cv.surfaceMuted,
          overflow: 'hidden',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

interface SettingsRowProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children?: ReactNode;
  showDivider?: boolean;
}

export function SettingsRow({
  title,
  description,
  action,
  children,
  showDivider = true,
}: SettingsRowProps) {
  return (
    <Box
      sx={{
        px: 2,
        py: 1.75,
        display: 'flex',
        alignItems: children ? 'flex-start' : 'center',
        justifyContent: 'space-between',
        gap: 2,
        flexWrap: 'wrap',
        ...(showDivider
          ? { borderBottom: `1px solid ${cv.dividerSubtle}` }
          : {}),
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: '0.9375rem', fontWeight: 500, color: cv.textPrimary }}>
          {title}
        </Typography>
        {description ? (
          <Typography sx={{ mt: 0.35, fontSize: '0.8125rem', color: cv.textSecondary, lineHeight: 1.5 }}>
            {description}
          </Typography>
        ) : null}
        {children}
      </Box>
      {action ? <Box sx={{ flexShrink: 0 }}>{action}</Box> : null}
    </Box>
  );
}
