import { Box, Typography } from '@mui/material';
import { cv } from '../../theme/cssVars';
import type { StorageBreakdownSegment } from '../../data/mockSettingsData';

interface StorageChartSegment extends StorageBreakdownSegment {
  percent: number;
  startAngle: number;
  endAngle: number;
}

interface StorageConsumptionChartProps {
  usedLabel: string;
  capLabel: string;
  usedPercent: number;
  breakdown: StorageBreakdownSegment[];
  capBytes: number;
  compact?: boolean;
  warningLevel?: 'ok' | 'warning' | 'exceeded';
}

const CHART_SIZE_DEFAULT = 220;
const CHART_SIZE_COMPACT = 188;
const OUTER_RADIUS_RATIO = 96 / 220;
const INNER_RADIUS_RATIO = 62 / 220;

function polarToCartesian(cx: number, cy: number, radius: number, angleDegrees: number) {
  const angleRadians = ((angleDegrees - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleRadians),
    y: cy + radius * Math.sin(angleRadians),
  };
}

function describeDonutSegment(
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number,
) {
  const startOuter = polarToCartesian(cx, cy, outerRadius, startAngle);
  const endOuter = polarToCartesian(cx, cy, outerRadius, endAngle);
  const startInner = polarToCartesian(cx, cy, innerRadius, endAngle);
  const endInner = polarToCartesian(cx, cy, innerRadius, startAngle);
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${endOuter.x} ${endOuter.y}`,
    `L ${startInner.x} ${startInner.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${endInner.x} ${endInner.y}`,
    'Z',
  ].join(' ');
}

function buildSegments(breakdown: StorageBreakdownSegment[], capBytes: number): StorageChartSegment[] {
  const usedBytes = breakdown.reduce((sum, segment) => sum + segment.valueBytes, 0);
  const availableBytes = Math.max(capBytes - usedBytes, 0);
  const totalBytes = usedBytes + availableBytes;

  const segments: Array<StorageBreakdownSegment & { valueBytes: number }> = [
    ...breakdown,
    {
      id: 'available',
      label: 'Available',
      valueLabel: capLabelFromBytes(availableBytes),
      valueBytes: availableBytes,
      color: cv.surfaceRaised,
    },
  ];

  let cursor = 0;

  return segments.map((segment) => {
    const percent = totalBytes > 0 ? (segment.valueBytes / totalBytes) * 100 : 0;
    const sweep = (percent / 100) * 360;
    const startAngle = cursor;
    const endAngle = cursor + sweep;
    cursor = endAngle;

    return {
      ...segment,
      percent,
      startAngle,
      endAngle,
    };
  });
}

function capLabelFromBytes(bytes: number) {
  if (bytes >= 1024 ** 4) return `${(bytes / 1024 ** 4).toFixed(1)} TB`;
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${Math.max(bytes / 1024, 0).toFixed(1)} KB`;
}

export default function StorageConsumptionChart({
  usedLabel,
  capLabel,
  usedPercent,
  breakdown,
  capBytes,
  compact = false,
  warningLevel = 'ok',
}: StorageConsumptionChartProps) {
  const chartSize = compact ? CHART_SIZE_COMPACT : CHART_SIZE_DEFAULT;
  const center = chartSize / 2;
  const outerRadius = chartSize * OUTER_RADIUS_RATIO;
  const innerRadius = chartSize * INNER_RADIUS_RATIO;
  const segments = buildSegments(breakdown, capBytes);
  const chartDescription = segments
    .map((segment) => `${segment.label}: ${segment.valueLabel} (${segment.percent.toFixed(1)}%)`)
    .join(', ');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, width: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'center', sm: 'flex-start' },
          gap: { xs: 1.5, sm: 2 },
          width: '100%',
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: chartSize,
            height: chartSize,
            flexShrink: 0,
          }}
        >
          <Box
            component="svg"
            width={chartSize}
            height={chartSize}
            viewBox={`0 0 ${chartSize} ${chartSize}`}
            role="img"
            aria-label={`Storage consumption chart. ${chartDescription}`}
            sx={{ display: 'block' }}
          >
            {segments.map((segment) => {
              if (segment.percent <= 0) return null;

              const path = describeDonutSegment(
                center,
                center,
                innerRadius,
                outerRadius,
                segment.startAngle,
                Math.max(segment.endAngle, segment.startAngle + 0.35),
              );

              return (
                <path
                  key={segment.id}
                  d={path}
                  fill={segment.color}
                  stroke={cv.surfaceMuted}
                  strokeWidth={segment.id === 'available' ? 1 : 0.5}
                />
              );
            })}
          </Box>

          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              px: 1.5,
              pointerEvents: 'none',
            }}
          >
            <Typography
              sx={{
                fontSize: compact ? '1rem' : '1.125rem',
                fontWeight: 700,
                color: cv.textPrimary,
                lineHeight: 1.2,
              }}
            >
              {usedLabel}
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted, mt: 0.35 }}>
              used
            </Typography>
            <Typography
              sx={{
                mt: 0.75,
                fontSize: '0.6875rem',
                fontWeight: 600,
                color: warningLevel === 'exceeded' ? cv.errorText : warningLevel === 'warning' ? cv.warning : cv.brandPurple,
              }}
            >
              {usedPercent < 1 ? usedPercent.toFixed(1) : Math.round(usedPercent)}%
            </Typography>
          </Box>
        </Box>

        <Box sx={{ flex: 1, minWidth: 0, width: '100%' }}>
          <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: cv.textPrimary, mb: 1 }}>
            Breakdown
          </Typography>
          <Box sx={{ display: 'grid', gap: 0.75 }}>
            {segments.map((segment) => (
              <Box
                key={segment.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1,
                  px: 1,
                  py: 0.7,
                  borderRadius: '10px',
                  border: `1px solid ${cv.border}`,
                  backgroundColor: segment.id === 'available' ? cv.surface : cv.elevatedSurface,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
                  <Box
                    aria-hidden
                    sx={{
                      width: 9,
                      height: 9,
                      borderRadius: '50%',
                      backgroundColor: segment.color,
                      border: segment.id === 'available' ? `1px solid ${cv.border}` : 'none',
                      flexShrink: 0,
                    }}
                  />
                  <Typography sx={{ fontSize: '0.8125rem', color: cv.textPrimary, fontWeight: 500 }}>
                    {segment.label}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                  <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: cv.textPrimary }}>
                    {segment.valueLabel}
                  </Typography>
                  <Typography sx={{ fontSize: '0.6875rem', color: cv.textMuted }}>
                    {segment.percent < 0.1 && segment.percent > 0
                      ? '<0.1%'
                      : `${segment.percent.toFixed(segment.percent < 10 ? 1 : 0)}%`}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          px: 1.25,
          py: 1,
          borderRadius: '10px',
          background: cv.purpleSelectionSoft,
          border: `1px solid ${cv.purpleSelectionBorder}`,
        }}
      >
        <Typography sx={{ fontSize: '0.75rem', color: cv.textSecondary, lineHeight: 1.5 }}>
          Plan cap: <strong>{capLabel}</strong>. Storage usage is measured against your network threshold.
        </Typography>
      </Box>
    </Box>
  );
}
