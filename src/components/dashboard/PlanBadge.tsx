import { Box } from '@mui/material';
import AppBadge from '../common/AppBadge';
import type { BadgeSize } from '../../utils/badgeStyles';

interface PlanBadgeProps {
  label?: string;
  size?: BadgeSize;
  expiryText?: string | null;
}

export default function PlanBadge({ label = 'Premium', size = 'sm' }: PlanBadgeProps) {
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
      <AppBadge variant="filled" size={size} label={label} />
    </Box>
  );
}
