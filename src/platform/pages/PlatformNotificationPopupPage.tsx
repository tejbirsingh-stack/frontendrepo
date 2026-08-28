import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
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
  const notifImageInputRef = useRef<HTMLInputElement>(null);
  const [imageToDelete, setImageToDelete] = useState<DashboardNotificationImage | null>(null);
  const [deletingImage, setDeletingImage] = useState(false);

  useEffect(() => {
    fetchDashboardNotification()
      .then((res) => {
        if (res.notification) setNotification(res.notification);
      })
      .catch((err) => console.error('Failed to load dashboard notification', err));
  }, []);

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
        setNotification(res.notification);
      }
      toast.success('Dashboard Notification settings saved successfully');
    } catch (err) {
      console.error('Failed to save dashboard notification:', err);
      toast.error('Failed to save dashboard notification');
    } finally {
      setSavingNotification(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="Notification Popup"
        subtitle="Configure a welcome popup shown to all users when they log into the dashboard"
      />

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
            placeholder="e.g., Welcome to the New NOAH Cloud!"
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

          {/* Image Upload Section */}
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
              Images shown below the message as a slider (Max 10). Stored in B2 under{' '}
              <code>notification-media/</code>.
            </Typography>

            {/* Existing images grid */}
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

            {/* Upload button */}
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
                      toast.success('Image uploaded successfully');
                    }
                  } catch (err) {
                    console.error('Image upload failed', err);
                    toast.error('Failed to upload image');
                  } finally {
                    setUploadingNotifImage(false);
                    if (notifImageInputRef.current) notifImageInputRef.current.value = '';
                  }
                }}
              />
            </Button>
          </Box>

          <Box sx={{ pt: 1, borderTop: `1px solid ${cv.border}` }}>
            <Button
              variant="contained"
              onClick={handleSaveNotification}
              disabled={savingNotification}
              sx={{ textTransform: 'none' }}
            >
              {savingNotification ? 'Saving...' : 'Save Notification Settings'}
            </Button>
          </Box>
        </Box>
      </Panel>

      {/* Permanent Delete Warning Confirmation Modal for Image */}
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
                await deleteNotificationImage(imageToDelete.id);
                setNotification((prev) => ({
                  ...prev,
                  images: prev.images.filter((i) => i.id !== imageToDelete.id),
                }));
                toast.success('Image deleted successfully');
                setImageToDelete(null);
              } catch (e) {
                console.error('Failed to delete image', e);
                toast.error('Failed to delete image');
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
