import { Box, Popover, Typography } from '@mui/material';
import { cv } from '../../theme/cssVars';
import {
  WORKSPACE_COLORS,
  type WorkspaceColorOption,
} from '../../constants/workspaceColors';
import CustomHexColorPickerButton from './CustomHexColorPickerButton';

interface WorkspaceColorPickerProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  selectedColor: string;
  title?: string;
  colors?: WorkspaceColorOption[];
  onClose: () => void;
  onSelect: (color: string) => void;
}

export default function WorkspaceColorPicker({
  anchorEl,
  open,
  selectedColor,
  title = 'Workspace color',
  colors = WORKSPACE_COLORS,
  onClose,
  onSelect,
}: WorkspaceColorPickerProps) {
  const presetValues = colors.map((option) => option.value);

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      slotProps={{
        paper: {
          sx: {
            mt: 0.5,
            p: 1.5,
            borderRadius: '12px',
            border: "1px solid var(--noah-border)",
            background: 'var(--noah-popover-surface)',
            backdropFilter: 'blur(20px)',
            boxShadow: cv.tooltipShadow,
          },
        },
      }}
    >
      <Typography
        variant="caption"
        sx={{
          display: 'block',
          mb: 1,
          color: cv.textMuted,
          fontSize: '0.6875rem',
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}
      >
        {title}
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, maxWidth: 180 }}>
        {colors.map((option) => {
          const isSelected = option.value === selectedColor;
          return (
            <Box
              key={option.id}
              component="button"
              type="button"
              aria-label={option.label}
              onClick={() => {
                onSelect(option.value);
                onClose();
              }}
              sx={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                border: isSelected
                  ? `2px solid ${cv.textPrimary}`
                  : '2px solid transparent',
                backgroundColor: option.value,
                cursor: 'pointer',
                p: 0,
                outline: 'none',
                transition: 'transform 0.15s ease',
                '&:hover': { transform: 'scale(1.08)' },
                '&:focus-visible': {
                  outline: `2px solid ${cv.borderFocus}`,
                  outlineOffset: 2,
                },
              }}
            />
          );
        })}
        <CustomHexColorPickerButton
          selectedColor={selectedColor}
          presetColors={presetValues}
          fallbackColor={presetValues[0] ?? cv.brandPurple}
          onColorChange={(color) => {
            onSelect(color);
            onClose();
          }}
        />
      </Box>
    </Popover>
  );
}
