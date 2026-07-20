import {
  Box,
  Button,
  InputAdornment,
  TextField,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { cv } from '../../theme/cssVars';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import FilterListOutlinedIcon from '@mui/icons-material/FilterListOutlined';
import SearchIcon from '@mui/icons-material/Search';

interface SettingsAdminToolbarProps {
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onFilter?: () => void;
  filterOpen?: boolean;
  hasActiveFilters?: boolean;
  onExport?: () => void;
  onAdd?: () => void;
  addLabel?: string;
  addDisabled?: boolean;
  exportDisabled?: boolean;
  extraActions?: React.ReactNode;
}

export default function SettingsAdminToolbar({
  searchPlaceholder = 'Search…',
  searchValue,
  onSearchChange,
  onFilter,
  filterOpen = false,
  hasActiveFilters = false,
  onExport,
  onAdd,
  addLabel = 'Add new',
  addDisabled = false,
  exportDisabled = false,
  extraActions,
}: SettingsAdminToolbarProps) {
  return (
    <Box
      sx={{
        px: 2,
        py: 1.5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1.5,
        flexWrap: { xs: 'wrap', md: 'nowrap' },
        borderBottom: `1px solid ${cv.dividerSubtle}`,
      }}
    >
      <TextField
        size="small"
        placeholder={searchPlaceholder}
        value={searchValue}
        onChange={(event) => onSearchChange(event.target.value)}
        sx={{
          minWidth: { xs: '100%', md: 280 },
          maxWidth: { md: 420 },
          flex: { md: '1 1 auto' },
          width: { xs: '100%', md: 'auto' },
        }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 18, color: cv.textMuted }} />
              </InputAdornment>
            ),
          },
        }}
      />

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          flexWrap: 'wrap',
          flexShrink: 0,
          ml: { xs: 0, md: 'auto' },
        }}
      >
        {onFilter ? (
          <Button
            size="small"
            startIcon={<FilterListOutlinedIcon sx={{ fontSize: 18 }} />}
            onClick={onFilter}
            aria-expanded={filterOpen}
            sx={{
              textTransform: 'none',
              color: hasActiveFilters || filterOpen ? cv.textPrimary : cv.textSecondary,
              borderRadius: '10px',
              px: 1.5,
              border: `1px solid ${
                hasActiveFilters || filterOpen ? cv.borderFocus : cv.border
              }`,
              backgroundColor:
                hasActiveFilters || filterOpen ? cv.insetHighlight : 'transparent',
              '&:hover': {
                backgroundColor: cv.surfaceHover,
                borderColor: cv.surfaceActive,
              },
            }}
          >
            Filter
          </Button>
        ) : null}
        {onExport ? (
          <Tooltip title="" placement="top" disableHoverListener={true}>
            <span>
              <Button
                size="small"
                startIcon={<FileDownloadOutlinedIcon sx={{ fontSize: 18 }} />}
                onClick={exportDisabled ? undefined : onExport}
                disabled={exportDisabled}
                sx={{ color: exportDisabled ? cv.textMuted : cv.textSecondary, textTransform: 'none' }}
              >
                Export view
              </Button>
            </span>
          </Tooltip>
        ) : null}
        {extraActions}
        {onAdd ? (
          <Tooltip title="" placement="top" disableHoverListener={true}>
            <span>
              <Button
                size="small"
                variant="contained"
                startIcon={<AddIcon sx={{ fontSize: 18 }} />}
                onClick={addDisabled ? undefined : onAdd}
                disabled={addDisabled}
                sx={{ 
                  textTransform: 'none', 
                  borderRadius: '8px',
                  opacity: addDisabled ? 0.6 : 1,
                }}
              >
                {addLabel}
              </Button>
            </span>
          </Tooltip>
        ) : null}
      </Box>
    </Box>
  );
}
