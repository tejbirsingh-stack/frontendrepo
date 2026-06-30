import { useRef } from 'react';
import { cv } from '../../theme/cssVars';
import { Box, IconButton, Tooltip } from '@mui/material';
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined';

const DEFAULT_SIZE = 28;
const INNER_SWATCH_RATIO = 20 / 28;

interface CustomHexColorPickerButtonProps {
  selectedColor: string;
  presetColors: string[];
  onColorChange: (color: string) => void;
  disabled?: boolean;
  fallbackColor?: string;
  size?: number;
}

function isCustomHexColor(color: string, presetColors: string[]): boolean {
  const normalized = color.toLowerCase();
  return !presetColors.some((preset) => preset.toLowerCase() === normalized);
}

export default function CustomHexColorPickerButton({
  selectedColor,
  presetColors,
  onColorChange,
  disabled = false,
  fallbackColor = cv.brandPurple,
  size = DEFAULT_SIZE,
}: CustomHexColorPickerButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isActive = isCustomHexColor(selectedColor, presetColors);
  const inputValue = isActive ? selectedColor : fallbackColor;
  const innerSize = Math.round(size * INNER_SWATCH_RATIO);

  const openPicker = () => {
    inputRef.current?.click();
  };

  return (
    <Tooltip title="Custom color" placement="top">
      <IconButton
        aria-label="Custom color"
        aria-pressed={isActive}
        disabled={disabled}
        onClick={openPicker}
        sx={{
          width: size,
          height: size,
          p: 0,
          borderRadius: '50%',
          border: isActive ? `2px solid ${cv.textPrimary}` : `2px dashed ${cv.whiteBorderDashed}`,
          backgroundColor: cv.glassBackground,
          cursor: disabled ? 'default' : 'pointer',
          '&:hover': { transform: disabled ? undefined : 'scale(1.08)' },
          '&.Mui-disabled': { opacity: 0.45 },
          '&:focus-visible': {
            outline: `2px solid ${cv.borderFocus}`,
            outlineOffset: 2,
          },
        }}
      >
        {isActive ? (
          <Box
            sx={{
              width: innerSize,
              height: innerSize,
              borderRadius: '50%',
              backgroundColor: selectedColor,
              border: "1px solid var(--noah-border)",
            }}
          />
        ) : (
          <PaletteOutlinedIcon sx={{ fontSize: Math.round(size * 0.57), color: cv.textSecondary }} />
        )}
        <input
          ref={inputRef}
          type="color"
          value={inputValue}
          onChange={(event) => onColorChange(event.target.value)}
          aria-hidden
          tabIndex={-1}
          style={{
            position: 'absolute',
            width: 1,
            height: 1,
            opacity: 0,
            pointerEvents: 'none',
          }}
        />
      </IconButton>
    </Tooltip>
  );
}
