import { Box, IconButton } from '@mui/material';
import { cv } from '../../theme/cssVars';
import { workspaceColorGlow } from '../../constants/workspaceColors';

interface WorkspaceColorDotProps {
  color: string;
  size?: number;
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  clickable?: boolean;
}

export default function WorkspaceColorDot({
  color,
  size = 8,
  onClick,
  clickable = false,
}: WorkspaceColorDotProps) {
  const dot = (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: color,
        flexShrink: 0,
        boxShadow: workspaceColorGlow(color),
      }}
    />
  );

  if (!clickable || !onClick) {
    return dot;
  }

  return (
    <IconButton
      size="small"
      onClick={onClick}
      aria-label="Change workspace color"
      sx={{
        p: 0.5,
        '&:hover': { backgroundColor: cv.surfaceRaised },
      }}
    >
      <Box
        sx={{
          width: size + 2,
          height: size + 2,
          borderRadius: '50%',
          backgroundColor: color,
          boxShadow: workspaceColorGlow(color),
        }}
      />
    </IconButton>
  );
}
