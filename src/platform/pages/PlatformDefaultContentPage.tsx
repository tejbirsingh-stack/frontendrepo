import { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import KeyboardArrowUpRoundedIcon from '@mui/icons-material/KeyboardArrowUpRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import {
  deleteDefaultContent,
  fetchDefaultContent,
  type PlatformDefaultContentItem,
  updateDefaultContent,
  uploadDefaultContent,
  uploadGlobalMediaChunked,
} from '../api/platformApi';
import {
  EmptyState,
  PageHeader,
  Panel,
  PlatformTableHead,
  PlatformTablePagination,
  StatusChip,
  formatBytes,
} from '../components/PlatformUi';
import { platformTableSx } from '../components/platformTableStyles';
import {
  usePaginatedRows,
  usePlatformTablePagination,
} from '../hooks/usePlatformTablePagination';
import { cv } from '../../theme/cssVars';

type LocalItem = PlatformDefaultContentItem & { localUrl?: string | null };


function assetTypeFromFile(file: File): string {
  const mime = file.type.toLowerCase();
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime.startsWith('video/')) return 'video';
  return 'document';
}

function FilePreview({ item }: Readonly<{ item: LocalItem }>) {
  const url = item.localUrl || item.previewUrl || null;

  if (item.assetType === 'image' && url) {
    return (
      <Box
        component="img"
        src={url}
        alt={item.title}
        sx={{
          width: '100%',
          maxHeight: 360,
          objectFit: 'contain',
          borderRadius: 1,
          bgcolor: cv.surfaceMuted || '#f5f5f5',
        }}
      />
    );
  }

  if (item.assetType === 'video' && url) {
    return (
      <Box
        component="video"
        src={url}
        controls
        sx={{ width: '100%', maxHeight: 360, borderRadius: 1, bgcolor: '#000' }}
      >
        <track kind="captions" />
      </Box>
    );
  }

  if (item.assetType === 'audio' && url) {
    return (
      <Box sx={{ py: 2 }}>
        <Box component="audio" src={url} controls sx={{ width: '100%' }}>
          <track kind="captions" />
        </Box>
      </Box>
    );
  }

  if (item.assetType === 'document' && url) {
    return (
      <Box
        component="iframe"
        src={url}
        title={item.title}
        sx={{ width: '100%', height: 360, border: `1px solid ${cv.border}`, borderRadius: 1 }}
      />
    );
  }

  return (
    <Box
      sx={{
        py: 6,
        px: 2,
        textAlign: 'center',
        borderRadius: 1,
        border: `1px dashed ${cv.border}`,
        bgcolor: cv.surfaceMuted || 'transparent',
      }}
    >
      <Typography sx={{ fontWeight: 600, mb: 0.5 }}>{item.fileName}</Typography>
      <Typography sx={{ fontSize: '0.875rem', color: cv.textMuted }}>
        Preview is not available for this file type in demo mode
      </Typography>
    </Box>
  );
}

export default function PlatformDefaultContentPage() {
  const [items, setItems] = useState<LocalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [viewItem, setViewItem] = useState<LocalItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LocalItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pagination = usePlatformTablePagination([items.length]);
  const paginatedItems = usePaginatedRows(items, pagination.page, pagination.rowsPerPage);

  const [uploadQueue, setUploadQueue] = useState<
    Array<{
      id: string;
      name: string;
      size: number;
      loadedBytes: number;
      progress: number;
      status: 'pending' | 'uploading' | 'completed' | 'failed';
    }>
  >([]);
  const [isWidgetVisible, setIsWidgetVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

  const totalFiles = uploadQueue.length;
  const isAllComplete = totalFiles > 0 && completedCount === totalFiles;
  const hasFailed = uploadQueue.some((item) => item.status === 'failed');
  const activeItemIndex = uploadQueue.findIndex((i) => i.status === 'uploading');
  const activeQueueItem = activeItemIndex !== -1 ? uploadQueue[activeItemIndex] : null;

  const totalBatchBytes = uploadQueue.reduce((acc, item) => acc + item.size, 0);
  const loadedBatchBytes = uploadQueue.reduce((acc, item) => acc + (item.loadedBytes || 0), 0);
  const overallPercent = totalBatchBytes > 0 ? Math.min(100, Math.round((loadedBatchBytes / totalBatchBytes) * 100)) : 0;

  const loadItems = async () => {
    try {
      setLoading(true);
      const res = await fetchDefaultContent();
      setItems(res?.items || []);
    } catch (err) {
      console.warn('Failed to load platform default content:', err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  // Auto-hide floating progress widget 3.5s after completion
  useEffect(() => {
    if (isAllComplete && isWidgetVisible) {
      const timer = window.setTimeout(() => {
        setIsWidgetVisible(false);
      }, 3500);
      return () => window.clearTimeout(timer);
    }
  }, [isAllComplete, isWidgetVisible]);

  const handleUpload = async (fileList: FileList | null) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;

    const queueItems = files.map((file, idx) => ({
      id: `queue-${Date.now()}-${idx}`,
      name: file.name,
      size: file.size,
      loadedBytes: 0,
      progress: 0,
      status: 'pending' as const,
    }));

    setUploadQueue(queueItems);
    setCompletedCount(0);
    setIsWidgetVisible(true);
    setIsMinimized(false);
    setUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const displayTitle = (title && files.length === 1) ? title.trim() : file.name.replace(/\.[^/.]+$/, '');

        setUploadQueue((prev) =>
          prev.map((item, idx) => (idx === i ? { ...item, status: 'uploading' } : item)),
        );

        await uploadGlobalMediaChunked(file, displayTitle, (loaded) => {
          const percent = Math.min(100, Math.round((loaded / file.size) * 100));
          setUploadQueue((prev) =>
            prev.map((item, idx) =>
              idx === i ? { ...item, progress: percent, loadedBytes: loaded } : item,
            ),
          );
        });

        setUploadQueue((prev) =>
          prev.map((item, idx) =>
            idx === i ? { ...item, status: 'completed', progress: 100, loadedBytes: file.size } : item,
          ),
        );
        setCompletedCount((prev) => prev + 1);
      }

      await loadItems();
      setTitle('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      console.error('Upload error:', err);
      setUploadQueue((prev) =>
        prev.map((item) => (item.status === 'uploading' ? { ...item, status: 'failed' } : item)),
      );
    } finally {
      setUploading(false);
    }
  };

  const toggleEnabled = async (item: LocalItem) => {
    setBusyId(item.id);
    try {
      const nextState = !item.isEnabled;
      setItems((prev) =>
        prev.map((row) => (row.id === item.id ? { ...row, isEnabled: nextState } : row)),
      );
      await updateDefaultContent(item.id, { isEnabled: nextState });
    } catch (err: any) {
      console.error('Toggle error:', err);
      setItems((prev) =>
        prev.map((row) => (row.id === item.id ? { ...row, isEnabled: item.isEnabled } : row)),
      );
    } finally {
      setBusyId('');
    }
  };

  const rename = async (item: LocalItem, nextTitle: string) => {
    const trimmed = nextTitle.trim();
    if (!trimmed || trimmed === item.title) return;
    setBusyId(item.id);
    try {
      setItems((prev) =>
        prev.map((row) => (row.id === item.id ? { ...row, title: trimmed } : row)),
      );
      await updateDefaultContent(item.id, { title: trimmed });
    } catch (err: any) {
      console.error('Rename error:', err);
      setItems((prev) =>
        prev.map((row) => (row.id === item.id ? { ...row, title: item.title } : row)),
      );
    } finally {
      setBusyId('');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setBusyId(deleteTarget.id);
    try {
      if (deleteTarget.localUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(deleteTarget.localUrl);
      }
      const targetId = deleteTarget.id;
      setItems((prev) => prev.filter((row) => row.id !== targetId));
      if (viewItem?.id === targetId) setViewItem(null);
      await deleteDefaultContent(targetId);
      setDeleteTarget(null);
    } catch (err: any) {
      console.error('Delete error:', err);
      await loadItems();
    } finally {
      setIsDeleting(false);
      setBusyId('');
    }
  };

  return (
    <Box>
      <PageHeader
        title="Default content"
        subtitle="Files configured here are copied into every new user's default workspace"
      />

      <Panel title="Add starter file" subtitle="Upload media that new organizations receive on signup" sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            label="Display title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            sx={{ minWidth: 240 }}
          />
          <Button
            variant="contained"
            component="label"
            disabled={uploading}
            startIcon={<CloudUploadOutlinedIcon />}
            sx={{ textTransform: 'none' }}
          >
            {uploading ? 'Uploading…' : 'Upload file'}
            <input
              ref={fileInputRef}
              hidden
              type="file"
              onChange={(e) => handleUpload(e.target.files)}
            />
          </Button>
        </Box>
      </Panel>

      <Panel
        title={`${items.length} starter file${items.length === 1 ? '' : 's'}`}
        subtitle="Enabled files are provisioned for new users"
      >
        {items.length === 0 ? (
          <EmptyState message="No default content yet — upload files above" />
        ) : (
          <>
            <Table size="small" sx={platformTableSx}>
              <PlatformTableHead
                columns={[
                  { id: 'title', label: 'Title' },
                  { id: 'type', label: 'Type' },
                  { id: 'size', label: 'Size' },
                  { id: 'enabled', label: 'Enabled' },
                  { id: 'added', label: 'Added' },
                  { id: 'actions', label: 'Actions', align: 'right' },
                ]}
              />
              <TableBody>
                {paginatedItems.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <TextField
                        size="small"
                        defaultValue={item.title}
                        key={`${item.id}-${item.title}`}
                        disabled={busyId === item.id}
                        onBlur={(e) => rename(item, e.target.value)}
                        sx={{ minWidth: 200 }}
                      />
                      <Typography
                        variant="caption"
                        sx={{ display: 'block', color: cv.textMuted, mt: 0.25 }}
                      >
                        {item.fileName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <StatusChip label={item.assetType} />
                    </TableCell>
                    <TableCell>{formatBytes(item.sizeBytes)}</TableCell>
                    <TableCell>
                      <Switch
                        size="small"
                        checked={item.isEnabled}
                        disabled={busyId === item.id}
                        onChange={() => toggleEnabled(item)}
                      />
                    </TableCell>
                    <TableCell>
                      {item.createdAt ? new Date(item.createdAt).toLocaleString() : '—'}
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        startIcon={<VisibilityOutlinedIcon sx={{ fontSize: 16 }} />}
                        sx={{ textTransform: 'none', mr: 0.5 }}
                        onClick={() => setViewItem(item)}
                      >
                        View
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        disabled={busyId === item.id}
                        sx={{ textTransform: 'none' }}
                        onClick={() => setDeleteTarget(item)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PlatformTablePagination
              count={items.length}
              page={pagination.page}
              rowsPerPage={pagination.rowsPerPage}
              onPageChange={pagination.onPageChange}
              onRowsPerPageChange={pagination.onRowsPerPageChange}
            />
          </>
        )}
      </Panel>

      <Dialog
        open={Boolean(viewItem)}
        onClose={() => setViewItem(null)}
        maxWidth="md"
        fullWidth
        aria-labelledby="default-content-view-title"
      >
        {viewItem ? (
          <>
            <DialogTitle id="default-content-view-title">{viewItem.title}</DialogTitle>
            <DialogContent dividers>
              <Box sx={{ display: 'grid', gap: 1, mb: 2 }}>
                <Typography sx={{ fontSize: '0.875rem' }}>
                  <Box component="span" sx={{ color: cv.textMuted }}>File: </Box>
                  {viewItem.fileName}
                </Typography>
                <Typography sx={{ fontSize: '0.875rem' }}>
                  <Box component="span" sx={{ color: cv.textMuted }}>Type: </Box>
                  {viewItem.assetType} · {viewItem.mimeType}
                </Typography>
                <Typography sx={{ fontSize: '0.875rem' }}>
                  <Box component="span" sx={{ color: cv.textMuted }}>Size: </Box>
                  {formatBytes(viewItem.sizeBytes)}
                </Typography>
                <Typography sx={{ fontSize: '0.875rem' }}>
                  <Box component="span" sx={{ color: cv.textMuted }}>Path: </Box>
                  {viewItem.filePath}
                </Typography>
              </Box>
              <FilePreview item={viewItem} />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setViewItem(null)} sx={{ textTransform: 'none' }}>
                Close
              </Button>
            </DialogActions>
          </>
        ) : null}
      </Dialog>

      {/* Permanent Delete Warning Confirmation Modal */}
      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => !isDeleting && setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
          <ErrorOutlineRoundedIcon sx={{ color: '#ef4444', fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Permanent Delete Warning
          </Typography>
        </DialogTitle>
        <DialogContent dividers sx={{ py: 2 }}>
          <Typography sx={{ mb: 1.5, fontSize: '0.95rem' }}>
            Are you sure you want to permanently delete{' '}
            <strong>"{deleteTarget?.title || deleteTarget?.fileName}"</strong>?
          </Typography>
          <Box
            sx={{
              bgcolor: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: 1.5,
              p: 1.5,
            }}
          >
            <Typography variant="caption" sx={{ color: '#ef4444', fontWeight: 500, display: 'block', lineHeight: 1.5 }}>
              ⚠️ <strong>Warning:</strong> This file will be permanently deleted from Backblaze B2 storage, database assets table, and removed from all workspaces. This action cannot be undone.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, justifyContent: 'flex-end', gap: 1 }}>
          <Button
            variant="outlined"
            disabled={isDeleting}
            onClick={() => setDeleteTarget(null)}
            sx={{ textTransform: 'none', borderRadius: 1.5 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={isDeleting}
            onClick={handleConfirmDelete}
            startIcon={isDeleting ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ textTransform: 'none', borderRadius: 1.5, bgcolor: '#ef4444', '&:hover': { bgcolor: '#dc2626' } }}
          >
            {isDeleting ? 'Deleting...' : 'Delete Permanently'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Upload Progress Widget (Bottom Right) */}
      {isWidgetVisible && totalFiles > 0 && (
        <Box
          sx={{
            position: 'fixed',
            bottom: { xs: 16, sm: 24 },
            right: { xs: 16, sm: 24 },
            zIndex: 1400,
            maxWidth: { xs: 'calc(100vw - 32px)', sm: 380 },
            width: '100%',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <Card
            elevation={12}
            sx={{
              borderRadius: '16px',
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              backdropFilter: 'blur(16px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 20px rgba(99, 102, 241, 0.15)',
              color: '#f8fafc',
              overflow: 'hidden',
            }}
          >
            {/* Header Bar */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 2,
                py: 1.5,
                cursor: 'pointer',
                userSelect: 'none',
                borderBottom: isMinimized ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
              }}
              onClick={() => setIsMinimized((prev) => !prev)}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                {uploading ? (
                  <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                    <CircularProgress
                      variant="determinate"
                      value={overallPercent}
                      size={26}
                      thickness={4.5}
                      sx={{ color: '#818cf8' }}
                    />
                    <Box
                      sx={{
                        top: 0,
                        left: 0,
                        bottom: 0,
                        right: 0,
                        position: 'absolute',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CloudUploadOutlinedIcon sx={{ fontSize: 13, color: '#a5b4fc' }} />
                    </Box>
                  </Box>
                ) : isAllComplete ? (
                  <CheckCircleOutlineRoundedIcon sx={{ color: '#4ade80', fontSize: 24 }} />
                ) : hasFailed ? (
                  <ErrorOutlineRoundedIcon sx={{ color: '#f87171', fontSize: 24 }} />
                ) : (
                  <CloudUploadOutlinedIcon sx={{ color: '#818cf8', fontSize: 24 }} />
                )}

                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      color: '#f8fafc',
                      lineHeight: 1.2,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {isAllComplete
                      ? 'All files uploaded'
                      : uploading
                      ? `Uploading (${completedCount}/${totalFiles})`
                      : 'Upload Queue'}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block' }}
                  >
                    {isAllComplete
                      ? `${totalFiles} file${totalFiles > 1 ? 's' : ''} completed`
                      : `${overallPercent}% completed`}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMinimized((prev) => !prev);
                  }}
                  sx={{ color: '#94a3b8', '&:hover': { color: '#f8fafc' } }}
                >
                  {isMinimized ? (
                    <KeyboardArrowUpRoundedIcon fontSize="small" />
                  ) : (
                    <KeyboardArrowDownRoundedIcon fontSize="small" />
                  )}
                </IconButton>

                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsWidgetVisible(false);
                  }}
                  sx={{ color: '#94a3b8', '&:hover': { color: '#f8fafc' } }}
                >
                  <CloseRoundedIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>

            {/* Collapsible Detail Section */}
            <Collapse in={!isMinimized}>
              <Box sx={{ p: 2, pt: 1.5 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '0.8125rem',
                    color: '#cbd5e1',
                    mb: 1,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {activeQueueItem
                    ? `Uploading file ${activeItemIndex + 1} of ${totalFiles}: ${activeQueueItem.name}`
                    : isAllComplete
                    ? 'All starter files are now ready.'
                    : 'Processing files...'}
                </Typography>

                <LinearProgress
                  variant="determinate"
                  value={activeQueueItem ? activeQueueItem.progress : isAllComplete ? 100 : 0}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 3,
                      backgroundColor: '#6366f1',
                    },
                    mb: 1,
                  }}
                />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                    {activeQueueItem
                      ? `${formatBytes(activeQueueItem.loadedBytes)} of ${formatBytes(activeQueueItem.size)}`
                      : isAllComplete
                      ? '100%'
                      : '0 B'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#cbd5e1', fontWeight: 600, fontSize: '0.75rem' }}>
                    {activeQueueItem ? `${activeQueueItem.progress}%` : isAllComplete ? '100%' : '0%'}
                  </Typography>
                </Box>
              </Box>
            </Collapse>
          </Card>
        </Box>
      )}
    </Box>
  );
}
