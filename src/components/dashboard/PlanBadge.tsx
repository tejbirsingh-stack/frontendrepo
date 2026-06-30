import AppBadge from '../common/AppBadge';
import type { BadgeSize } from '../../utils/badgeStyles';

interface PlanBadgeProps {
  label?: string;
  size?: BadgeSize;
}

export default function PlanBadge({ label = 'Premium', size = 'sm' }: PlanBadgeProps) {
  return <AppBadge variant="filled" size={size} label={label} />;
}
