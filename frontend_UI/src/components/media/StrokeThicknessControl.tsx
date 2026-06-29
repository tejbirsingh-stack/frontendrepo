import { Box, Slider, Tooltip } from '@mui/material';
import { cv } from '../../theme/cssVars';
import {
  DEFAULT_DRAW_STROKE_THICKNESS,
  DRAW_STROKE_MAX,
  DRAW_STROKE_MIN,
} from '../../utils/drawStrokeStyle';

export type StrokeThickness = number;

function StrokeThicknessPreview({ thickness }: { thickness: number }) {
  const previewSize = 2 + (thickness / DRAW_STROKE_MAX) * 12;

  return (
    <Box
      aria-hidden
      sx={{
        width: 20,
        height: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Box
        sx={{
          width: previewSize,
          height: previewSize,
          borderRadius: '50%',
          backgroundColor: cv.purpleLight,
        }}
      />
    </Box>
  );
}

interface StrokeThicknessControlProps {
  value?: StrokeThickness;
  onChange?: (value: StrokeThickness) => void;
  tooltip?: string;
}

export default function StrokeThicknessControl({
  value = DEFAULT_DRAW_STROKE_THICKNESS,
  onChange,
  tooltip = 'Stroke thickness',
}: StrokeThicknessControlProps) {
  return (
    <Tooltip title={tooltip} placement="top">
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          px: 0.5,
          minWidth: 108,
          flexShrink: 0,
        }}
      >
        <StrokeThicknessPreview thickness={value} />
        <Slider
          size="small"
          min={DRAW_STROKE_MIN}
          max={DRAW_STROKE_MAX}
          value={value}
          onChange={(_, nextValue) => onChange?.(nextValue as number)}
          aria-label={tooltip}
          sx={{
            width: 72,
            color: cv.purpleLight,
            py: 0.5,
            '& .MuiSlider-thumb': {
              width: 12,
              height: 12,
              backgroundColor: cv.textPrimary,
              border: `2px solid ${cv.purpleLight}`,
              '&:hover, &.Mui-focusVisible': {
                boxShadow: cv.focusRingPurple4,
              },
            },
            '& .MuiSlider-track': {
              height: 3,
              border: 'none',
              background: cv.brandGradientHorizontal,
            },
            '& .MuiSlider-rail': {
              height: 3,
              opacity: 0.35,
              backgroundColor: cv.borderStrong,
            },
          }}
        />
      </Box>
    </Tooltip>
  );
}
