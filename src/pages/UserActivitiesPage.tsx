import { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, TablePagination, TextField, InputAdornment, FormControl, Select, MenuItem, Button } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import ExcelJS from 'exceljs';
import { cv } from '../theme/cssVars';
import { apiClient } from '../api/client';

const getOneYearAgo = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return d.toISOString().split('T')[0];
};
const getToday = () => new Date().toISOString().split('T')[0];

export default function UserActivitiesPage() {
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [startDate, setStartDate] = useState(getOneYearAgo());
  const [endDate, setEndDate] = useState(getToday());
  const ACTIVITY_TYPE = {
    INFO: 'INFO',
    ERROR: 'ERROR'
  }

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await apiClient.get<any>('/users/user-activities');
        if (response?.success) {
          setActivities(response.activities || []);
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
        }
      } catch (error) {
        console.error('Failed to fetch roles:', error);
      }
    };
    fetchActivities();
    fetchRoles();
  }, []);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredActivities = activities.filter((activity) => {
    if (typeFilter !== 'ALL' && activity.activityType !== typeFilter) {
      return false;
    }
    if (roleFilter !== 'ALL' && activity.userRole !== roleFilter) {
      return false;
    }

    if (startDate) {
      const activityDate = new Date(activity.createdAt).getTime();
      const filterStart = new Date(startDate).getTime();
      if (activityDate < filterStart) return false;
    }

    if (endDate) {
      const activityDate = new Date(activity.createdAt).getTime();
      const filterEnd = new Date(endDate).getTime() + (24 * 60 * 60 * 1000); // include end day
      if (activityDate >= filterEnd) return false;
    }

    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const timeString = new Date(activity.createdAt).toLocaleString().toLowerCase();
    return (
      (activity.userName && activity.userName.toLowerCase().includes(query)) ||
      (activity.userEmail && activity.userEmail.toLowerCase().includes(query)) ||
      (activity.userRole && activity.userRole.toLowerCase().includes(query)) ||
      (activity.activityName && activity.activityName.toLowerCase().includes(query)) ||
      (activity.description && activity.description.toLowerCase().includes(query)) ||
      (activity.activityType && activity.activityType.toLowerCase().includes(query)) ||
      timeString.includes(query)
    );
  });

  const paginatedActivities = filteredActivities.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleExport = async () => {
    if (filteredActivities.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('User Activities');

    // Define columns
    worksheet.columns = [
      { header: 'User', key: 'user', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Role', key: 'role', width: 15 },
      { header: 'Activity Name', key: 'activityName', width: 25 },
      { header: 'Description', key: 'description', width: 50 },
      { header: 'Type', key: 'type', width: 15 },
      { header: 'Time', key: 'time', width: 25 }
    ];

    // Style the header row
    const headerRow = worksheet.getRow(1);
    headerRow.height = 25; // Increase height for headings
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1976D2' } // Solid blue background
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    // Add rows
    for (const activity of filteredActivities) {
      worksheet.addRow({
        user: activity.userName || 'System',
        email: activity.userEmail || '',
        role: activity.userRole || '-',
        activityName: activity.activityName || '',
        description: activity.description || '',
        type: activity.activityType || 'INFO',
        time: new Date(activity.createdAt).toLocaleString()
      });
    }

    // Set height and styling for data rows
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.height = 20; // Set custom height for data rows
        row.alignment = { vertical: 'middle', wrapText: true };
      }
    });

    // Enable auto-filter for all columns to allow easy filtering
    worksheet.autoFilter = {
      from: 'A1',
      to: { row: 1, column: 7 }
    };

    // Generate Excel File
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `user_activities_${new Date().toISOString().split('T')[0]}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box component="main" sx={{ flex: 1, overflowY: 'auto', px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', lg: 'center' }, gap: 3, mb: 3 }}>
        <Box sx={{ mb: { xs: 1, lg: 0 } }}>
          <Typography variant="h5" sx={{ fontWeight: 600, fontSize: '1.375rem', mb: 0.5 }}>
            User Activities
          </Typography>
          <Typography sx={{ fontSize: '0.875rem', color: cv.textSecondary }}>
            View the complete audit log of activities in your organization.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, width: { xs: '100%', lg: 'auto' } }}>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <Select
              value={roleFilter}
              onChange={(e: SelectChangeEvent) => {
                setRoleFilter(e.target.value);
                setPage(0);
              }}
              displayEmpty
              sx={{
                borderRadius: '10px',
                backgroundColor: cv.surface,
                '& .MuiOutlinedInput-notchedOutline': { borderColor: cv.border },
              }}
            >
              <MenuItem value="ALL">All Roles</MenuItem>
              {roles.map((role: any) => (
                <MenuItem key={role.id} value={role.name}>{role.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={typeFilter}
              onChange={(e: SelectChangeEvent) => {
                setTypeFilter(e.target.value);
                setPage(0);
              }}
              displayEmpty
              sx={{
                borderRadius: '10px',
                backgroundColor: cv.surface,
                '& .MuiOutlinedInput-notchedOutline': { borderColor: cv.border },
              }}
            >
              <MenuItem value="ALL">All Types</MenuItem>
              {Object.keys(ACTIVITY_TYPE).map((key) => (
                <MenuItem key={key} value={ACTIVITY_TYPE[key]}>{ACTIVITY_TYPE[key]}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            type="date"
            size="small"
            label="Start Date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(0);
            }}
            slotProps={{
              inputLabel: { shrink: true },
              htmlInput: {
                min: getOneYearAgo(),
                max: endDate || getToday()
              }
            }}
            sx={{
              minWidth: 140,
              '& .MuiOutlinedInput-root': {
                borderRadius: '10px',
                backgroundColor: cv.surface,
                '& fieldset': { borderColor: cv.border },
              },
              '& .MuiInputBase-input': {
                cursor: 'pointer',
              },
              '& ::-webkit-calendar-picker-indicator': {
                cursor: 'pointer',
              }
            }}
          />
          <TextField
            type="date"
            size="small"
            label="End Date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(0);
            }}
            slotProps={{
              inputLabel: { shrink: true },
              htmlInput: {
                min: startDate || getOneYearAgo(),
                max: getToday()
              }
            }}
            sx={{
              minWidth: 140,
              '& .MuiOutlinedInput-root': {
                borderRadius: '10px',
                backgroundColor: cv.surface,
                '& fieldset': { borderColor: cv.border },
              },
              '& .MuiInputBase-input': {
                cursor: 'pointer',
              },
              '& ::-webkit-calendar-picker-indicator': {
                cursor: 'pointer',
              }
            }}
          />

          <TextField
            size="small"
            placeholder="Search activities..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0); // Reset page on search
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
            sx={{
              minWidth: { xs: '100%', sm: 260 },
              '& .MuiOutlinedInput-root': {
                borderRadius: '10px',
                backgroundColor: cv.surface,
                '& fieldset': { borderColor: cv.border },
              },
            }}
          />

          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            disabled={filteredActivities.length === 0}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              borderColor: cv.border,
              color: cv.textPrimary,
              height: 40,
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
        <Paper sx={{ borderRadius: '12px', border: `1px solid ${cv.border}`, boxShadow: 'none', background: cv.surface, overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'var(--noah-footer-tint)' }}>
                  <TableCell sx={{ fontWeight: 600, color: cv.textSecondary }}>User</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: cv.textSecondary }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: cv.textSecondary }}>Activity Name</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: cv.textSecondary, width: { xs: 200, sm: 300, md: 400 } }}>Activity Details</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: cv.textSecondary }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: cv.textSecondary }}>Time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {activities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6, color: cv.textMuted }}>
                      No activities found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedActivities.map((activity) => (
                    <TableRow key={activity.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell>
                        <Typography sx={{ fontSize: '0.875rem', color: cv.textPrimary }}>{activity.userName || 'System'}</Typography>
                        {activity.userEmail && (
                          <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted }}>{activity.userEmail}</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: '0.875rem', color: cv.textPrimary }}>{activity.userRole || '-'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 500, fontSize: '0.875rem', color: cv.textPrimary }}>{activity.activityName}</Typography>
                      </TableCell>
                      <TableCell sx={{ maxWidth: { xs: 200, sm: 300, md: 400 } }}>
                        <Typography
                          sx={{
                            fontSize: '0.875rem',
                            color: cv.textSecondary,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {activity.description || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={activity.activityType || 'INFO'}
                          size="small"
                          sx={{
                            fontSize: '0.75rem',
                            height: 24,
                            fontWeight: 500,
                            backgroundColor: activity.activityType === 'ERROR' ? '#fdeded' : cv.blueGlow18,
                            color: activity.activityType === 'ERROR' ? '#5f2120' : cv.blueSolid,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: '0.875rem', color: cv.textSecondary }}>
                          {new Date(activity.createdAt).toLocaleString()}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredActivities.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      )}
    </Box>
  );
}
