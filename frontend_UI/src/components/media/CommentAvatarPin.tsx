import { Avatar, Box } from '@mui/material';
import { cv } from '../../theme/cssVars';
import type { CommentAuthor } from '../../types/videoComments';

interface CommentAvatarPinProps {
  author: CommentAuthor;
  size?: number;
}

const PIN_COLOR = cv.brandPurple;

export default function CommentAvatarPin({ author, size = 32 }: CommentAvatarPinProps) {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: '50%',
        border: `2px solid ${PIN_COLOR}`,
        overflow: 'hidden',
        backgroundColor: cv.textInverse,
        boxSizing: 'border-box',
        boxShadow: cv.avatarPinShadow,
      }}
    >
      <Avatar
        src={author.avatarUrl}
        alt=""
        sx={{
          width: '100%',
          height: '100%',
          fontSize: '0.75rem',
          fontWeight: 600,
          background: cv.brandGradient,
        }}
      >
        {!author.avatarUrl ? author.initials : null}
      </Avatar>
    </Box>
  );
}
