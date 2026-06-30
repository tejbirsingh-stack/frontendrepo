import { Box, Typography } from '@mui/material';
import { cv } from '../../theme/cssVars';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';
import type { ProjectVisibility } from '../../data/mockSettingsData';

interface ProjectVisibilityPickerProps {
  value: ProjectVisibility;
  onChange: (value: ProjectVisibility) => void;
  publicDescription?: string;
  privateDescription?: string;
  disabled?: boolean;
}

export default function ProjectVisibilityPicker({
  value,
  onChange,
  publicDescription = 'Anyone with the link can view this project.',
  privateDescription = 'Only you and invited members can access this project.',
  disabled = false,
}: ProjectVisibilityPickerProps) {
  const options: {
    value: ProjectVisibility;
    label: string;
    icon: React.ReactNode;
    description: string;
  }[] = [
    {
      value: 'public',
      label: 'Public',
      icon: <PublicOutlinedIcon sx={{ fontSize: 18 }} />,
      description: publicDescription,
    },
    {
      value: 'private',
      label: 'Private',
      icon: <LockOutlinedIcon sx={{ fontSize: 18 }} />,
      description: privateDescription,
    },
  ];

  return (
    <Box>
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
        Visibility
      </Typography>
      <Box sx={{ display: 'flex', gap: 1 }}>
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <Box
              key={option.value}
              component="button"
              type="button"
              disabled={disabled}
              onClick={() => {
                if (!disabled) onChange(option.value);
              }}
              aria-pressed={selected}
              aria-disabled={disabled}
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.75,
                px: 1.5,
                py: 1,
                borderRadius: '10px',
                border: `1px solid ${selected ? cv.borderFocus : cv.border}`,
                backgroundColor: selected ? cv.purpleSelectionSoft : cv.surfaceSubtle,
                color: selected ? cv.textPrimary : cv.textSecondary,
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.55 : 1,
                fontSize: '0.875rem',
                fontWeight: 500,
                fontFamily: 'inherit',
                transition: 'border-color 0.15s ease, background-color 0.15s ease',
                '&:hover': disabled
                  ? {}
                  : {
                      borderColor: cv.borderFocus,
                      backgroundColor: selected ? cv.purpleSurfaceHover : cv.surfaceHover,
                    },
              }}
            >
              {option.icon}
              {option.label}
            </Box>
          );
        })}
      </Box>
      <Typography sx={{ mt: 1, fontSize: '0.8125rem', color: cv.textSecondary }}>
        {options.find((option) => option.value === value)?.description}
      </Typography>
    </Box>
  );
}
