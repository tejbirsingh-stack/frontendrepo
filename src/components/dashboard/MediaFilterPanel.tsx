import {
  Box,
  Chip,
  FormControl,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { cv, palette } from '../../theme/cssVars';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { dropdownMenuPaperSx } from '../../constants/dropdownMenu';
import {
  AI_TAG_OPTIONS,
  DATE_RANGE_OPTIONS,
  MEDIA_TYPE_FILTER_OPTIONS,
  type DateRangeFilter,
  type MediaTypeFilter,
} from '../../constants/mediaFilters';
import { useDashboard } from '../../context/DashboardContext';
import { filterTagChipStyles } from '../../utils/badgeStyles';

const menuPaperSx = dropdownMenuPaperSx;

const filterSelectSx = {
  height: 40,
  borderRadius: '10px',
  fontSize: '0.875rem',
  color: cv.textSecondary,
  backgroundColor: cv.glassBackground,
  '& .MuiSelect-select': { py: 1 },
  '& .MuiOutlinedInput-notchedOutline': { borderColor: cv.border },
  '&:hover': {
    backgroundColor: cv.surfaceHover,
    '& .MuiOutlinedInput-notchedOutline': { borderColor: cv.surfaceActive },
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: cv.borderFocus,
    borderWidth: 1,
  },
  '& .MuiSelect-icon': { color: cv.textMuted },
};

const filterLabelSx = {
  display: 'block',
  mb: 1,
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: cv.textPrimary,
};

interface FilterFieldProps {
  label: string;
  children: React.ReactNode;
}

function FilterField({ label, children }: FilterFieldProps) {
  return (
    <Box>
      <Typography component="label" sx={filterLabelSx}>
        {label}
      </Typography>
      {children}
    </Box>
  );
}

interface MediaFilterPanelProps {
  mediaTypeFilter: MediaTypeFilter;
  dateRangeFilter: DateRangeFilter;
  selectedTags: Set<string>;
  selectedAiTags: Set<string>;
  onMediaTypeChange: (value: MediaTypeFilter) => void;
  onDateRangeChange: (value: DateRangeFilter) => void;
  onToggleTag: (tag: string) => void;
  onToggleAiTag: (tag: string) => void;
  onClearAll: () => void;
}

export default function MediaFilterPanel({
  mediaTypeFilter,
  dateRangeFilter,
  selectedTags,
  selectedAiTags,
  onMediaTypeChange,
  onDateRangeChange,
  onToggleTag,
  onToggleAiTag,
  onClearAll,
}: MediaFilterPanelProps) {
  const { activeWorkspaceId, getAssignableTags } = useDashboard();
  const tagOptions = getAssignableTags(activeWorkspaceId).map((tag) => tag.name);

  const handleMediaTypeChange = (event: SelectChangeEvent) => {
    onMediaTypeChange(event.target.value as MediaTypeFilter);
  };

  const handleDateRangeChange = (event: SelectChangeEvent) => {
    onDateRangeChange(event.target.value as DateRangeFilter);
  };

  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: '16px',
        border: "1px solid var(--noah-border)",
        background: 'var(--noah-footer-tint)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2.5,
        }}
      >
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 600, fontSize: '1rem', color: cv.textPrimary }}
        >
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
            fontSize: '0.875rem',
            fontWeight: 500,
            color: cv.brandPurple,
            '&:hover': { color: cv.purpleLight },
          }}
        >
          Clear All
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            lg: 'repeat(4, 1fr)',
          },
          gap: 2.5,
        }}
      >
        <FilterField label="Media Type">
          <FormControl fullWidth size="small">
            <Select
              value={mediaTypeFilter}
              onChange={handleMediaTypeChange}
              IconComponent={KeyboardArrowDownIcon}
              sx={filterSelectSx}
              MenuProps={{
                slotProps: { paper: { sx: menuPaperSx } },
              }}
            >
              {MEDIA_TYPE_FILTER_OPTIONS.map((option) => (
                <MenuItem
                  key={option.value}
                  value={option.value}
                  sx={{ fontSize: '0.875rem', color: cv.textSecondary }}
                >
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </FilterField>

        <FilterField label="Date Range">
          <FormControl fullWidth size="small">
            <Select
              value={dateRangeFilter}
              onChange={handleDateRangeChange}
              IconComponent={KeyboardArrowDownIcon}
              sx={filterSelectSx}
              MenuProps={{
                slotProps: { paper: { sx: menuPaperSx } },
              }}
            >
              {DATE_RANGE_OPTIONS.map((option) => (
                <MenuItem
                  key={option.value}
                  value={option.value}
                  sx={{ fontSize: '0.875rem', color: cv.textSecondary }}
                >
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </FilterField>

        <FilterField label="Tags">
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
            {tagOptions.map((tag) => {
              const selected = selectedTags.has(tag);
              return (
                <Chip
                  key={tag}
                  label={tag}
                  onClick={() => onToggleTag(tag)}
                  sx={filterTagChipStyles(selected)}
                />
              );
            })}
          </Box>
        </FilterField>

        <FilterField label="AI Tags">
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
            {AI_TAG_OPTIONS.map((tag) => {
              const selected = selectedAiTags.has(tag);
              return (
                <Chip
                  key={tag}
                  label={tag}
                  onClick={() => onToggleAiTag(tag)}
                  sx={{
                    height: 30,
                    borderRadius: '999px',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    backgroundColor: selected
                      ? cv.blueGlowStrong
                      : cv.blueSelectionSurface,
                    color: selected ? cv.blue200 : palette.blueLight,
                    border: `1px solid ${selected ? cv.blueBorderStrong : cv.blueBorderSoft}`,
                    '&:hover': {
                      backgroundColor: selected
                        ? cv.blueGlow35
                        : cv.blueGlow18,
                    },
                    '& .MuiChip-label': { px: 1.25 },
                  }}
                />
              );
            })}
          </Box>
        </FilterField>
      </Box>
    </Box>
  );
}
