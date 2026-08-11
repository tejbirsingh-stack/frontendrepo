import { useRef, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import type { PlatformDefaultContentItem } from '../api/platformApi';
import { EmptyState, PageHeader, Panel, StatusChip, formatBytes } from '../components/PlatformUi';
import { cv } from '../../theme/cssVars';

type LocalItem = PlatformDefaultContentItem & { localUrl?: string | null };

const DUMMY_ITEMS: LocalItem[] = [
  {
    id: 'dummy-1',
    title: 'Welcome guide',
    fileName: 'welcome-guide.pdf',
    filePath: 'platform-default-content/files/welcome-guide.pdf',
    mimeType: 'application/pdf',
    sizeBytes: '245760',
    assetType: 'document',
    sortOrder: 0,
    isEnabled: true,
    createdAt: '2026-08-01T10:00:00.000Z',
  },
  {
    id: 'dummy-2',
    title: 'Brand kit cover',
    fileName: 'brand-kit-cover.png',
    filePath: 'platform-default-content/images/brand-kit-cover.png',
    mimeType: 'image/png',
    sizeBytes: '1048576',
    assetType: 'image',
    sortOrder: 1,
    isEnabled: true,
    createdAt: '2026-08-02T14:30:00.000Z',
    localUrl: 'https://picsum.photos/seed/noah-brand/960/540',
  },
  {
    id: 'dummy-3',
    title: 'Sample interview clip',
    fileName: 'sample-interview.mp4',
    filePath: 'platform-default-content/videos/sample-interview.mp4',
    mimeType: 'video/mp4',
    sizeBytes: '15728640',
    assetType: 'video',
    sortOrder: 2,
    isEnabled: false,
    createdAt: '2026-08-05T09:15:00.000Z',
    localUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  },
  {
    id: 'dummy-4',
    title: 'Podcast intro sting',
    fileName: 'podcast-intro.mp3',
    filePath: 'platform-default-content/audios/podcast-intro.mp3',
    mimeType: 'audio/mpeg',
    sizeBytes: '524288',
    assetType: 'audio',
    sortOrder: 3,
    isEnabled: true,
    createdAt: '2026-08-08T16:45:00.000Z',
    localUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  },
];

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
  const [items, setItems] = useState<LocalItem[]>(DUMMY_ITEMS);
  const [busyId, setBusyId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [viewItem, setViewItem] = useState<LocalItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleUpload = (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) return;
    setUploading(true);
    const displayTitle = title.trim() || file.name.replace(/\.[^/.]+$/, '') || file.name;
    const localUrl = URL.createObjectURL(file);
    const next: LocalItem = {
      id: `dummy-${Date.now()}`,
      title: displayTitle,
      fileName: file.name,
      filePath: `platform-default-content/local/${file.name}`,
      mimeType: file.type || 'application/octet-stream',
      sizeBytes: String(file.size),
      assetType: assetTypeFromFile(file),
      sortOrder: items.length,
      isEnabled: true,
      createdAt: new Date().toISOString(),
      localUrl,
    };
    setItems((prev) => [...prev, next]);
    setTitle('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setUploading(false);
  };

  const toggleEnabled = (item: LocalItem) => {
    setBusyId(item.id);
    setItems((prev) =>
      prev.map((row) => (row.id === item.id ? { ...row, isEnabled: !row.isEnabled } : row)),
    );
    setBusyId('');
  };

  const rename = (item: LocalItem, nextTitle: string) => {
    const trimmed = nextTitle.trim();
    if (!trimmed || trimmed === item.title) return;
    setBusyId(item.id);
    setItems((prev) =>
      prev.map((row) => (row.id === item.id ? { ...row, title: trimmed } : row)),
    );
    setBusyId('');
  };

  const remove = (item: LocalItem) => {
    if (!window.confirm(`Remove "${item.title}" from default content?`)) return;
    setBusyId(item.id);
    if (item.localUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(item.localUrl);
    }
    setItems((prev) => prev.filter((row) => row.id !== item.id));
    if (viewItem?.id === item.id) setViewItem(null);
    setBusyId('');
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
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Size</TableCell>
                <TableCell>Enabled</TableCell>
                <TableCell>Added</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>
                    <TextField
                      size="small"
                      defaultValue={item.title}
                      key={`${item.id}-${item.title}`}
                      disabled={busyId === item.id}
                      onBlur={(e) => rename(item, e.target.value)}
                      sx={{ minWidth: 200 }}
                      inputProps={{ 'aria-label': `Title for ${item.fileName}` }}
                    />
                    <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted, mt: 0.5 }}>
                      {item.fileName}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <StatusChip status={item.assetType} />
                  </TableCell>
                  <TableCell>{formatBytes(item.sizeBytes)}</TableCell>
                  <TableCell>
                    <Switch
                      checked={item.isEnabled}
                      disabled={busyId === item.id}
                      onChange={() => toggleEnabled(item)}
                      inputProps={{ 'aria-label': `Enable ${item.title}` }}
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
                      onClick={() => remove(item)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
    </Box>
  );
}
