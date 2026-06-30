import { useRef } from 'react';
import { cv, palette } from '../../theme/cssVars';
import { Box, IconButton, Tooltip } from '@mui/material';
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined';
import {
  createCustomAnnotationColor,
  isCustomAnnotationColor,
  type AnnotationColor,
} from '../../constants/annotationColors';

const SWATCH_SIZE = 28;
const INNER_SWATCH_SIZE = 20;

interface CustomColorPickerButtonProps {
  activeColor: AnnotationColor;
  onColorChange?: (color: AnnotationColor) => void;
  disabled?: boolean;
  fallbackColor?: string;
}

export default function CustomColorPickerButton({
  activeColor,
  onColorChange,
  disabled = false,
  fallbackColor = palette.purple,
}: CustomColorPickerButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isActive = isCustomAnnotationColor(activeColor);
  const inputValue = isActive ? activeColor.value : fallbackColor;

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
          width: SWATCH_SIZE,
          height: SWATCH_SIZE,
          p: 0,
          borderRadius: '50%',
          border: isActive ? `2px solid ${cv.purpleLight}` : `2px dashed ${cv.whiteBorderDashed}`,
          boxShadow: isActive ? cv.purpleSelectionStrong : 'none',
          backgroundColor: cv.glassBackground,
          '&:hover': { transform: disabled ? undefined : 'scale(1.08)' },
          '&.Mui-disabled': { opacity: 0.45 },
        }}
      >
        {isActive ? (
          <Box
            sx={{
              width: INNER_SWATCH_SIZE,
              height: INNER_SWATCH_SIZE,
              borderRadius: '50%',
              backgroundColor: activeColor.value,
              border: "1px solid var(--noah-border)",
            }}
          />
        ) : (
          <PaletteOutlinedIcon sx={{ fontSize: 16, color: cv.textSecondary }} />
        )}
        <input
          ref={inputRef}
          type="color"
          value={inputValue}
          onChange={(event) => onColorChange?.(createCustomAnnotationColor(event.target.value))}
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
