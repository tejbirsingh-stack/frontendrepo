import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material';
import VpnKeyOutlinedIcon from '@mui/icons-material/VpnKeyOutlined';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import LanguageOutlinedIcon from '@mui/icons-material/LanguageOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import { PageHeader, Panel } from '../components/PlatformUi';
import { cv } from '../../theme/cssVars';
import { fetchGlobalSecuritySettings, updateGlobalSecuritySettings } from '../api/platformApi';

export default function PlatformSecurityPage() {
  const [loading, setLoading] = useState(true);
  
  // State for global security settings
  const [ssoConfigured, setSsoConfigured] = useState(false);
  const [ssoProvider, setSsoProvider] = useState('google, microsoft');
  const [ssoDomain, setSsoDomain] = useState('');
  
  const [sessionTimeoutDays, setSessionTimeoutDays] = useState(30);
  
  // CSP Domains List (Todo-list style)
  const [cspDomains, setCspDomains] = useState<string[]>(['noahcloud.ai', 'localhost']);
  const [newDomainInput, setNewDomainInput] = useState('');

  // Inline Editing State for Domains
  const [editingDomainIndex, setEditingDomainIndex] = useState<number | null>(null);
  const [editingDomainText, setEditingDomainText] = useState('');

  // Modals state
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [cspModalOpen, setCspModalOpen] = useState(false);

  // Saving state
  const [saving, setSaving] = useState(false);

  // Notification state
  const [toastMessage, setToastMessage] = useState('');
  const [toastOpen, setToastOpen] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setToastOpen(true);
  };

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await fetchGlobalSecuritySettings();
      if (res?.settings) {
        setSsoConfigured(Boolean(res.settings.ssoConfigured));
        setSsoProvider(res.settings.ssoProvider || 'google, microsoft');
        setSsoDomain(res.settings.ssoDomain || '');
        setSessionTimeoutDays(Number(res.settings.sessionTimeoutDays) || 30);
        
        // Parse CSP domains string/JSON into array
        const rawCsp = res.settings.contentSecurityPolicy || '["noahcloud.ai", "localhost"]';
        let parsed: string[] = [];
        try {
          const jsonParsed = JSON.parse(rawCsp);
          if (Array.isArray(jsonParsed)) parsed = jsonParsed;
          else parsed = String(rawCsp).split(',').map((item) => item.trim()).filter(Boolean);
        } catch {
          parsed = String(rawCsp).split(',').map((item) => item.trim()).filter(Boolean);
        }
        setCspDomains(parsed);
      }
    } catch (err: any) {
      console.error('Failed to fetch global security settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleToggleSso = async () => {
    const nextValue = !ssoConfigured;
    setSaving(true);
    try {
      const res = await updateGlobalSecuritySettings({
        ssoConfigured: nextValue,
        ssoProvider: 'google, microsoft',
      });
      if (res?.success) {
        setSsoConfigured(nextValue);
        showToast(`SSO status updated to ${nextValue ? 'TRUE (Configured)' : 'FALSE (Not configured)'} in database.`);
      }
    } catch (err: any) {
      console.error('Error saving SSO:', err);
      showToast('Failed to save SSO status in database.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSession = async () => {
    setSaving(true);
    try {
      const res = await updateGlobalSecuritySettings({
        sessionTimeoutDays: Number(sessionTimeoutDays),
      });
      if (res?.success) {
        setSessionModalOpen(false);
        showToast(`Session timeout updated to ${sessionTimeoutDays} days of inactivity in database.`);
      }
    } catch (err: any) {
      console.error('Error saving session timeout:', err);
      showToast('Failed to save session timeout.');
    } finally {
      setSaving(false);
    }
  };

  // Add domain item to Todo list
  const handleAddDomain = () => {
    const cleaned = newDomainInput.trim().toLowerCase().replace(/^https?:\/\//, '');
    if (!cleaned) return;
    if (cspDomains.includes(cleaned)) {
      showToast(`Domain "${cleaned}" is already in the list.`);
      return;
    }
    setCspDomains([...cspDomains, cleaned]);
    setNewDomainInput('');
  };

  // Delete domain item from Todo list
  const handleDeleteDomain = (domainToDelete: string) => {
    setCspDomains(cspDomains.filter((d) => d !== domainToDelete));
    if (editingDomainIndex !== null && cspDomains[editingDomainIndex] === domainToDelete) {
      setEditingDomainIndex(null);
      setEditingDomainText('');
    }
  };

  // Start editing a domain
  const handleStartEdit = (idx: number, currentText: string) => {
    setEditingDomainIndex(idx);
    setEditingDomainText(currentText);
  };

  // Save edited domain
  const handleSaveEdit = (idx: number) => {
    const cleaned = editingDomainText.trim().toLowerCase().replace(/^https?:\/\//, '');
    if (!cleaned) return;
    const updated = [...cspDomains];
    updated[idx] = cleaned;
    setCspDomains(updated);
    setEditingDomainIndex(null);
    setEditingDomainText('');
  };

  // Cancel domain editing
  const handleCancelEdit = () => {
    setEditingDomainIndex(null);
    setEditingDomainText('');
  };

  // Save CSP Domain list to DB as JSON array
  const handleSaveCsp = async () => {
    setSaving(true);
    const cspJson = JSON.stringify(cspDomains);
    try {
      const res = await updateGlobalSecuritySettings({
        contentSecurityPolicy: cspJson,
      });
      if (res?.success) {
        setCspModalOpen(false);
        showToast('Content Security Policy domains saved in database.');
      }
    } catch (err: any) {
      console.error('Error saving CSP:', err);
      showToast('Failed to save Content Security Policy.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="Security"
        subtitle="Global security settings configured by Global Admin — applies platform-wide across all organizations"
      />

      <Panel>
        {loading ? (
          <Box sx={{ p: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1.5 }}>
            <CircularProgress size={24} sx={{ color: cv.brandOrchid }} />
            <Typography sx={{ color: cv.textMuted, fontSize: '0.875rem' }}>Loading global security settings...</Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            {/* 1. SSO Row */}
            <Box
              sx={{
                py: 2.5,
                px: 1,
                display: 'flex',
                alignItems: { xs: 'flex-start', sm: 'center' },
                justifyContent: 'space-between',
                gap: 2,
                flexDirection: { xs: 'column', sm: 'row' },
              }}
            >
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', minWidth: 0 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '6px',
                    display: 'grid',
                    placeItems: 'center',
                    background: cv.purpleSurface,
                    color: cv.brandOrchid,
                    border: `1px solid ${cv.purpleChipBorder}`,
                    flexShrink: 0,
                    mt: 0.25,
                  }}
                >
                  <VpnKeyOutlinedIcon sx={{ fontSize: 20 }} />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: '0.95rem', color: cv.textPrimary }}>
                    Single sign-on (SSO)
                  </Typography>
                  <Typography sx={{ fontSize: '0.8125rem', color: ssoConfigured ? cv.successText : cv.textMuted, mt: 0.35, fontWeight: 500 }}>
                    {ssoConfigured
                      ? `Configured (${ssoProvider.toUpperCase()})`
                      : 'Not configured'}
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: cv.textSecondary, mt: 0.5 }}>
                    Organization employees single sign-on integration via Google , Microsoft.
                  </Typography>
                </Box>
              </Box>

              <Button
                variant="outlined"
                size="small"
                disabled={saving}
                onClick={handleToggleSso}
                sx={{
                  height: 36,
                  minHeight: 36,
                  px: 2,
                  borderRadius: '6px',
                  borderColor: ssoConfigured ? cv.brandOrchid : cv.borderStrong,
                  color: ssoConfigured ? cv.brandOrchid : cv.textPrimary,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  flexShrink: 0,
                  '&:hover': {
                    borderColor: cv.brandOrchid,
                    background: cv.purpleSurface,
                    color: cv.brandOrchid,
                  },
                }}
              >
                {saving ? 'Saving...' : ssoConfigured ? 'Not configure' : 'Configure'}
              </Button>
            </Box>

            <Divider sx={{ borderColor: cv.border }} />

            {/* 2. Session Timeout Row */}
            <Box
              sx={{
                py: 2.5,
                px: 1,
                display: 'flex',
                alignItems: { xs: 'flex-start', sm: 'center' },
                justifyContent: 'space-between',
                gap: 2,
                flexDirection: { xs: 'column', sm: 'row' },
              }}
            >
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', minWidth: 0 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '6px',
                    display: 'grid',
                    placeItems: 'center',
                    background: cv.purpleSurface,
                    color: cv.brandOrchid,
                    border: `1px solid ${cv.purpleChipBorder}`,
                    flexShrink: 0,
                    mt: 0.25,
                  }}
                >
                  <TimerOutlinedIcon sx={{ fontSize: 20 }} />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: '0.95rem', color: cv.textPrimary }}>
                    Session timeout
                  </Typography>
                  <Typography sx={{ fontSize: '0.8125rem', color: cv.textMuted, mt: 0.35 }}>
                    {sessionTimeoutDays} days of inactivity
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: cv.textSecondary, mt: 0.5 }}>
                    Automatic session expiration limit for idle users enforced across all organizations.
                  </Typography>
                </Box>
              </Box>

              <Button
                variant="outlined"
                size="small"
                onClick={() => setSessionModalOpen(true)}
                sx={{
                  height: 36,
                  minHeight: 36,
                  px: 2,
                  borderRadius: '6px',
                  borderColor: cv.borderStrong,
                  color: cv.textPrimary,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  flexShrink: 0,
                  '&:hover': {
                    borderColor: cv.brandOrchid,
                    background: cv.purpleSurface,
                    color: cv.brandOrchid,
                  },
                }}
              >
                Edit
              </Button>
            </Box>

            <Divider sx={{ borderColor: cv.border }} />

            {/* 3. Content Security Policy Row */}
            <Box
              sx={{
                py: 2.5,
                px: 1,
                display: 'flex',
                alignItems: { xs: 'flex-start', sm: 'center' },
                justifyContent: 'space-between',
                gap: 2,
                flexDirection: { xs: 'column', sm: 'row' },
              }}
            >
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', minWidth: 0 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '6px',
                    display: 'grid',
                    placeItems: 'center',
                    background: cv.purpleSurface,
                    color: cv.brandOrchid,
                    border: `1px solid ${cv.purpleChipBorder}`,
                    flexShrink: 0,
                    mt: 0.25,
                  }}
                >
                  <ShieldOutlinedIcon sx={{ fontSize: 20 }} />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: '0.95rem', color: cv.textPrimary }}>
                    Content Security Policy
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', maxWidth: { xs: '100%', sm: 420, md: 440 }, mt: 0.75, mb: 0.5 }}>
                    {cspDomains.length > 0 ? (
                      cspDomains.map((dom) => (
                        <Chip
                          key={dom}
                          size="small"
                          label={dom}
                          icon={<LanguageOutlinedIcon sx={{ fontSize: 13 }} />}
                          sx={{
                            height: 24,
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            borderRadius: '4px',
                            background: cv.purpleSurface,
                            color: cv.brandOrchid,
                            border: `1px solid ${cv.purpleChipBorder}`,
                          }}
                        />
                      ))
                    ) : (
                      <Typography sx={{ fontSize: '0.8125rem', color: cv.textMuted }}>
                        No allowed origins configured.
                      </Typography>
                    )}
                  </Box>
                  <Typography sx={{ fontSize: '0.75rem', color: cv.textSecondary }}>
                    Allowed domain origins for embedded media share links across external sites.
                  </Typography>
                </Box>
              </Box>

              <Button
                variant="outlined"
                size="small"
                onClick={() => setCspModalOpen(true)}
                sx={{
                  height: 36,
                  minHeight: 36,
                  px: 2,
                  borderRadius: '6px',
                  borderColor: cv.borderStrong,
                  color: cv.textPrimary,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  flexShrink: 0,
                  '&:hover': {
                    borderColor: cv.brandOrchid,
                    background: cv.purpleSurface,
                    color: cv.brandOrchid,
                  },
                }}
              >
                Manage
              </Button>
            </Box>
          </Box>
        )}
      </Panel>

      {/* --- Session Timeout Dialog --- */}
      <Dialog
        open={sessionModalOpen}
        onClose={() => setSessionModalOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              background: cv.drawerSurface,
              border: `1px solid ${cv.border}`,
              borderRadius: '8px',
              color: cv.textPrimary,
            },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
          Edit Session Timeout
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: cv.border, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography sx={{ fontSize: '0.875rem', color: cv.textSecondary }}>
            Set the maximum inactivity duration in days before users are automatically logged out across all organizations.
          </Typography>
          <TextField
            select
            fullWidth
            size="small"
            label="Inactivity Limit (Days)"
            value={sessionTimeoutDays}
            onChange={(e) => setSessionTimeoutDays(Number(e.target.value))}
          >
            <MenuItem value={7}>7 days of inactivity</MenuItem>
            <MenuItem value={14}>14 days of inactivity</MenuItem>
            <MenuItem value={30}>30 days of inactivity (Default)</MenuItem>
            <MenuItem value={60}>60 days of inactivity</MenuItem>
            <MenuItem value={90}>90 days of inactivity</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSessionModalOpen(false)} sx={{ color: cv.textSecondary, textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={saving}
            onClick={handleSaveSession}
            sx={{
              background: cv.brandGradient,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            {saving ? 'Saving...' : 'Save Timeout'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* --- Content Security Policy Todo-List Dialog with Edit & Delete --- */}
      <Dialog
        open={cspModalOpen}
        onClose={() => setCspModalOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              background: cv.drawerSurface,
              border: `1px solid ${cv.border}`,
              borderRadius: '8px',
              color: cv.textPrimary,
            },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
          Content Security Policy — Allowed Domains
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: cv.border, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Typography sx={{ fontSize: '0.85rem', color: cv.textSecondary, lineHeight: 1.5 }}>
            Add allowed domain origins one by one. Media share links will only be permitted to embed on these domain origins.
          </Typography>

          {/* Add Domain Input Box */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="e.g. noahcloud.ai or localhost"
              value={newDomainInput}
              onChange={(e) => setNewDomainInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddDomain();
                }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  background: cv.surface,
                },
              }}
            />
            <Button
              variant="contained"
              onClick={handleAddDomain}
              startIcon={<AddIcon />}
              sx={{
                background: cv.brandGradient,
                textTransform: 'none',
                fontWeight: 600,
                px: 2.5,
                flexShrink: 0,
              }}
            >
              Add Domain
            </Button>
          </Box>

          {/* Todo List of Domains */}
          <Box>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: cv.textMuted, letterSpacing: '0.05em', textTransform: 'uppercase', mb: 1 }}>
              Configured Domains ({cspDomains.length})
            </Typography>

            {cspDomains.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center', border: `1px dashed ${cv.border}`, borderRadius: '6px' }}>
                <Typography sx={{ fontSize: '0.8125rem', color: cv.textMuted }}>
                  No domain origins added yet. Type a domain above and click Add Domain.
                </Typography>
              </Box>
            ) : (
              <List disablePadding sx={{ borderRadius: '6px', border: `1px solid ${cv.border}`, background: cv.surface }}>
                {cspDomains.map((domain, idx) => (
                  <ListItem
                    key={`${domain}-${idx}`}
                    divider={idx < cspDomains.length - 1}
                    secondaryAction={
                      editingDomainIndex === idx ? (
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleSaveEdit(idx)}
                            sx={{ color: cv.successText, '&:hover': { background: cv.surfaceHover } }}
                            title="Save domain"
                          >
                            <CheckIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={handleCancelEdit}
                            sx={{ color: cv.textMuted, '&:hover': { color: cv.destructive } }}
                            title="Cancel"
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleStartEdit(idx, domain)}
                            sx={{ color: cv.textMuted, '&:hover': { color: cv.brandOrchid } }}
                            title="Edit domain"
                          >
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteDomain(domain)}
                            sx={{ color: cv.textMuted, '&:hover': { color: cv.destructive } }}
                            title="Delete domain"
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      )
                    }
                    sx={{ py: 1, px: 2 }}
                  >
                    <LanguageOutlinedIcon sx={{ fontSize: 18, color: cv.brandOrchid, mr: 1.5 }} />

                    {editingDomainIndex === idx ? (
                      <TextField
                        size="small"
                        autoFocus
                        value={editingDomainText}
                        onChange={(e) => setEditingDomainText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSaveEdit(idx);
                          } else if (e.key === 'Escape') {
                            handleCancelEdit();
                          }
                        }}
                        sx={{
                          flex: 1,
                          mr: 10,
                          '& .MuiOutlinedInput-input': {
                            py: 0.5,
                            px: 1,
                            fontSize: '0.875rem',
                          },
                        }}
                      />
                    ) : (
                      <ListItemText
                        primary={domain}
                        primaryTypographyProps={{
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          color: cv.textPrimary,
                        }}
                      />
                    )}
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
          <Button onClick={() => setCspModalOpen(false)} sx={{ color: cv.textSecondary, textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={saving}
            onClick={handleSaveCsp}
            sx={{
              background: cv.brandGradient,
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
            }}
          >
            {saving ? 'Saving...' : 'Save Domain Policy'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar toast */}
      <Snackbar
        open={toastOpen}
        autoHideDuration={4000}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="success" onClose={() => setToastOpen(false)} sx={{ width: '100%' }}>
          {toastMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
