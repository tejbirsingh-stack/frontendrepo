import { Box, Typography } from '@mui/material';
import AppBadge from '../common/AppBadge';
import type { BadgeSize } from '../../utils/badgeStyles';

interface PlanBadgeProps {
  label?: string;
  size?: BadgeSize;
  expiryText?: string | null;
}

export default function PlanBadge({ label = 'Premium', size = 'sm', expiryText }: PlanBadgeProps) {
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
      <AppBadge variant="filled" size={size} label={label} />
      {expiryText ? (
        <Typography
          component="span"
          sx={{
            fontSize: size === 'md' ? '0.8125rem' : '0.75rem',
            color: 'rgba(240, 240, 245, 0.65)',
            fontWeight: 500,
            whiteSpace: 'nowrap',
          }}
        >
          (3 Days Free trial expires at {expiryText})
        </Typography>
      ) : null}
    </Box>
  );
}
