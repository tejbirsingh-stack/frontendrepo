import type { ReactNode } from 'react';
import { Box, IconButton, Typography, type SxProps, type Theme } from '@mui/material';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import {
  badgeDeleteButtonStyles,
  badgeIconStyles,
  badgeLabelStyles,
  filledBadgeStyles,
  getBadgeSizeTokens,
  outlinedBadgeStyles,
  type BadgeSize,
} from '../../utils/badgeStyles';

interface AppBadgeProps {
  label: string;
  variant?: 'filled' | 'outlined';
  size?: BadgeSize;
  icon?: ReactNode;
  onDelete?: () => void;
  deleteAriaLabel?: string;
  sx?: SxProps<Theme>;
}

export default function AppBadge({
  label,
  variant = 'outlined',
  size = 'md',
  icon,
  onDelete,
  deleteAriaLabel = 'Remove badge',
  sx,
}: AppBadgeProps) {
  const tokens = getBadgeSizeTokens(size);
  const baseStyles = variant === 'filled' ? filledBadgeStyles(size) : outlinedBadgeStyles(size);

  return (
    <Box component="span" sx={[baseStyles, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}>
      {icon ? <Box component="span" sx={badgeIconStyles(size)}>{icon}</Box> : null}
      <Typography component="span" sx={badgeLabelStyles(variant, size)}>
        {label}
      </Typography>
      {onDelete ? (
        <IconButton
          size="small"
          aria-label={deleteAriaLabel}
          onClick={onDelete}
          sx={badgeDeleteButtonStyles(size)}
        >
          <CloseOutlinedIcon sx={{ fontSize: tokens.iconSize }} />
        </IconButton>
      ) : null}
    </Box>
  );
}
