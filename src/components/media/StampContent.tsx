import { Box, Typography } from '@mui/material';
import { cv, palette } from '../../theme/cssVars';
import ThumbUpAltOutlinedIcon from '@mui/icons-material/ThumbUpAltOutlined';
import ThumbDownAltOutlinedIcon from '@mui/icons-material/ThumbDownAltOutlined';
import StarOutlinedIcon from '@mui/icons-material/StarOutlined';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import StarIcon from '@mui/icons-material/Star';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { getStampEmoji, innerStamps, isCustomStampId, type OuterStampId, type StampId } from '../../constants/stamps';
import type { CustomStamp } from '../../types/customStamps';
import {
  canvasEmojiStickerSx,
  canvasIconStickerSx,
  canvasTextStickerSx,
} from '../../utils/stampStickerStyle';

const STAMP_ICON_SIZE = 22;
const STAMP_CANVAS_EMOJI_SIZE = '4.5rem';
const STAMP_CANVAS_ICON_SIZE = 56;
const STAMP_CANVAS_PLUS_ONE_SIZE = '3rem';
const STAMP_CANVAS_QUESTION_SIZE = '3.25rem';

interface StampContentProps {
  stampId: StampId;
  customEmoji?: string;
  customStamp?: CustomStamp | null;
  size?: 'toolbar' | 'canvas';
  selected?: boolean;
}

export default function StampContent({
  stampId,
  customEmoji,
  customStamp = null,
  size = 'toolbar',
  selected = false,
}: StampContentProps) {
  const isCanvas = size === 'canvas';
  const emoji = getStampEmoji(stampId, customStamp, customEmoji);

  if (emoji || isCustomStampId(stampId)) {
    if (!emoji) return null;

    return (
      <Box
        component="span"
        aria-hidden
        sx={{
          fontSize: isCanvas ? STAMP_CANVAS_EMOJI_SIZE : '1.25rem',
          lineHeight: 1,
          ...(isCanvas ? canvasEmojiStickerSx(selected) : {}),
        }}
      >
        {emoji}
      </Box>
    );
  }

  const innerStamp = innerStamps.find((stamp) => stamp.id === stampId);
  if (innerStamp) {
    return (
      <Box
        component="span"
        aria-hidden
        sx={{
          fontSize: isCanvas ? STAMP_CANVAS_EMOJI_SIZE : '1.25rem',
          lineHeight: 1,
          ...(isCanvas ? canvasEmojiStickerSx(selected) : {}),
        }}
      >
        {innerStamp.emoji}
      </Box>
    );
  }

  switch (stampId as OuterStampId) {
    case 'thumbs-up':
      if (isCanvas) {
        return (
          <ThumbUpIcon
            aria-hidden
            sx={canvasIconStickerSx(palette.green, STAMP_CANVAS_ICON_SIZE, selected)}
          />
        );
      }
      return (
        <ThumbUpAltOutlinedIcon
          sx={{
            fontSize: STAMP_ICON_SIZE,
            color: palette.green,
          }}
        />
      );
    case 'plus-one':
      if (isCanvas) {
        return (
          <Typography component="span" sx={canvasTextStickerSx(cv.purpleLight, STAMP_CANVAS_PLUS_ONE_SIZE, selected)}>
            +1
          </Typography>
        );
      }
      return (
        <Typography
          sx={{
            fontSize: '0.9375rem',
            fontWeight: 800,
            color: cv.purpleLight,
            lineHeight: 1,
          }}
        >
          +1
        </Typography>
      );
    case 'star':
      if (isCanvas) {
        return (
          <StarIcon
            aria-hidden
            sx={canvasIconStickerSx(palette.yellow, STAMP_CANVAS_ICON_SIZE + 4, selected)}
          />
        );
      }
      return (
        <StarOutlinedIcon sx={{ fontSize: 24, color: palette.yellow }} />
      );
    case 'question':
      if (isCanvas) {
        return (
          <Typography component="span" sx={canvasTextStickerSx(palette.orange, STAMP_CANVAS_QUESTION_SIZE, selected)}>
            ?
          </Typography>
        );
      }
      return (
        <Typography
          sx={{
            fontSize: '1.375rem',
            fontWeight: 800,
            color: palette.orange,
            lineHeight: 1,
          }}
        >
          ?
        </Typography>
      );
    case 'thumbs-down':
      if (isCanvas) {
        return (
          <ThumbDownIcon
            aria-hidden
            sx={canvasIconStickerSx(palette.blueLight, STAMP_CANVAS_ICON_SIZE, selected)}
          />
        );
      }
      return (
        <ThumbDownAltOutlinedIcon
          sx={{
            fontSize: STAMP_ICON_SIZE,
            color: palette.blueLight,
          }}
        />
      );
    case 'heart':
      if (isCanvas) {
        return (
          <FavoriteIcon
            aria-hidden
            sx={canvasIconStickerSx(palette.redLight, STAMP_CANVAS_ICON_SIZE, selected)}
          />
        );
      }
      return (
        <FavoriteBorderOutlinedIcon
          sx={{
            fontSize: STAMP_ICON_SIZE,
            color: palette.redLight,
          }}
        />
      );
    default:
      return null;
  }
}
