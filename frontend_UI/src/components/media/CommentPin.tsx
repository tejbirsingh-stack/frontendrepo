import { Box } from '@mui/material';
import { cv } from '../../theme/cssVars';

interface CommentPinProps {
  size?: number;
}

export default function CommentPin({ size = 30 }: CommentPinProps) {
  return (
    <Box
      component="svg"
      width={size}
      height={size}
      viewBox="0 0 30 30"
      fill="none"
      aria-hidden
      sx={{
        display: 'block',
        flexShrink: 0,
        filter: cv.commentPinGlow,
      }}
    >
      <path
        d="M22 3C25.3137 3 28 5.68629 28 9V17C28 20.3137 25.3137 23 22 23H13L4 28L8.5 20.5C5.5 19.2 3 16.4 3 13V9C3 5.68629 5.68629 3 9 3H22Z"
        fill={cv.brandPurple}
      />
    </Box>
  );
}
