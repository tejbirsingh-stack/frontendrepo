import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Switch,
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import {
  fetchDashboardNotification,
  updateDashboardNotification,
  uploadNotificationImage,
  deleteNotificationImage,
  type DashboardNotificationSettings,
  type DashboardNotificationImage,
} from '../api/platformApi';
import { PageHeader, Panel } from '../components/PlatformUi';
import { cv } from '../../theme/cssVars';
import {
  createLocalNotificationImage,
  fileToDataUrl,
  isLocalNotificationImage,
  readLocalDashboardNotification,
  writeLocalDashboardNotification,
} from '../utils/localDashboardNotification';

export default function PlatformNotificationPopupPage() {
  const [notification, setNotification] = useState<DashboardNotificationSettings>({
    isEnabled: false,
    title: '',
    body: '',
    ctaLabel: '',
    ctaUrl: '',
    images: [],
  });
  const [savingNotification, setSavingNotification] = useState(false);
  const [uploadingNotifImage, setUploadingNotifImage] = useState(false);
  const [usingLocalFallback, setUsingLocalFallback] = useState(false);
  const notifImageInputRef = useRef<HTMLInputElement>(null);
  const [imageToDelete, setImageToDelete] = useState<DashboardNotificationImage | null>(null);
  const [deletingImage, setDeletingImage] = useState(false);

  useEffect(() => {
    const local = readLocalDashboardNotification();
    fetchDashboardNotification()
      .then((res) => {
        if (!res.notification) {
          if (local) {
            setNotification(local);
            setUsingLocalFallback(true);
          }
          return;
        }

        if (local?.updatedAt) {
          const remoteTs = res.notification.updatedAt
            ? Date.parse(res.notification.updatedAt)
            : 0;
          const localTs = Date.parse(local.updatedAt);
          if (localTs >= remoteTs) {
            setNotification(local);
            setUsingLocalFallback(true);
            return;
          }
        }

        setNotification(res.notification);
        setUsingLocalFallback(false);
      })
      .catch((err) => {
        console.error('Failed to load dashboard notification', err);
        if (local) {
          setNotification(local);
          setUsingLocalFallback(true);
          toast.success('Loaded local notification draft (API unavailable)');
        }
      });
  }, []);

  const persistLocally = (next: DashboardNotificationSettings) => {
    const saved = writeLocalDashboardNotification(next);
    setNotification(saved);
    setUsingLocalFallback(true);
    return saved;
  };

  const handleSaveNotification = async () => {
    if (notification.isEnabled) {
      if (!notification.title?.trim() || !notification.body?.trim()) {
        toast.error('Popup Title and Message Body are required when enabled.');
        return;
      }
    }

    setSavingNotification(true);
    try {
      const res = await updateDashboardNotification(notification);
      if (res.notification) {
        // Keep any locally uploaded images that the API cannot store yet
        const localOnlyImages = (notification.images || []).filter(isLocalNotificationImage);
        const merged: DashboardNotificationSettings = {
          ...res.notification,
          images: [...(res.notification.images || []), ...localOnlyImages],
        };
        if (localOnlyImages.length > 0) {
          persistLocally(merged);
          toast.success('Settings saved to API. Local images kept for preview.');
        } else {
          setNotification(res.notification);
          setUsingLocalFallback(false);
          writeLocalDashboardNotification(res.notification);
          toast.success('Dashboard Notification settings saved successfully');
        }
      } else {
        toast.success('Dashboard Notification settings saved successfully');
      }
    } catch (err) {
      console.error('Failed to save dashboard notification:', err);
      persistLocally(notification);
      toast.success('Saved locally for preview (API save unavailable)');
    } finally {
      setSavingNotification(false);
    }
  };

  const handlePreview = () => {
    if (!notification.title?.trim() || !notification.body?.trim()) {
      toast.error('Add a title and message body before previewing.');
      return;
    }
    window.dispatchEvent(
      new CustomEvent('open-dashboard-notification', {
        detail: {
          notification: {
            ...notification,
            isEnabled: true,
            updatedAt: notification.updatedAt || new Date().toISOString(),
          },
        },
      }),
    );
  };

  const handleUploadImage = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed');
      return;
    }
    if ((notification.images?.length || 0) >= 10) {
      toast.error('Maximum limit of 10 images reached');
      return;
    }

    setUploadingNotifImage(true);
    try {
      const res = await uploadNotificationImage(file);
      if (res.image) {
        setNotification((prev) => ({
          ...prev,
          images: [...prev.images, res.image],
        }));
        setUsingLocalFallback(false);
        toast.success('Image uploaded successfully');
      }
    } catch (err) {
      console.error('Image upload failed — using local preview image', err);
      try {
        const dataUrl = await fileToDataUrl(file);
        const localImage = createLocalNotificationImage(
          file,
          dataUrl,
          notification.images?.length || 0,
        );
        const next = {
          ...notification,
          images: [...(notification.images || []), localImage],
        };
        persistLocally(next);
        toast.success('Image stored locally for preview (cloud upload unavailable)');
      } catch (localErr) {
        console.error(localErr);
        toast.error('Failed to upload image');
      }
    } finally {
      setUploadingNotifImage(false);
      if (notifImageInputRef.current) notifImageInputRef.current.value = '';
    }
  };

  return (
    <Box>
      <PageHeader
        title="Notification Popup"
        subtitle="Configure a welcome popup shown to all users when they log into the dashboard"
      />

      {usingLocalFallback && (
        <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
          Local preview mode is active. Settings and images are stored in this browser so you can
          design the popup without cloud upload/save. Use Preview to open the branded notification.
        </Alert>
      )}

      <Panel title="Configuration" subtitle="Manage the content and media of the popup">
        <Box sx={{ display: 'grid', gap: 3, maxWidth: 620 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Switch
              checked={notification.isEnabled}
              onChange={(e) => setNotification({ ...notification, isEnabled: e.target.checked })}
              color="primary"
            />
            <Typography sx={{ fontWeight: 500 }}>
              Enable dashboard notification popup
            </Typography>
          </Box>

          <TextField
            label="Popup Title"
            size="small"
            fullWidth
            value={notification.title}
            onChange={(e) => setNotification({ ...notification, title: e.target.value })}
            placeholder="e.g., Vision in Focus"
            disabled={!notification.isEnabled}
          />

          <TextField
            label="Message Body"
            size="small"
            fullWidth
            multiline
            rows={4}
            value={notification.body}
            onChange={(e) => setNotification({ ...notification, body: e.target.value })}
            placeholder="Enter the main message content here..."
            disabled={!notification.isEnabled}
          />

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              label="CTA Button Label (Optional)"
              size="small"
              fullWidth
              value={notification.ctaLabel}
              onChange={(e) => setNotification({ ...notification, ctaLabel: e.target.value })}
              placeholder="e.g., Learn More"
              disabled={!notification.isEnabled}
            />
            <TextField
              label="CTA URL (Optional)"
              size="small"
              fullWidth
              value={notification.ctaUrl}
              onChange={(e) => setNotification({ ...notification, ctaUrl: e.target.value })}
              placeholder="https://..."
              disabled={!notification.isEnabled}
            />
          </Box>

          <Box
            sx={{
              borderTop: `1px solid ${cv.border}`,
              pt: 2,
            }}
          >
            <Typography sx={{ fontWeight: 600, mb: 0.5, fontSize: '0.875rem' }}>
              Popup Images
            </Typography>
            <Typography sx={{ fontSize: '0.8125rem', color: cv.textMuted, mb: 2 }}>
              Primary image appears on the left of the branded popup. Max 10. Falls back to local
              storage when cloud upload is unavailable.
            </Typography>

            {(notification.images || []).length > 0 && (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                  gap: 1.5,
                  mb: 2,
                }}
              >
                {notification.images.map((img: DashboardNotificationImage) => (
                  <Box
                    key={img.id}
                    sx={{
                      position: 'relative',
                      borderRadius: 1.5,
                      overflow: 'hidden',
                      border: `1px solid ${cv.border}`,
                      aspectRatio: '4/3',
                      bgcolor: cv.surfaceMuted,
                    }}
                  >
                    {img.url && (
                      <Box
                        component="img"
                        src={img.url}
                        alt={img.fileName}
                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    )}
                    {isLocalNotificationImage(img) && (
                      <Typography
                        sx={{
                          position: 'absolute',
                          left: 6,
                          bottom: 6,
                          px: 0.75,
                          py: 0.15,
                          borderRadius: 1,
                          fontSize: '0.625rem',
                          fontWeight: 700,
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                          bgcolor: 'rgba(142, 68, 173, 0.92)',
                          color: '#fff',
                        }}
                      >
                        Local
                      </Typography>
                    )}
                    <IconButton
                      size="small"
                      onClick={() => setImageToDelete(img)}
                      sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        bgcolor: 'rgba(0,0,0,0.5)',
                        color: '#fff',
                        p: 0.25,
                        backdropFilter: 'blur(4px)',
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
                      }}
                    >
                      <CloseRoundedIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}

            <Button
              variant="outlined"
              component="label"
              size="small"
              disabled={uploadingNotifImage || !notification.isEnabled || (notification.images?.length || 0) >= 10}
              startIcon={
                uploadingNotifImage
                  ? <CircularProgress size={14} />
                  : <CloudUploadOutlinedIcon />
              }
              sx={{ textTransform: 'none' }}
              onClick={(e) => {
                if ((notification.images?.length || 0) >= 10) {
                  e.preventDefault();
                  toast.error('Maximum limit of 10 images reached');
                }
              }}
            >
              {uploadingNotifImage ? 'Uploading...' : 'Upload Image'}
              <input
                ref={notifImageInputRef}
                hidden
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  await handleUploadImage(file);
                }}
              />
            </Button>
          </Box>

          <Box
            sx={{
              pt: 1,
              borderTop: `1px solid ${cv.border}`,
              display: 'flex',
              gap: 1.5,
              flexWrap: 'wrap',
            }}
          >
            <Button
              variant="contained"
              onClick={handleSaveNotification}
              disabled={savingNotification}
              sx={{ textTransform: 'none' }}
            >
              {savingNotification ? 'Saving...' : 'Save Notification Settings'}
            </Button>
            <Button
              variant="outlined"
              onClick={handlePreview}
              disabled={!notification.isEnabled}
              startIcon={<VisibilityOutlinedIcon />}
              sx={{ textTransform: 'none' }}
            >
              Preview Popup
            </Button>
          </Box>
        </Box>
      </Panel>

      <Dialog
        open={Boolean(imageToDelete)}
        onClose={() => !deletingImage && setImageToDelete(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
          <ErrorOutlineRoundedIcon sx={{ color: '#ef4444', fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Delete Image Warning
          </Typography>
        </DialogTitle>
        <DialogContent dividers sx={{ py: 2 }}>
          <Typography sx={{ mb: 1.5, fontSize: '0.95rem' }}>
            Are you sure you want to permanently delete this image?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, justifyContent: 'flex-end', gap: 1 }}>
          <Button
            variant="outlined"
            disabled={deletingImage}
            onClick={() => setImageToDelete(null)}
            sx={{ textTransform: 'none', borderRadius: 1.5 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={deletingImage}
            onClick={async () => {
              if (!imageToDelete) return;
              setDeletingImage(true);
              try {
                if (isLocalNotificationImage(imageToDelete)) {
                  const next = {
                    ...notification,
                    images: notification.images.filter((i) => i.id !== imageToDelete.id),
                  };
                  persistLocally(next);
                  toast.success('Local image removed');
                } else {
                  await deleteNotificationImage(imageToDelete.id);
                  const next = {
                    ...notification,
                    images: notification.images.filter((i) => i.id !== imageToDelete.id),
                  };
                  setNotification(next);
                  if (usingLocalFallback) persistLocally(next);
                  toast.success('Image deleted successfully');
                }
                setImageToDelete(null);
              } catch (e) {
                console.error('Failed to delete image', e);
                // Still allow removing from local draft
                const next = {
                  ...notification,
                  images: notification.images.filter((i) => i.id !== imageToDelete.id),
                };
                persistLocally(next);
                toast.success('Image removed from local draft');
                setImageToDelete(null);
              } finally {
                setDeletingImage(false);
              }
            }}
            startIcon={deletingImage ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ textTransform: 'none', borderRadius: 1.5, bgcolor: '#ef4444', '&:hover': { bgcolor: '#dc2626' } }}
          >
            {deletingImage ? 'Deleting...' : 'Delete Permanently'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
