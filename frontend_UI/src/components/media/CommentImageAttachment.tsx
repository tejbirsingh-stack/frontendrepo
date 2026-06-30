import { Box, IconButton, Typography } from '@mui/material';
import { cv } from '../../theme/cssVars';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';

interface CommentImageAttachmentProps {
  src: string;
  alt: string;
  onRemove?: () => void;
  variant?: 'editor' | 'message';
}

export default function CommentImageAttachment({
  src,
  alt,
  onRemove,
  variant = 'message',
}: CommentImageAttachmentProps) {
  const isEditor = variant === 'editor';

  return (
    <Box
      sx={{
        position: 'relative',
        mt: isEditor ? 1 : 0.75,
        width: isEditor ? '100%' : 'fit-content',
        maxWidth: '100%',
      }}
    >
      <Box
        component="img"
        src={src}
        alt={alt}
        sx={{
          display: 'block',
          width: isEditor ? '100%' : 'auto',
          maxWidth: '100%',
          maxHeight: isEditor ? 180 : 220,
          objectFit: 'cover',
          borderRadius: '10px',
          border: `1px solid ${cv.inkOverlay08}`,
        }}
      />

      {onRemove ? (
        <IconButton
          type="button"
          aria-label="Remove image"
          onClick={onRemove}
          size="small"
          sx={{
            position: 'absolute',
            top: 6,
            right: 6,
            width: 28,
            height: 28,
            backgroundColor: cv.inkScrim72,
            color: cv.textInverse,
            '&:hover': {
              backgroundColor: cv.inkScrim88,
            },
          }}
        >
          <CloseOutlinedIcon sx={{ fontSize: 16 }} />
        </IconButton>
      ) : null}
    </Box>
  );
}

interface CommentImageErrorProps {
  message: string;
}

export function CommentImageError({ message }: CommentImageErrorProps) {
  return (
    <Typography
      role="alert"
      sx={{
        mt: 0.75,
        fontSize: '0.8125rem',
        lineHeight: 1.4,
        color: cv.destructiveDeep,
      }}
    >
      {message}
    </Typography>
  );
}
