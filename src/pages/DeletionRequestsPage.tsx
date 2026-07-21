import { useEffect, useState } from 'react';
import { Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from '@mui/material';
import { cv } from '../theme/cssVars';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import GlassCard from '../components/GlassCard';

interface PendingDeletion {
  id: string;
  title: string;
  status: string;
  deletedAt: string;
  deletedBy: {
    name: string;
    roleRelation?: { name: string };
  };
}

export default function DeletionRequestsPage() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<PendingDeletion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/media/pending-deletions');
      setRequests((res as any) || []);
    } catch (error) {
      console.error('Error fetching deletion requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await apiClient.post(`/media/${id}/admin-approve`);
      fetchRequests(); // refresh list
    } catch (error) {
      console.error(error);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await apiClient.post(`/media/${id}/reject`);
      fetchRequests(); // refresh list
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Box sx={{ p: 4, height: '100%', overflowY: 'auto' }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: cv.textPrimary }}>
        Deletion Requests
      </Typography>

      <GlassCard sx={{ p: 0, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: cv.surfaceHover }}>
              <TableRow>
                <TableCell sx={{ color: cv.textSecondary, fontWeight: 600 }}>File Name</TableCell>
                <TableCell sx={{ color: cv.textSecondary, fontWeight: 600 }}>Requested By</TableCell>
                <TableCell sx={{ color: cv.textSecondary, fontWeight: 600 }}>Role</TableCell>
                <TableCell sx={{ color: cv.textSecondary, fontWeight: 600 }}>Status</TableCell>
                <TableCell align="right" sx={{ color: cv.textSecondary, fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3, color: cv.textMuted }}>Loading requests...</TableCell>
                </TableRow>
              ) : requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3, color: cv.textMuted }}>No pending deletion requests.</TableCell>
                </TableRow>
              ) : (
                requests.map((req) => (
                  <TableRow key={req.id} hover>
                    <TableCell sx={{ color: cv.textPrimary }}>{req.title}</TableCell>
                    <TableCell sx={{ color: cv.textPrimary }}>{req.deletedBy?.name || 'Unknown'}</TableCell>
                    <TableCell>
                      <Chip size="small" label={req.deletedBy?.roleRelation?.name || 'Unknown'} sx={{ backgroundColor: cv.surfaceActive, color: cv.textPrimary }} />
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label="Pending Review" color="warning" variant="outlined" />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Button 
                          size="small" 
                          variant="outlined" 
                          onClick={() => navigate(`/media/${req.id}`)} 
                          sx={{ borderColor: cv.brandBlue, color: cv.brandBlue }}
                        >
                          View
                        </Button>
                        <Button 
                          size="small" 
                          variant="contained" 
                          onClick={() => handleApprove(req.id)} 
                          sx={{ backgroundColor: cv.brandBlue, '&:hover': { backgroundColor: cv.brandBlueHover } }}
                        >
                          Accept
                        </Button>
                        <Button 
                          size="small" 
                          variant="outlined" 
                          color="error" 
                          onClick={() => handleReject(req.id)}
                        >
                          Reject
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </GlassCard>
    </Box>
  );
}
