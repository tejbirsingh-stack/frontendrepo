import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  FormControl,
  Select,
  MenuItem,
  Button,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import ExcelJS from 'exceljs';
import { cv } from '../theme/cssVars';
import { apiClient } from '../api/client';
import { dropdownMenuPaperSx } from '../constants/dropdownMenu';

interface UserActivity {
  id: string;
  createdAt: string;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  activityName?: string;
  description?: string;
  activityType?: string;
}

interface RoleOption {
  id: string;
  name: string;
}

type ActionTone = 'danger' | 'purple' | 'success' | 'neutral' | 'info';

const ACTIVITY_TYPES = ['INFO', 'ERROR'] as const;

function getOneYearAgo(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return d.toISOString().split('T')[0];
}

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function normalizeActionLabel(activity: UserActivity): string {
  const raw = (activity.activityName || activity.activityType || 'Activity').trim();
  return raw
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getActionTone(label: string): ActionTone {
  const key = label.toLowerCase();
  if (key.includes('permanent delete') || key.includes('delete') || key.includes('error')) {
    if (key.includes('approve')) return 'purple';
    return 'danger';
  }
  if (key.includes('approve')) return 'purple';
  if (
    key.includes('upload') ||
    key.includes('restore') ||
    key.includes('create folder') ||
    key.includes('create project') ||
    key.includes('success')
  ) {
    return 'success';
  }
  if (key.includes('rename') || key.includes('login')) return 'info';
  return 'neutral';
}

const actionToneSx: Record<ActionTone, { backgroundColor: string; color: string }> = {
  danger: {
    backgroundColor: cv.destructiveSurface,
    color: cv.destructive,
  },
  purple: {
    backgroundColor: cv.purpleSelectionSoft,
    color: cv.brandPurple,
  },
  success: {
    backgroundColor: cv.successSurface,
    color: cv.successText,
  },
  info: {
    backgroundColor: cv.blueGlow18,
    color: cv.brandBlue,
  },
  neutral: {
    backgroundColor: cv.surfaceHover,
    color: cv.textSecondary,
  },
};

function formatActivityTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .format(date)
    .replace(/(\d{4}),?/, '$1,');
}

const filterSelectSx = {
  borderRadius: '10px',
  backgroundColor: cv.surface,
  fontSize: '0.875rem',
  color: cv.textSecondary,
  minWidth: 130,
  '& .MuiOutlinedInput-notchedOutline': { borderColor: cv.border },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: cv.borderStrong },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: cv.borderFocus },
  '& .MuiSelect-icon': { color: cv.textMuted },
};

const dateFieldSx = {
  minWidth: 150,
  '& .MuiOutlinedInput-root': {
    borderRadius: '10px',
    backgroundColor: cv.surface,
    '& fieldset': { borderColor: cv.border },
    '&:hover fieldset': { borderColor: cv.borderStrong },
    '&.Mui-focused fieldset': { borderColor: cv.borderFocus },
  },
  '& .MuiInputBase-input': { cursor: 'pointer' },
  '& ::-webkit-calendar-picker-indicator': { cursor: 'pointer' },
};

const headerCellSx = {
  fontWeight: 600,
  fontSize: '0.8125rem',
  color: cv.textSecondary,
  borderBottom: `1px solid ${cv.border}`,
  backgroundColor: 'transparent',
  py: 1.5,
  px: 2,
};

const bodyCellSx = {
  borderBottom: `1px solid ${cv.border}`,
  py: 1.75,
  px: 2,
  verticalAlign: 'top' as const,
};

export default function UserActivitiesPage() {
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [startDate, setStartDate] = useState(getOneYearAgo());
  const [endDate, setEndDate] = useState(getToday());

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await apiClient.get<any>('/users/user-activities');
        if (response?.success) {
          setActivities(response.activities || []);
        } else if (Array.isArray(response?.activities)) {
          setActivities(response.activities);
        } else if (Array.isArray(response)) {
          setActivities(response);
        }
      } catch (error) {
        console.error('Failed to fetch user activities:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchRoles = async () => {
      try {
        const response = await apiClient.get<any>('/users/roles');
        if (response?.success) {
          setRoles(response.roles || []);
        } else if (Array.isArray(response?.roles)) {
          setRoles(response.roles);
        }
      } catch (error) {
        console.error('Failed to fetch roles:', error);
      }
    };

    void fetchActivities();
    void fetchRoles();
  }, []);

  const roleOptions = useMemo(() => {
    if (roles.length > 0) return roles;
    const fromActivities = new Set<string>();
    for (const activity of activities) {
      if (activity.userRole) fromActivities.add(activity.userRole);
    }
    return Array.from(fromActivities)
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({ id: name, name }));
  }, [roles, activities]);

  const filteredActivities = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return activities.filter((activity) => {
      if (roleFilter !== 'ALL' && activity.userRole !== roleFilter) return false;

      const typeLabel = (activity.activityType || 'INFO').toUpperCase();
      if (typeFilter !== 'ALL' && typeLabel !== typeFilter) return false;

      if (startDate) {
        const activityDate = new Date(activity.createdAt).getTime();
        const filterStart = new Date(startDate).getTime();
        if (activityDate < filterStart) return false;
      }

      if (endDate) {
        const activityDate = new Date(activity.createdAt).getTime();
        const filterEnd = new Date(endDate).getTime() + 24 * 60 * 60 * 1000;
        if (activityDate >= filterEnd) return false;
      }

      if (!query) return true;

      const haystack = [
        formatActivityTime(activity.createdAt),
        activity.userName,
        activity.userEmail,
        activity.userRole,
        activity.activityName,
        activity.activityType,
        activity.description,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [activities, roleFilter, typeFilter, startDate, endDate, searchQuery]);

  const handleExport = async () => {
    if (filteredActivities.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('User Activities');

    worksheet.columns = [
      { header: 'User', key: 'user', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Role', key: 'role', width: 15 },
      { header: 'Activity Name', key: 'activityName', width: 25 },
      { header: 'Activity Details', key: 'description', width: 50 },
      { header: 'Type', key: 'type', width: 15 },
      { header: 'Time', key: 'time', width: 25 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.height = 25;
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1976D2' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    for (const activity of filteredActivities) {
      worksheet.addRow({
        user: activity.userName || 'System',
        email: activity.userEmail || '',
        role: activity.userRole || '—',
        activityName: activity.activityName || '',
        description: activity.description || '',
        type: (activity.activityType || 'INFO').toUpperCase(),
        time: new Date(activity.createdAt).toLocaleString(),
      });
    }

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.height = 20;
        row.alignment = { vertical: 'middle', wrapText: true };
      }
    });

    worksheet.autoFilter = {
      from: 'A1',
      to: { row: 1, column: 7 },
    };

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `user_activities_${new Date().toISOString().split('T')[0]}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Box
      component="main"
      sx={{
        flex: 1,
        overflowY: 'auto',
        px: { xs: 2, md: 3 },
        py: { xs: 2, md: 3 },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', lg: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', lg: 'center' },
          gap: 3,
          mb: 3,
        }}
      >
        <Box>
          <Typography
            variant="h5"
            sx={{ fontWeight: 600, fontSize: { xs: '1.25rem', sm: '1.5rem' }, mb: 0.75 }}
          >
            User Activities
          </Typography>
          <Typography sx={{ fontSize: '0.875rem', color: cv.textSecondary, maxWidth: 640 }}>
            Audit log of user actions across workspaces — uploads, deletes, restores, shares, and
            more.
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1.5,
            width: { xs: '100%', lg: 'auto' },
          }}
        >
          <FormControl size="small">
            <Select
              value={roleFilter}
              onChange={(e: SelectChangeEvent) => setRoleFilter(e.target.value)}
              displayEmpty
              IconComponent={KeyboardArrowDownIcon}
              sx={filterSelectSx}
              MenuProps={{
                slotProps: { paper: { sx: dropdownMenuPaperSx } },
              }}
            >
              <MenuItem value="ALL" sx={{ fontSize: '0.875rem' }}>
                All Roles
              </MenuItem>
              {roleOptions.map((role) => (
                <MenuItem key={role.id} value={role.name} sx={{ fontSize: '0.875rem' }}>
                  {role.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small">
            <Select
              value={typeFilter}
              onChange={(e: SelectChangeEvent) => setTypeFilter(e.target.value)}
              displayEmpty
              IconComponent={KeyboardArrowDownIcon}
              sx={filterSelectSx}
              MenuProps={{
                slotProps: { paper: { sx: dropdownMenuPaperSx } },
              }}
            >
              <MenuItem value="ALL" sx={{ fontSize: '0.875rem' }}>
                All Types
              </MenuItem>
              {ACTIVITY_TYPES.map((type) => (
                <MenuItem key={type} value={type} sx={{ fontSize: '0.875rem' }}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            type="date"
            size="small"
            label="Start Date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            slotProps={{
              inputLabel: { shrink: true },
              htmlInput: {
                min: getOneYearAgo(),
                max: endDate || getToday(),
              },
            }}
            sx={dateFieldSx}
          />

          <TextField
            type="date"
            size="small"
            label="End Date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            slotProps={{
              inputLabel: { shrink: true },
              htmlInput: {
                min: startDate || getOneYearAgo(),
                max: getToday(),
              },
            }}
            sx={dateFieldSx}
          />

          <TextField
            size="small"
            placeholder="Search activities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 18, color: cv.textMuted }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              minWidth: { xs: '100%', sm: 240 },
              '& .MuiOutlinedInput-root': {
                borderRadius: '10px',
                backgroundColor: cv.surface,
                '& fieldset': { borderColor: cv.border },
                '&:hover fieldset': { borderColor: cv.borderStrong },
                '&.Mui-focused fieldset': { borderColor: cv.borderFocus },
              },
            }}
          />

          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => void handleExport()}
            disabled={filteredActivities.length === 0}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              borderColor: cv.border,
              color: cv.textPrimary,
              height: 40,
              px: 1.75,
              '&:hover': {
                borderColor: cv.textSecondary,
                backgroundColor: cv.surface,
              },
            }}
          >
            Export
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer
          sx={{
            borderRadius: '12px',
            border: `1px solid ${cv.border}`,
            backgroundColor: cv.surface,
            overflowX: 'auto',
          }}
        >
          <Table sx={{ minWidth: 960 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={headerCellSx}>User</TableCell>
                <TableCell sx={headerCellSx}>Role</TableCell>
                <TableCell sx={headerCellSx}>Activity Name</TableCell>
                <TableCell sx={headerCellSx}>Activity Details</TableCell>
                <TableCell sx={headerCellSx}>Type</TableCell>
                <TableCell sx={headerCellSx}>Time</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredActivities.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    align="center"
                    sx={{ ...bodyCellSx, py: 8, color: cv.textMuted }}
                  >
                    No activities found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredActivities.map((activity) => {
                  const actionLabel = normalizeActionLabel(activity);
                  const typeLabel = (activity.activityType || 'INFO').toUpperCase();
                  const typeTone = typeLabel === 'ERROR' ? 'danger' : getActionTone(actionLabel);
                  const toneStyles = actionToneSx[typeTone];
                  const details = activity.description?.trim() || '—';

                  return (
                    <TableRow
                      key={activity.id}
                      sx={{
                        '&:last-child td': { borderBottom: 0 },
                        '&:hover td': { backgroundColor: cv.surfaceHover },
                      }}
                    >
                      <TableCell sx={{ ...bodyCellSx, minWidth: 180 }}>
                        <Typography
                          sx={{ fontSize: '0.875rem', fontWeight: 500, color: cv.textPrimary }}
                        >
                          {activity.userName || 'System'}
                        </Typography>
                        {activity.userEmail ? (
                          <Typography sx={{ mt: 0.25, fontSize: '0.75rem', color: cv.textMuted }}>
                            {activity.userEmail}
                          </Typography>
                        ) : null}
                      </TableCell>

                      <TableCell sx={{ ...bodyCellSx, minWidth: 120 }}>
                        <Typography sx={{ fontSize: '0.875rem', color: cv.textPrimary }}>
                          {activity.userRole || '—'}
                        </Typography>
                      </TableCell>

                      <TableCell sx={{ ...bodyCellSx, minWidth: 160 }}>
                        <Typography
                          sx={{ fontSize: '0.875rem', fontWeight: 500, color: cv.textPrimary }}
                        >
                          {activity.activityName || actionLabel}
                        </Typography>
                      </TableCell>

                      <TableCell sx={{ ...bodyCellSx, minWidth: 220, maxWidth: 400 }}>
                        <Typography
                          sx={{
                            fontSize: '0.875rem',
                            color: details === '—' ? cv.textMuted : cv.textSecondary,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {details}
                        </Typography>
                      </TableCell>

                      <TableCell sx={{ ...bodyCellSx, minWidth: 100 }}>
                        <Box
                          component="span"
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            px: 1,
                            py: 0.35,
                            borderRadius: '999px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            lineHeight: 1.2,
                            whiteSpace: 'nowrap',
                            ...toneStyles,
                          }}
                        >
                          {typeLabel}
                        </Box>
                      </TableCell>

                      <TableCell sx={{ ...bodyCellSx, whiteSpace: 'nowrap', minWidth: 150 }}>
                        <Typography sx={{ fontSize: '0.875rem', color: cv.textSecondary }}>
                          {formatActivityTime(activity.createdAt)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
