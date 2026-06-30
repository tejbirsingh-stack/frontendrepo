import { Box, Typography } from '@mui/material';
import { cv } from '../../theme/cssVars';
import { DEFAULT_FOLDER_COLOR, FOLDER_COLORS } from '../../constants/folderColors';
import CustomHexColorPickerButton from './CustomHexColorPickerButton';

interface FolderColorPickerFieldProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

export default function FolderColorPickerField({
  value,
  onChange,
  label = 'Folder color',
}: FolderColorPickerFieldProps) {
  const presetValues = FOLDER_COLORS.map((option) => option.value);

  return (
    <Box sx={{ mt: 2.5 }}>
      <Typography
        variant="caption"
        sx={{
          display: 'block',
          mb: 1.25,
          color: cv.textMuted,
          fontSize: '0.6875rem',
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25 }}>
        {FOLDER_COLORS.map((option) => {
          const isSelected = option.value === value;
          return (
            <Box
              key={option.id}
              component="button"
              type="button"
              aria-label={option.label}
              title={option.label}
              onClick={() => onChange(option.value)}
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                border: isSelected ? `2px solid ${cv.textPrimary}` : '2px solid transparent',
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
          selectedColor={value}
          presetColors={presetValues}
          fallbackColor={DEFAULT_FOLDER_COLOR}
          size={32}
          onColorChange={onChange}
        />
      </Box>
    </Box>
  );
}
