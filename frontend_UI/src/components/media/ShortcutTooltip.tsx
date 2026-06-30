import { Box, Tooltip, Typography, type TooltipProps } from '@mui/material';
import { cv } from '../../theme/cssVars';

interface ShortcutTooltipProps {
  label: string;
  shortcut?: string;
  children: TooltipProps['children'];
  placement?: TooltipProps['placement'];
}

export default function ShortcutTooltip({
  label,
  shortcut,
  children,
  placement = 'top',
}: ShortcutTooltipProps) {
  return (
    <Tooltip
      placement={placement}
      title={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Typography
            component="span"
            sx={{ fontSize: '0.8125rem', fontWeight: 500, color: cv.tooltipText }}
          >
            {label}
          </Typography>
          {shortcut ? (
            <Typography
              component="kbd"
              sx={{
                fontSize: '0.8125rem',
                fontWeight: 500,
                color: cv.tooltipTextMuted,
                fontFamily: 'inherit',
                textTransform: 'uppercase',
              }}
            >
              {shortcut}
            </Typography>
          ) : null}
        </Box>
      }
    >
      {children}
    </Tooltip>
  );
}
