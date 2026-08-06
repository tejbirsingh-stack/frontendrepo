import { Box, Paper, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { cv } from '../../theme/cssVars';

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
        {title}
      </Typography>
      {subtitle ? (
        <Typography sx={{ color: cv.textSecondary, mt: 0.5, fontSize: '0.9rem' }}>
          {subtitle}
        </Typography>
      ) : null}
    </Box>
  );
}

export function StatCard({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        border: `1px solid ${cv.border}`,
        background: cv.surface,
      }}
    >
      <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted, mb: 0.75 }}>{label}</Typography>
      <Typography sx={{ fontSize: '1.35rem', fontWeight: 700 }}>{value}</Typography>
    </Paper>
  );
}

export function Panel({ children }: { children: ReactNode }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        border: `1px solid ${cv.border}`,
        background: cv.surface,
      }}
    >
      {children}
    </Paper>
  );
}

export function formatBytes(value: string | number | bigint | undefined): string {
  const n = typeof value === 'bigint' ? Number(value) : Number(value || 0);
  if (!Number.isFinite(n) || n <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let v = n;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}
