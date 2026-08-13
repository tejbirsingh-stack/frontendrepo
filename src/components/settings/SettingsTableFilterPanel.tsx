import { Box, Button, Chip, Typography } from '@mui/material';
import { cv } from '../../theme/cssVars';
import {
  FILTER_ALL_OPTION,
  isFilterAllSelected,
} from '../../utils/settingsTableFilterUtils';
import { filterTagChipStyles } from '../../utils/badgeStyles';

export interface SettingsFilterGroup {
  id: string;
  label: string;
  options: string[];
  selected: Set<string>;
  onToggle: (value: string) => void;
}

interface SettingsTableFilterPanelProps {
  groups: SettingsFilterGroup[];
  onClearAll: () => void;
  onApply?: () => void;
}

function FilterChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <Chip
      label={label}
      onClick={onClick}
      sx={filterTagChipStyles(selected)}
    />
  );
}

export default function SettingsTableFilterPanel({
  groups,
  onClearAll,
  onApply,
}: SettingsTableFilterPanelProps) {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: '12px',
        border: '1px solid var(--noah-border)',
        background: 'var(--noah-footer-tint)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Typography sx={{ fontWeight: 600, fontSize: '0.9375rem', color: cv.textPrimary }}>
          Filters
        </Typography>
        <Typography
          component="button"
          type="button"
          onClick={onClearAll}
          sx={{
            border: 'none',
            background: 'none',
            p: 0,
            cursor: 'pointer',
            fontSize: '0.8125rem',
            fontWeight: 500,
            color: cv.brandPurple,
            '&:hover': { color: cv.purpleLight },
          }}
        >
          Clear all
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {groups.map((group) => (
          <Box key={group.id}>
            <Typography
              component="label"
              sx={{
                display: 'block',
                mb: 1,
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: cv.textPrimary,
              }}
            >
              {group.label}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
              {[FILTER_ALL_OPTION, ...group.options.filter((option) => option !== FILTER_ALL_OPTION)].map(
                (option) => (
                  <FilterChip
                    key={option}
                    label={option}
                    selected={
                      option === FILTER_ALL_OPTION
                        ? isFilterAllSelected(group.selected)
                        : group.selected.has(option)
                    }
                    onClick={() => group.onToggle(option)}
                  />
                ),
              )}
            </Box>
          </Box>
        ))}
      </Box>

      {onApply && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2.5 }}>
          <Button
            variant="contained"
            onClick={onApply}
            sx={{
              px: 3,
              py: 0.875,
              borderRadius: '10px',
              fontSize: '0.875rem',
              fontWeight: 600,
              textTransform: 'none',
              background: 'linear-gradient(135deg, var(--noah-brand-purple), var(--noah-brand-purple-light, #a78bfa))',
              boxShadow: '0 2px 12px rgba(139,92,246,0.35)',
              '&:hover': {
                background: 'linear-gradient(135deg, var(--noah-brand-purple-hover, #7c3aed), var(--noah-brand-purple))',
                boxShadow: '0 4px 16px rgba(139,92,246,0.5)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            Apply Filters
          </Button>
        </Box>
      )}
    </Box>
  );
}

