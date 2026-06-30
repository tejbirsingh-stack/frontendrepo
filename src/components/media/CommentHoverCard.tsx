import { Avatar, Box, Typography } from '@mui/material';
import { cv, palette } from '../../theme/cssVars';
import CommentImageAttachment from './CommentImageAttachment';
import { formatRelativeTime } from '../../utils/formatRelativeTime';
import {
  OVERLAY_CONTENT_MAX_HEIGHT,
  overlayScrollContainerSx,
} from '../../constants/overlayScroll';

interface CommentHoverCardProps {
  authorName: string;
  authorAvatarUrl?: string;
  authorInitials?: string;
  createdAt: number;
  text: string;
  imageUrl?: string;
  showAvatar?: boolean;
}

export default function CommentHoverCard({
  authorName,
  authorAvatarUrl,
  authorInitials,
  createdAt,
  text,
  imageUrl,
  showAvatar = true,
}: CommentHoverCardProps) {
  return (
    <Box
      role="tooltip"
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: showAvatar ? 1.25 : 0,
        minWidth: 180,
        maxWidth: 300,
        maxHeight: OVERLAY_CONTENT_MAX_HEIGHT,
        px: 1.5,
        py: 1.25,
        borderRadius: '14px',
        backgroundColor: cv.textInverse,
        boxShadow: cv.commentHoverShadow,
        ...overlayScrollContainerSx,
      }}
    >
      {showAvatar && (
        <Avatar
          src={authorAvatarUrl}
          alt=""
          sx={{
            width: 36,
            height: 36,
            flexShrink: 0,
            fontSize: '0.8125rem',
            fontWeight: 600,
            background: cv.brandGradient,
          }}
        >
          {!authorAvatarUrl ? authorInitials : null}
        </Avatar>
      )}

      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'baseline',
            flexWrap: 'wrap',
            gap: 0.75,
            mb: 0.5,
          }}
        >
          <Typography
            component="span"
            sx={{
              fontSize: '0.9375rem',
              fontWeight: 700,
              lineHeight: 1.3,
              color: palette.black,
            }}
          >
            {authorName}
          </Typography>
          <Typography
            component="time"
            dateTime={new Date(createdAt).toISOString()}
            sx={{
              fontSize: '0.8125rem',
              fontWeight: 400,
              lineHeight: 1.3,
              color: cv.dropdownShadow,
              whiteSpace: 'nowrap',
            }}
          >
            {formatRelativeTime(createdAt)}
          </Typography>
        </Box>

        {text ? (
          <Typography
            sx={{
              fontSize: '0.9375rem',
              fontWeight: 400,
              lineHeight: 1.45,
              color: palette.black,
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap',
            }}
          >
            {text}
          </Typography>
        ) : null}

        {imageUrl ? (
          <CommentImageAttachment src={imageUrl} alt="Comment attachment" />
        ) : null}
      </Box>
    </Box>
  );
}
