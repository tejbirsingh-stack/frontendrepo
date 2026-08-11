import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  RadialBar,
  RadialBarChart,
  PolarAngleAxis,
} from 'recharts';
import { cv } from '../../theme/cssVars';
import { EmptyState } from './PlatformUi';

/** Solid fills for SVG charts (CSS vars are unreliable in SVG attributes). */
export const CHART_PALETTE = [
  '#d28cff',
  '#8e44ad',
  '#16a085',
  '#1abc9c',
  '#a569bd',
  '#06b6d4',
  '#f59e0b',
  '#f472b8',
] as const;

const tooltipShellSx = {
  background: cv.tooltipSurface,
  color: cv.tooltipText,
  border: `1px solid ${cv.border}`,
  borderRadius: '6px',
  boxShadow: cv.tooltipShadow,
  px: 1.25,
  py: 1,
  minWidth: 120,
} as const;

export function ChartTooltipFrame({
  label,
  children,
}: {
  label?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Box sx={tooltipShellSx}>
      {label ? (
        <Typography sx={{ fontSize: '0.7rem', color: cv.tooltipTextMuted, mb: 0.5, fontWeight: 600 }}>
          {label}
        </Typography>
      ) : null}
      {children}
    </Box>
  );
}

type TooltipPayloadItem = {
  name?: string;
  value?: number | string;
  color?: string;
  payload?: Record<string, unknown>;
};

function DefaultChartTooltip({
  active,
  payload,
  label,
  valueFormatter,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  valueFormatter?: (value: number | string, name?: string) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <ChartTooltipFrame label={label}>
      {payload.map((entry, idx) => {
        const raw = entry.value ?? 0;
        const display = valueFormatter
          ? valueFormatter(raw, entry.name)
          : String(raw);
        return (
          <Box
            key={`${entry.name}-${idx}`}
            sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.15 }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: entry.color || CHART_PALETTE[idx % CHART_PALETTE.length],
                flexShrink: 0,
              }}
            />
            <Typography sx={{ fontSize: '0.75rem', color: cv.tooltipTextMuted, flex: 1 }}>
              {entry.name}
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700 }}>{display}</Typography>
          </Box>
        );
      })}
    </ChartTooltipFrame>
  );
}

export function DonutChart({
  data,
  emptyMessage = 'No data yet',
  height = 220,
  valueKey = 'value',
  nameKey = 'name',
  centerLabel,
  centerValue,
}: {
  data: Array<Record<string, string | number>>;
  emptyMessage?: string;
  height?: number;
  valueKey?: string;
  nameKey?: string;
  centerLabel?: string;
  centerValue?: ReactNode;
}) {
  if (!data.length) return <EmptyState message={emptyMessage} />;

  const total = data.reduce((sum, row) => sum + Number(row[valueKey] || 0), 0);

  return (
    <Box sx={{ position: 'relative', width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey={valueKey}
            nameKey={nameKey}
            innerRadius="62%"
            outerRadius="84%"
            paddingAngle={2}
            stroke="none"
          >
            {data.map((row, index) => (
              <Cell
                key={String(row[nameKey] ?? index)}
                fill={CHART_PALETTE[index % CHART_PALETTE.length]}
              />
            ))}
          </Pie>
          <Tooltip
            content={
              <DefaultChartTooltip
                valueFormatter={(v, name) => {
                  const n = Number(v);
                  const pct = total > 0 ? Math.round((n / total) * 1000) / 10 : 0;
                  return `${n} (${pct}%) · ${name || ''}`;
                }}
              />
            }
          />
        </PieChart>
      </ResponsiveContainer>
      {(centerLabel || centerValue != null) && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          {centerValue != null ? (
            <Typography sx={{ fontSize: '1.35rem', fontWeight: 700, letterSpacing: '-0.03em' }}>
              {centerValue}
            </Typography>
          ) : null}
          {centerLabel ? (
            <Typography sx={{ fontSize: '0.7rem', color: cv.textMuted, mt: 0.25 }}>
              {centerLabel}
            </Typography>
          ) : null}
        </Box>
      )}
    </Box>
  );
}

export function HorizontalBarChart({
  data,
  emptyMessage = 'No data yet',
  height = 220,
  valueKey = 'value',
  nameKey = 'name',
}: {
  data: Array<Record<string, string | number>>;
  emptyMessage?: string;
  height?: number;
  valueKey?: string;
  nameKey?: string;
}) {
  if (!data.length) return <EmptyState message={emptyMessage} />;

  const chartHeight = Math.max(height, data.length * 36);

  return (
    <Box sx={{ width: '100%', height: chartHeight }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 4 }}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey={nameKey}
            width={96}
            tick={{ fill: 'var(--noah-text-muted)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: 'rgba(210, 140, 255, 0.08)' }}
            content={<DefaultChartTooltip />}
          />
          <Bar dataKey={valueKey} radius={[0, 6, 6, 0]} barSize={14} name="Users">
            {data.map((row, index) => (
              <Cell
                key={String(row[nameKey] ?? index)}
                fill={CHART_PALETTE[index % CHART_PALETTE.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}

function GaugeTooltip({
  active,
  label,
  percent,
  detail,
}: {
  active?: boolean;
  label: string;
  percent: number;
  detail?: string;
}) {
  if (!active) return null;
  return (
    <ChartTooltipFrame label={label}>
      <Typography sx={{ fontSize: '0.8125rem', fontWeight: 700 }}>
        {percent.toFixed(1)}% used
      </Typography>
      {detail ? (
        <Typography sx={{ fontSize: '0.7rem', color: cv.tooltipTextMuted, mt: 0.35 }}>
          {detail}
        </Typography>
      ) : null}
    </ChartTooltipFrame>
  );
}

export function RadialGauge({
  percent,
  label,
  detail,
  height = 180,
}: {
  percent: number;
  label: string;
  detail?: string;
  height?: number;
}) {
  const clamped = Math.max(0, Math.min(100, Number.isFinite(percent) ? percent : 0));
  const hot = clamped >= 85;
  const fill = hot ? '#ef4444' : '#d28cff';
  const data = [{ name: label, value: clamped, fill }];

  return (
    <Box sx={{ position: 'relative', width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="72%"
          outerRadius="100%"
          barSize={12}
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar
            background={{ fill: 'rgba(255,255,255,0.06)' }}
            dataKey="value"
            cornerRadius={8}
            angleAxisId={0}
          />
          <Tooltip content={<GaugeTooltip label={label} percent={clamped} detail={detail} />} />
        </RadialBarChart>
      </ResponsiveContainer>
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.03em' }}>
          {clamped.toFixed(0)}%
        </Typography>
        <Typography sx={{ fontSize: '0.7rem', color: cv.textMuted }}>{label}</Typography>
      </Box>
    </Box>
  );
}

export function GrowthCompareChart({
  orgs,
  users,
  height = 160,
}: {
  orgs: number;
  users: number;
  height?: number;
}) {
  const data = [
    { name: 'New orgs', value: orgs },
    { name: 'New users', value: users },
  ];

  return (
    <Box sx={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <XAxis
            dataKey="name"
            tick={{ fill: 'var(--noah-text-muted)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: 'var(--noah-text-muted)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={28}
          />
          <Tooltip
            cursor={{ fill: 'rgba(210, 140, 255, 0.08)' }}
            content={<DefaultChartTooltip />}
          />
          <Bar dataKey="value" name="Last 30 days" radius={[6, 6, 0, 0]} barSize={36}>
            <Cell fill={CHART_PALETTE[0]} />
            <Cell fill={CHART_PALETTE[2]} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}

export function ChartLegend({
  items,
}: {
  items: Array<{ label: string; color: string; value?: string | number }>;
}) {
  if (!items.length) return null;
  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 1.25,
        mt: 1,
      }}
    >
      {items.map((item) => (
        <Box
          key={item.label}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.75,
            px: 1,
            py: 0.35,
            borderRadius: '6px',
            background: cv.surfaceMuted,
            border: `1px solid ${cv.border}`,
          }}
        >
          <Box
            sx={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: item.color,
            }}
          />
          <Typography sx={{ fontSize: '0.7rem', color: cv.textSecondary }}>
            {item.label}
            {item.value != null ? (
              <Box component="span" sx={{ color: cv.textPrimary, fontWeight: 700, ml: 0.5 }}>
                {item.value}
              </Box>
            ) : null}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
