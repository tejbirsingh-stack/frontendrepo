import { useEffect, useState, useCallback } from 'react';
import { cv } from '../../theme/cssVars';
import { useDashboard } from '../../context/DashboardContext';
import { apiClient } from '../../api/client';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';

interface TagOption {
  id: string;
  name: string;
  color: string | null;
  scope: string;
}

interface NewProjectModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, tagIds: string[]) => void;
  parentFolderTitle?: string;
}

const dialogPaperSx = {
  borderRadius: '20px',
  border: '1px solid var(--noah-border)',
  background: 'var(--noah-dialog-surface)',
  backdropFilter: 'blur(40px) saturate(180%)',
  boxShadow: cv.dialogShadow,
  maxWidth: 480,
  width: '100%',
};

export default function NewProjectModal({
  open,
  onClose,
  onCreate,
  parentFolderTitle,
}: NewProjectModalProps) {
  const { systemTimezone } = useDashboard();
  const [name, setName] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [tags, setTags] = useState<TagOption[]>([]);
  const [tagsLoading, setTagsLoading] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (!open) return;
    setName('');
    setSelectedTagIds([]);
  }, [open]);

  // Fetch available tags when modal opens
  useEffect(() => {
    if (!open) return;
    setTagsLoading(true);
    apiClient
      .get<any>('/tags?scope=project')
      .then((res: any) => {
        // apiClient auto-unwraps .data, so res is the array directly
        const list = Array.isArray(res) ? res : (res?.data ?? []);
        setTags(list);
      })
      .catch(() => {})
      .finally(() => setTagsLoading(false));
  }, [open]);

  const toggleTag = useCallback((tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    );
  }, []);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onCreate(trimmed, selectedTagIds);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      aria-labelledby="new-project-title"
      slotProps={{
        paper: { sx: dialogPaperSx },
        backdrop: {
          sx: { backgroundColor: cv.backdropScrim, backdropFilter: 'blur(4px)' },
        },
      }}
    >
      <Box component="form" onSubmit={handleSubmit}>
        <DialogTitle
          id="new-project-title"
          sx={{
            pb: 1,
            fontWeight: 600,
            fontSize: '1.25rem',
            color: cv.textPrimary,
          }}
        >
          New project
        </DialogTitle>

        <DialogContent sx={{ pt: '8px !important', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" sx={{ color: cv.textSecondary }}>
            {parentFolderTitle
              ? `Create a new project inside ${parentFolderTitle}.`
              : 'Create a new project in your workspace.'}
          </Typography>

          {/* Project name */}
          <TextField
            fullWidth
            label="Project name"
            placeholder="e.g. Summer Campaign"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            required
            helperText={`${name.length}/100`}
            slotProps={{
              inputLabel: { shrink: true },
              htmlInput: { maxLength: 100 },
            }}
            sx={{
              '& .MuiFormHelperText-root': {
                textAlign: 'right',
                color: cv.textMuted,
                fontSize: '0.75rem',
                mt: 0.5,
              },
            }}
          />

          {/* Folder info (when no parent folder) */}
          {!parentFolderTitle && (
            <FormControl fullWidth size="small">
              <InputLabel shrink>Add to folder</InputLabel>
              <Select
                value=""
                displayEmpty
                notched
                disabled
                renderValue={() => {
                  const now = new Date();
                  const currentYear = new Intl.DateTimeFormat('en-US', {
                    year: 'numeric',
                    timeZone: systemTimezone,
                  }).format(now);
                  const currentMonth = new Intl.DateTimeFormat('en-US', {
                    month: 'long',
                    timeZone: systemTimezone,
                  }).format(now);
                  return `${currentYear} / ${currentMonth}`;
                }}
                sx={{
                  borderRadius: '10px',
                  backgroundColor: cv.surface,
                  '&.Mui-disabled': { backgroundColor: cv.surfaceRaised },
                }}
              >
                <MenuItem value="">
                  <em>Auto-assigned by workspace</em>
                </MenuItem>
              </Select>
            </FormControl>
          )}

          {/* Default tags section */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
              <LocalOfferOutlinedIcon sx={{ fontSize: '0.9rem', color: cv.textMuted }} />
              <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: cv.textPrimary }}>
                Default tags
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted }}>
                (optional)
              </Typography>
            </Box>
            <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted, mb: 1.5 }}>
              Any file uploaded to this project will automatically receive these tags.
            </Typography>

            {tagsLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={14} />
                <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted }}>
                  Loading tags…
                </Typography>
              </Box>
            ) : tags.length === 0 ? (
              <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted, fontStyle: 'italic' }}>
                No project tags found. Create project-scoped tags in the Tags Management page first.
              </Typography>
            ) : (
              <Box
                sx={{
                  borderRadius: '12px',
                  border: `1px solid ${cv.border}`,
                  backgroundColor: cv.surface,
                  p: 1.5,
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 0.75,
                  maxHeight: 200,
                  overflowY: 'auto',
                }}
              >
                {tags.map((tag) => {
                  const selected = selectedTagIds.includes(tag.id);
                  return (
                    <Chip
                      key={tag.id}
                      label={tag.name}
                      size="small"
                      onClick={() => toggleTag(tag.id)}
                      sx={{
                        fontSize: '0.75rem',
                        height: 26,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        border: selected
                          ? `1.5px solid ${tag.color ?? cv.brand}`
                          : `1px solid ${cv.border}`,
                        backgroundColor: selected
                          ? `${tag.color ?? cv.brand}22`
                          : cv.surfaceRaised,
                        color: selected ? (tag.color ?? cv.brand) : cv.textSecondary,
                        fontWeight: selected ? 600 : 400,
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          backgroundColor: selected
                            ? `${tag.color ?? cv.brand}33`
                            : cv.surfaceHover,
                        },
                      }}
                    />
                  );
                })}
              </Box>
            )}

            {selectedTagIds.length > 0 && (
              <Typography sx={{ mt: 1, fontSize: '0.75rem', color: cv.textMuted }}>
                {selectedTagIds.length} tag{selectedTagIds.length > 1 ? 's' : ''} selected
              </Typography>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
          <Button
            type="button"
            onClick={onClose}
            sx={{
              color: cv.textSecondary,
              borderRadius: '10px',
              '&:hover': { backgroundColor: cv.surfaceHover },
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!name.trim()}
            sx={{
              borderRadius: '10px',
              px: 2.5,
              background: cv.brandGradient,
              boxShadow: cv.brandShadow,
              '&:hover': { background: cv.brandGradientHover },
              '&.Mui-disabled': {
                background: cv.surfaceRaised,
                color: cv.textMuted,
              },
            }}
          >
            Create project
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
