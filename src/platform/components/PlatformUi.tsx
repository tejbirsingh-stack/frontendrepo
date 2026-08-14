import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Box, Chip, LinearProgress, Paper, Tooltip, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { cv } from '../../theme/cssVars';

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <Box
      sx={{
        mb: 3,
        display: 'flex',
        alignItems: { xs: 'flex-start', sm: 'flex-end' },
        justifyContent: 'space-between',
        gap: 2,
        flexWrap: 'wrap',
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            fontSize: { xs: '1.5rem', md: '1.75rem' },
            fontWeight: 700,
            letterSpacing: '-0.03em',
            lineHeight: 1.15,
          }}
        >
          {title}
        </Typography>
        {subtitle ? (
          <Typography sx={{ color: cv.textSecondary, mt: 0.75, fontSize: '0.9rem', maxWidth: 560 }}>
            {subtitle}
          </Typography>
        ) : null}
      </Box>
      {actions ? <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>{actions}</Box> : null}
    </Box>
  );
}

function InfoTip({ title }: { title: string }) {
  return (
    <Tooltip title={title} arrow placement="top" enterDelay={200}>
      <Box
        component="span"
        sx={{
          display: 'inline-flex',
          color: cv.textMuted,
          cursor: 'help',
          ml: 0.5,
          verticalAlign: 'middle',
          '&:hover': { color: cv.brandOrchid },
        }}
        aria-label={title}
      >
        <InfoOutlinedIcon sx={{ fontSize: 14 }} />
      </Box>
    </Tooltip>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = 'default',
  icon,
  tooltip,
  sparkline,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'brand';
  icon?: ReactNode;
  tooltip?: string;
  sparkline?: ReactNode;
}) {
  const accent =
    tone === 'success'
      ? cv.success
      : tone === 'warning'
        ? cv.warning
        : tone === 'danger'
          ? cv.destructive
          : tone === 'brand'
            ? cv.brandOrchid
            : cv.brandPurple;

  const card = (
    <Paper
      elevation={0}
      sx={{
        p: 2.25,
        borderRadius: '6px',
        border: `1px solid ${cv.border}`,
        background: `linear-gradient(165deg, ${cv.surfaceRaised} 0%, ${cv.surface} 55%)`,
        boxShadow: cv.cardShadow,
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        transition: 'border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: accent,
          opacity: 0.95,
        },
        '&:hover': {
          borderColor: cv.borderStrong,
          transform: 'translateY(-2px)',
          boxShadow: cv.brandShadowSoft,
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: '0.75rem',
              color: cv.textMuted,
              mb: 0.75,
              fontWeight: 600,
              letterSpacing: '0.02em',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            {label}
            {tooltip ? <InfoTip title={tooltip} /> : null}
          </Typography>
          <Typography sx={{ fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            {value}
          </Typography>
          {hint ? (
            <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted, mt: 0.85 }}>{hint}</Typography>
          ) : null}
        </Box>
        {icon ? (
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '6px',
              display: 'grid',
              placeItems: 'center',
              background: cv.purpleSurface,
              color: accent,
              border: `1px solid ${cv.purpleChipBorder}`,
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
        ) : null}
      </Box>
      {sparkline}
    </Paper>
  );

  return card;
}

export function Panel({
  children,
  title,
  subtitle,
  action,
  tooltip,
  sx,
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  tooltip?: string;
  sx?: Record<string, unknown>;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.25,
        borderRadius: '6px',
        border: `1px solid ${cv.border}`,
        background: cv.surface,
        boxShadow: cv.cardShadow,
        height: '100%',
        ...sx,
      }}
    >
      {title ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 1.5,
            mb: children ? 1.75 : 0,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontWeight: 600,
                fontSize: '0.95rem',
                letterSpacing: '-0.01em',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              {title}
              {tooltip ? <InfoTip title={tooltip} /> : null}
            </Typography>
            {subtitle ? (
              <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted, mt: 0.35 }}>
                {subtitle}
              </Typography>
            ) : null}
          </Box>
          {action}
        </Box>
      ) : null}
      {children}
    </Paper>
  );
}

export function StatusChip({
  status,
  label,
}: {
  status?: string | null;
  label?: string;
}) {
  const value = (label || status || 'unknown').toLowerCase();
  const tone =
    value.includes('active') || value.includes('resolved') || value.includes('success')
      ? { bg: cv.successSurface, color: cv.successText, border: cv.success }
      : value.includes('suspend') || value.includes('error') || value.includes('danger')
        ? { bg: cv.destructiveSurface, color: cv.destructive, border: cv.destructiveBorder }
        : value.includes('warn') || value.includes('open') || value.includes('quarantine')
          ? { bg: cv.warningSurface, color: cv.warning, border: cv.warning }
          : { bg: cv.purpleSurface, color: cv.textSecondary, border: cv.border };

  return (
    <Chip
      size="small"
      label={label || status || '—'}
      sx={{
        height: 24,
        fontSize: '0.7rem',
        fontWeight: 600,
        textTransform: 'capitalize',
        borderRadius: '6px',
        background: tone.bg,
        color: tone.color,
        border: `1px solid ${tone.border}`,
      }}
    />
  );
}

export function MetricBar({
  label,
  usedLabel,
  percent,
  tooltip,
}: {
  label: string;
  usedLabel: string;
  percent: number;
  tooltip?: string;
}) {
  const clamped = Math.max(0, Math.min(100, Number.isFinite(percent) ? percent : 0));
  const hot = clamped >= 85;
  const bar = (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mb: 0.75 }}>
        <Typography sx={{ fontSize: '0.8125rem', color: cv.textSecondary }}>{label}</Typography>
        <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600 }}>{usedLabel}</Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={clamped}
        sx={{
          height: 8,
          borderRadius: 999,
          background: cv.surfaceMuted,
          '& .MuiLinearProgress-bar': {
            borderRadius: 999,
            background: hot ? cv.destructive : cv.brandGradient,
          },
        }}
      />
    </Box>
  );

  if (!tooltip) return bar;
  return (
    <Tooltip title={tooltip} arrow placement="top">
      <Box>{bar}</Box>
    </Tooltip>
  );
}

export function QuickLinkCard({
  to,
  title,
  description,
  meta,
  icon,
}: {
  to: string;
  title: string;
  description: string;
  meta?: string;
  icon?: ReactNode;
}) {
  return (
    <Box
      component={RouterLink}
      to={to}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        p: 2,
        borderRadius: '6px',
        border: `1px solid ${cv.border}`,
        background: cv.surface,
        boxShadow: cv.cardShadow,
        textDecoration: 'none',
        color: cv.textPrimary,
        minHeight: 132,
        transition: 'border-color 0.15s ease, background 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease',
        '&:hover': {
          borderColor: cv.brandOrchid,
          background: cv.purpleSurface,
          transform: 'translateY(-2px)',
          boxShadow: cv.brandShadowSoft,
        },
        '&:focus-visible': {
          outline: `2px solid ${cv.brandOrchid}`,
          outlineOffset: 2,
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1 }}>
        {icon ? (
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: '6px',
              display: 'grid',
              placeItems: 'center',
              background: cv.purpleSurface,
              color: cv.brandOrchid,
              border: `1px solid ${cv.purpleChipBorder}`,
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
        ) : null}
        <Typography sx={{ fontWeight: 600, fontSize: '0.9375rem' }}>{title}</Typography>
      </Box>
      <Typography sx={{ fontSize: '0.8125rem', color: cv.textSecondary, flex: 1, mb: meta ? 1.25 : 0 }}>
        {description}
      </Typography>
      {meta ? (
        <Typography sx={{ fontSize: '0.75rem', color: cv.brandOrchid, fontWeight: 600 }}>
          {meta}
        </Typography>
      ) : null}
    </Box>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <Box
      sx={{
        py: 3,
        px: 1,
        textAlign: 'center',
        borderRadius: '6px',
        border: `1px dashed ${cv.border}`,
        background: cv.surfaceMuted,
      }}
    >
      <Typography sx={{ color: cv.textMuted, fontSize: '0.875rem' }}>{message}</Typography>
    </Box>
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

export function formatPercent(used?: string | number, quota?: string | number): number {
  const u = Number(used || 0);
  const q = Number(quota || 0);
  if (!q || !Number.isFinite(u) || !Number.isFinite(q)) return 0;
  return Math.round((u / q) * 1000) / 10;
}

export function formatMoneyCents(cents?: number | null): string {
  const n = Number(cents || 0) / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}
