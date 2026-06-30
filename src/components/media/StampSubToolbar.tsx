import { useState } from 'react';
import { cv } from '../../theme/cssVars';
import { Box, Divider, IconButton, Tooltip } from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import {
  DEFAULT_STAMP_ID,
  innerStamps,
  outerStamps,
  type StampId,
} from '../../constants/stamps';
import type { CustomStamp } from '../../types/customStamps';
import StampContent from './StampContent';
import SystemEmojiPicker from './SystemEmojiPicker';
import {
  subToolbarIslandBaseSx,
  subToolbarIslandResponsiveSx,
} from './subToolbarStyles';

const SUB_TOOL_BUTTON_SIZE = 40;
const SUB_TOOL_ICON_SIZE = 22;

const activeButtonSx = {
  color: cv.textPrimary,
  background:
    cv.stampGradient,
  border: `1px solid ${cv.purpleSelectionBorder}`,
};

const inactiveButtonSx = {
  color: cv.textSecondary,
  background: 'transparent',
  border: '1px solid transparent',
};

interface StampSubToolbarProps {
  activeStamp?: StampId;
  customStamp?: CustomStamp | null;
  onStampSelect?: (stamp: StampId) => void;
  onAddCustomStamp?: (emoji: string) => void;
  overlay?: boolean;
}

export default function StampSubToolbar({
  activeStamp = DEFAULT_STAMP_ID,
  customStamp = null,
  onStampSelect,
  onAddCustomStamp,
  overlay = false,
}: StampSubToolbarProps) {
  const [emojiPickerAnchor, setEmojiPickerAnchor] = useState<HTMLElement | null>(null);
  const emojiPickerOpen = Boolean(emojiPickerAnchor);
  const stampButtonSx = (isActive: boolean) => ({
    width: SUB_TOOL_BUTTON_SIZE,
    height: SUB_TOOL_BUTTON_SIZE,
    borderRadius: '10px',
    flexShrink: 0,
    transition: 'all 0.2s ease',
    ...(isActive ? activeButtonSx : inactiveButtonSx),
    '&:hover': {
      backgroundColor: isActive ? undefined : cv.surfaceHover,
      color: cv.textPrimary,
    },
  });

  return (
    <Box
      role="toolbar"
      aria-label="Stamp tools"
      sx={{
        ...subToolbarIslandBaseSx,
        ...subToolbarIslandResponsiveSx(820, { overlay }),
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.25,
          overflowX: 'auto',
          flexShrink: 0,
          py: 0.25,
          '&::-webkit-scrollbar': { height: 4 },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: cv.borderInputHover,
            borderRadius: '999px',
          },
        }}
      >
        {innerStamps.map((stamp) => {
          const isActive = activeStamp === stamp.id;

          return (
            <Tooltip key={stamp.id} title={stamp.label} placement="top">
              <IconButton
                aria-label={stamp.label}
                aria-pressed={isActive}
                onClick={() => onStampSelect?.(stamp.id)}
                sx={stampButtonSx(isActive)}
              >
                <Box component="span" sx={{ fontSize: '1.25rem', lineHeight: 1 }}>
                  {stamp.emoji}
                </Box>
              </IconButton>
            </Tooltip>
          );
        })}
      </Box>

      <Divider
        orientation="vertical"
        flexItem
        sx={{ mx: 0.5, borderColor: cv.whiteBorderSoft }}
      />

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.25,
          overflowX: 'auto',
          flex: 1,
          minWidth: 0,
          py: 0.25,
          '&::-webkit-scrollbar': { height: 4 },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: cv.borderInputHover,
            borderRadius: '999px',
          },
        }}
      >
        {outerStamps.map((stamp) => {
          const isActive = activeStamp === stamp.id;

          return (
            <Tooltip key={stamp.id} title={stamp.label} placement="top">
              <IconButton
                aria-label={stamp.label}
                aria-pressed={isActive}
                onClick={() => onStampSelect?.(stamp.id)}
                sx={stampButtonSx(isActive)}
              >
                <StampContent stampId={stamp.id} />
              </IconButton>
            </Tooltip>
          );
        })}

        {customStamp ? (
          <Tooltip title={customStamp.label} placement="top">
            <IconButton
              aria-label={customStamp.label}
              aria-pressed={activeStamp === customStamp.id}
              onClick={() => onStampSelect?.(customStamp.id)}
              sx={stampButtonSx(activeStamp === customStamp.id)}
            >
              <StampContent stampId={customStamp.id} customEmoji={customStamp.emoji} />
            </IconButton>
          </Tooltip>
        ) : null}
      </Box>

      <Divider
        orientation="vertical"
        flexItem
        sx={{ mx: 0.5, borderColor: cv.whiteBorderSoft }}
      />

      <Tooltip title={customStamp ? 'Change custom stamp' : 'Add custom stamp'} placement="top">
        <IconButton
          aria-label={customStamp ? 'Change custom stamp' : 'Add custom stamp'}
          aria-expanded={emojiPickerOpen}
          onClick={(event) => setEmojiPickerAnchor(event.currentTarget)}
          sx={{
            ...stampButtonSx(false),
            flexShrink: 0,
            mr: 0.25,
          }}
        >
          <AddOutlinedIcon sx={{ fontSize: SUB_TOOL_ICON_SIZE }} />
        </IconButton>
      </Tooltip>

      <SystemEmojiPicker
        open={emojiPickerOpen}
        anchorEl={emojiPickerAnchor}
        onClose={() => setEmojiPickerAnchor(null)}
        onEmojiSelect={(emoji) => onAddCustomStamp?.(emoji)}
      />
    </Box>
  );
}
