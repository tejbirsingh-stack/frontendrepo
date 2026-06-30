import { Box, Typography } from '@mui/material';
import { cv } from '../../theme/cssVars';
import type { WorkspaceMemberType } from '../../data/mockSettingsData';
import { MEMBER_TYPE_DETAILS } from '../../constants/memberTypeDetails';

const MEMBER_TYPE_OPTIONS: WorkspaceMemberType[] = ['Member', 'Guest', 'Group'];

export default function MemberTypeToggle({
  value,
  onChange,
}: {
  value: WorkspaceMemberType;
  onChange: (value: WorkspaceMemberType) => void;
}) {
  const activeDetails = MEMBER_TYPE_DETAILS[value];

  return (
    <Box>
      <Box
        sx={{
          display: 'inline-flex',
          p: 0.35,
          borderRadius: '8px',
          border: `1px solid ${cv.border}`,
          backgroundColor: cv.surfaceMuted,
          width: '100%',
        }}
      >
        {MEMBER_TYPE_OPTIONS.map((option) => {
          const selected = value === option;
          return (
            <Box
              key={option}
              component="button"
              type="button"
              onClick={() => onChange(option)}
              sx={{
                flex: 1,
                border: 'none',
                cursor: 'pointer',
                px: 1.1,
                py: 0.45,
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                fontFamily: 'inherit',
                color: selected ? cv.textPrimary : cv.textMuted,
                backgroundColor: selected ? cv.purpleSelection : 'transparent',
              }}
            >
              {option}
            </Box>
          );
        })}
      </Box>
      <Typography sx={{ mt: 0.85, fontSize: '0.8125rem', color: cv.textSecondary, lineHeight: 1.45, wordBreak: 'break-word' }}>
        {activeDetails.description}
      </Typography>
    </Box>
  );
}
