import { useEffect, useMemo, useRef, useState } from 'react';
import { cv, palette } from '../../theme/cssVars';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Popover,
  Select,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import AutoFixHighOutlinedIcon from '@mui/icons-material/AutoFixHighOutlined';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import CreateNewFolderOutlinedIcon from '@mui/icons-material/CreateNewFolderOutlined';
import AddIcon from '@mui/icons-material/Add';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import KeyboardArrowUpRoundedIcon from '@mui/icons-material/KeyboardArrowUpRounded';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import { dropdownMenuPaperSx, dropdownMenuProps } from '../../constants/dropdownMenu';
import CreateTagModal from './CreateTagModal';
import NewFolderModal from './NewFolderModal';
import { useDashboard } from '../../context/DashboardContext';
import type { ManagedTag, TagScope } from '../../types/managedTag';
import { getManagedTagChipSx } from '../../utils/managedTagStyles';
import type { TagScopeColors } from '../../types/tagScopeColors';
import type { PendingMediaUpload, MediaUploadDetails, UploadableMediaType } from '../../types/mediaUpload';
import { captureVideoThumbnail, getAudioDuration, readImageFileAsDataUrl } from '../../utils/videoThumbnail';

interface MediaUploadDetailsModalProps {
  open: boolean;
  pendingUpload: PendingMediaUpload | null;
  queueCount: number;
  onClose: () => void;
  onUpload: (details: MediaUploadDetails) => void;
}

const mediaTypeCopy: Record<
  UploadableMediaType,
  {
    dialogTitle: string;
    titleHelp: string;
    summaryPlaceholder: string;
    previewTitleFallback: string;
  }
> = {
  video: {
    dialogTitle: 'Video details',
    titleHelp: 'Choose a clear title that describes your video.',
    summaryPlaceholder: 'Introduce your video to viewers.',
    previewTitleFallback: 'Video title',
  },
  image: {
    dialogTitle: 'Image details',
    titleHelp: 'Choose a clear title that describes your image.',
    summaryPlaceholder: 'Introduce your image to viewers.',
    previewTitleFallback: 'Image title',
  },
  audio: {
    dialogTitle: 'Audio details',
    titleHelp: 'Choose a clear title that describes your audio file.',
    summaryPlaceholder: 'Introduce your audio to listeners.',
    previewTitleFallback: 'Audio title',
  },
  document: {
    dialogTitle: 'File details',
    titleHelp: 'Choose a clear title that describes your file.',
    summaryPlaceholder: 'Introduce your file.',
    previewTitleFallback: 'File title',
  },
};

const dialogPaperSx = {
  borderRadius: '20px',
  border: '1px solid var(--noah-border)',
  background: 'var(--noah-dialog-surface)',
  backdropFilter: 'blur(40px) saturate(180%)',
  boxShadow: cv.dialogShadow,
  maxWidth: 920,
};

const fieldLabelSx = {
  mb: 0.75,
  fontSize: '0.875rem',
  fontWeight: 600,
  color: cv.textPrimary,
};

const CREATE_FOLDER_VALUE = '__create_new__';

const tagScopeLabels: Record<TagScope, string> = {
  company: 'Company',
  project: 'Project',
  personal: 'Personal',
};

const tagScopeOrder: TagScope[] = ['company', 'project', 'personal'];

function TagPickerDropdown({
  assignableTags,
  selectedTags,
  onChange,
  tagScopeColors,
}: {
  assignableTags: ManagedTag[];
  selectedTags: ManagedTag[];
  onChange: (tags: ManagedTag[]) => void;
  tagScopeColors: TagScopeColors;
}) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const suppressMenuOpenRef = useRef(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [tagSearch, setTagSearch] = useState('');

  const filteredTags = useMemo(() => {
    const query = tagSearch.trim().toLowerCase();
    if (!query) return assignableTags;
    return assignableTags.filter((tag) => tag.name.toLowerCase().includes(query));
  }, [assignableTags, tagSearch]);

  const tagsByScope = useMemo(
    () => ({
      company: filteredTags.filter((tag) => tag.scope === 'company'),
      project: filteredTags.filter((tag) => tag.scope === 'project'),
      personal: filteredTags.filter((tag) => tag.scope === 'personal'),
    }),
    [filteredTags],
  );

  const closeMenu = () => {
    suppressMenuOpenRef.current = true;
    setMenuOpen(false);
    setTagSearch('');
    window.setTimeout(() => {
      suppressMenuOpenRef.current = false;
    }, 0);
  };

  const handleDone = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    closeMenu();
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  const toggleTag = (tag: ManagedTag) => {
    onChange(
      selectedTags.some((entry) => entry.id === tag.id)
        ? selectedTags.filter((entry) => entry.id !== tag.id)
        : [...selectedTags, tag],
    );
  };

  const visibleSelectedTags = selectedTags.slice(0, 2);
  const hiddenSelectedCount = Math.max(0, selectedTags.length - visibleSelectedTags.length);

  return (
    <>
      <Box ref={anchorRef}>
        <TextField
          fullWidth
          size="small"
          placeholder={selectedTags.length === 0 ? 'Search or select tags' : ''}
          value={menuOpen ? tagSearch : ''}
          onChange={(event) => setTagSearch(event.target.value)}
          onFocus={() => {
            if (suppressMenuOpenRef.current) return;
            setMenuOpen(true);
          }}
          onClick={() => setMenuOpen(true)}
          aria-expanded={menuOpen}
          aria-haspopup="listbox"
          slotProps={{
            input: {
              startAdornment:
                !menuOpen && selectedTags.length > 0 ? (
                  <InputAdornment position="start" sx={{ maxWidth: 'calc(100% - 48px)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'nowrap' }}>
                      {visibleSelectedTags.map((tag) => (
                        <Chip
                          key={tag.id}
                          label={tag.name}
                          size="small"
                          sx={{
                            ...getManagedTagChipSx(tag, tagScopeColors, {
                              selected: true,
                              height: 24,
                              fontSize: '0.75rem',
                            }),
                            cursor: 'default',
                          }}
                        />
                      ))}
                      {hiddenSelectedCount > 0 ? (
                        <Chip
                          label={`+${hiddenSelectedCount}`}
                          size="small"
                          sx={{
                            height: 24,
                            fontSize: '0.75rem',
                            backgroundColor: cv.surfaceHover,
                            color: cv.textSecondary,
                          }}
                        />
                      ) : null}
                    </Box>
                  </InputAdornment>
                ) : undefined,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    type="button"
                    size="small"
                    aria-label={menuOpen ? 'Close tag menu' : 'Open tag menu'}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={(event) => {
                      event.stopPropagation();
                      if (menuOpen) {
                        closeMenu();
                        if (document.activeElement instanceof HTMLElement) {
                          document.activeElement.blur();
                        }
                      } else {
                        setMenuOpen(true);
                      }
                    }}
                    sx={{ color: cv.textMuted }}
                  >
                    {menuOpen ? (
                      <KeyboardArrowUpRoundedIcon sx={{ fontSize: 20 }} />
                    ) : (
                      <KeyboardArrowDownRoundedIcon sx={{ fontSize: 20 }} />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
          sx={{
            '& .MuiInputBase-root': {
              borderRadius: '10px',
              backgroundColor: cv.surface,
              minHeight: 40,
            },
          }}
        />
      </Box>

      <Popover
        open={menuOpen}
        anchorEl={anchorRef.current}
        onClose={closeMenu}
        disableRestoreFocus
        disableAutoFocus
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          root: { sx: { zIndex: 1500 } },
          paper: {
            elevation: 0,
            sx: {
              ...dropdownMenuPaperSx,
              mt: 0.5,
              width: anchorRef.current?.offsetWidth ?? 320,
              maxHeight: 280,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            },
          },
        }}
      >
        <Box
          role="listbox"
          aria-multiselectable="true"
          aria-label="Select tags"
          sx={{ overflowY: 'auto', flex: 1, p: 1.5 }}
        >
          {filteredTags.length === 0 ? (
            <Typography sx={{ fontSize: '0.8125rem', color: cv.textMuted, px: 0.5 }}>
              No tags match your search.
            </Typography>
          ) : (
            tagScopeOrder.map((scope) => {
              const tags = tagsByScope[scope];
              if (tags.length === 0) return null;

              return (
                <Box key={scope} sx={{ mb: 1.25, '&:last-of-type': { mb: 0 } }}>
                  <Typography
                    sx={{
                      mb: 0.75,
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      color: cv.textMuted,
                    }}
                  >
                    {tagScopeLabels[scope]}
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: 'nowrap',
                      gap: 0.75,
                      overflowX: 'auto',
                      pb: 0.25,
                      scrollbarWidth: 'thin',
                    }}
                  >
                    {tags.map((tag) => {
                      const selected = selectedTags.some((entry) => entry.id === tag.id);
                      return (
                        <Chip
                          key={tag.id}
                          role="option"
                          aria-selected={selected}
                          label={tag.name}
                          size="small"
                          onClick={() => toggleTag(tag)}
                          sx={{
                            ...getManagedTagChipSx(tag, tagScopeColors, {
                              selected,
                              height: 24,
                              fontSize: '0.75rem',
                            }),
                            cursor: 'pointer',
                            flexShrink: 0,
                          }}
                        />
                      );
                    })}
                  </Box>
                </Box>
              );
            })
          )}
        </Box>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            px: 1,
            py: 0.75,
            borderTop: `1px solid ${cv.border}`,
            backgroundColor: cv.elevatedSurface,
          }}
          onMouseDown={(event) => event.preventDefault()}
        >
          <IconButton
            type="button"
            size="small"
            aria-label="Done selecting tags"
            onMouseDown={(event) => event.preventDefault()}
            onClick={handleDone}
            sx={{
              color: cv.brandPurple,
              backgroundColor: cv.purpleSelectionSoft,
              '&:hover': { backgroundColor: cv.purpleSurfaceActive },
            }}
          >
            <CheckRoundedIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>
      </Popover>
    </>
  );
}

export default function MediaUploadDetailsModal({
  open,
  pendingUpload,
  queueCount,
  onClose,
  onUpload,
}: MediaUploadDetailsModalProps) {
  const {
    activeWorkspace,
    activeWorkspaceId,
    workspaces,
    addWorkspaceFolder,
    createManagedTag,
    getAssignableTags,
    tagScopeColors,
  } = useDashboard();
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [duration, setDuration] = useState<string | undefined>();
  const [selectedTags, setSelectedTags] = useState<ManagedTag[]>([]);
  const [folderId, setFolderId] = useState('');
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [createTagOpen, setCreateTagOpen] = useState(false);

  const assignableTags = useMemo(
    () => getAssignableTags(activeWorkspace.id),
    [activeWorkspace.id, getAssignableTags],
  );

  const folderOptions = activeWorkspace.folders;
  const mediaType = pendingUpload?.type ?? 'video';
  const copy = mediaTypeCopy[mediaType];
  const isVideo = mediaType === 'video';
  const isImage = mediaType === 'image';
  const isAudio = mediaType === 'audio';

  useEffect(() => {
    if (!open || !pendingUpload) return;

    setTitle(pendingUpload.defaultTitle);
    setSummary('');
    setThumbnail(null);
    setDuration(undefined);
    setSelectedTags([]);
    setFolderId(pendingUpload.parentFolderId || '');

    let cancelled = false;

    if (pendingUpload.type === 'video') {
      setIsGeneratingThumbnail(true);
      captureVideoThumbnail(pendingUpload.previewSrc, { randomFrame: true })
        .then((result) => {
          if (cancelled) return;
          setThumbnail(result.thumbnail);
          setDuration(result.duration);
        })
        .catch(() => {
          if (cancelled) return;
          setThumbnail(null);
        })
        .finally(() => {
          if (!cancelled) setIsGeneratingThumbnail(false);
        });
    } else if (pendingUpload.type === 'image') {
      setIsGeneratingThumbnail(true);
      readImageFileAsDataUrl(pendingUpload.file)
        .then((dataUrl) => {
          if (cancelled) return;
          setThumbnail(dataUrl);
        })
        .catch(() => {
          if (cancelled) return;
          setThumbnail(null);
        })
        .finally(() => {
          if (!cancelled) setIsGeneratingThumbnail(false);
        });
    } else {
      setIsGeneratingThumbnail(true);
      getAudioDuration(pendingUpload.previewSrc)
        .then((audioDuration) => {
          if (cancelled) return;
          setDuration(audioDuration);
        })
        .catch(() => {
          if (cancelled) return;
          setDuration(undefined);
        })
        .finally(() => {
          if (!cancelled) setIsGeneratingThumbnail(false);
        });
    }

    return () => {
      cancelled = true;
    };
  }, [open, pendingUpload]);

  const handleAutoCreateThumbnail = async () => {
    if (!pendingUpload || !isVideo) return;
    setIsGeneratingThumbnail(true);
    try {
      const result = await captureVideoThumbnail(pendingUpload.previewSrc, { randomFrame: true });
      setThumbnail(result.thumbnail);
      setDuration(result.duration);
    } finally {
      setIsGeneratingThumbnail(false);
    }
  };

  const handleThumbnailUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    const dataUrl = await readImageFileAsDataUrl(file);
    setThumbnail(dataUrl);
  };

  const handleFolderChange = (event: SelectChangeEvent) => {
    const value = event.target.value;
    if (value === CREATE_FOLDER_VALUE) {
      setCreateFolderOpen(true);
      return;
    }
    setFolderId(value);
  };

  const handleCreateFolder = async (name: string, color: string) => {
    const newFolderId = await addWorkspaceFolder(name, color);
    if (newFolderId) {
      setFolderId(newFolderId);
    }
    setCreateFolderOpen(false);
  };

  const { systemTimezone } = useDashboard();
  const now = new Date();
  const currentYear = new Intl.DateTimeFormat('en-US', { year: 'numeric', timeZone: systemTimezone }).format(now);
  const currentMonth = new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: systemTimezone }).format(now);
  const rootFolderLabel = `${currentYear} / ${currentMonth}`;

  const selectedFolderLabel =
    folderOptions.find((folder) => folder.id === folderId)?.label ?? rootFolderLabel;

  const handleCreateTag = (input: {
    name: string;
    scope: TagScope;
    workspaceId: string | null;
  }) => {
    const created = createManagedTag(input);
    if (created) {
      setSelectedTags((prev) =>
        prev.some((tag) => tag.id === created.id) ? prev : [...prev, created],
      );
      return true;
    }
    return false;
  };

  const canUpload =
    Boolean(title.trim()) &&
    selectedTags.length > 0 &&
    !isGeneratingThumbnail &&
    (isAudio || Boolean(thumbnail));

  const handleSubmit = () => {
    if (!canUpload) return;
    const trimmedSummary = summary.trim();
    onUpload({
      title: title.trim(),
      ...(trimmedSummary ? { summary: trimmedSummary } : {}),
      ...(thumbnail ? { thumbnail } : {}),
      tags: selectedTags.map((tag) => tag.name),
      folderId: folderId || null,
      ...(duration ? { duration } : {}),
    });
  };

  const trimmedSummary = summary.trim();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      aria-labelledby="media-upload-details-title"
      slotProps={{
        paper: { sx: dialogPaperSx },
        backdrop: {
          sx: { backgroundColor: cv.backdropScrim, backdropFilter: 'blur(4px)' },
        },
      }}
    >
      <DialogTitle
        id="media-upload-details-title"
        sx={{
          pb: 1,
          fontWeight: 600,
          fontSize: '1.25rem',
          color: cv.textPrimary,
        }}
      >
        {copy.dialogTitle}
        {queueCount > 1 ? (
          <Typography component="span" sx={{ ml: 1, fontSize: '0.875rem', color: cv.textMuted }}>
            ({queueCount} files in queue)
          </Typography>
        ) : null}
      </DialogTitle>

      <DialogContent sx={{ pt: '8px !important' }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1.2fr 0.8fr' },
            gap: 3,
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography sx={fieldLabelSx}>Title</Typography>
                <Tooltip title={copy.titleHelp} arrow>
                  <IconButton size="small" aria-label="Title help" sx={{ color: cv.textMuted }}>
                    <HelpOutlineOutlinedIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
              </Box>
              <TextField
                fullWidth
                placeholder="Short text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                autoFocus
                size="small"
                sx={{
                  '& .MuiInputBase-root': {
                    borderRadius: '10px',
                    backgroundColor: cv.surface,
                  },
                }}
              />
            </Box>

            <Box>
              <Typography sx={fieldLabelSx}>
                Summary{' '}
                <Typography component="span" sx={{ fontWeight: 500, color: cv.textMuted }}>
                  (optional)
                </Typography>
              </Typography>
              <TextField
                fullWidth
                multiline
                minRows={3}
                placeholder={copy.summaryPlaceholder}
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                size="small"
                sx={{
                  '& .MuiInputBase-root': {
                    borderRadius: '10px',
                    backgroundColor: cv.surface,
                  },
                }}
              />
            </Box>

            {isVideo ? (
            <Box>
              <Typography sx={fieldLabelSx}>Thumbnails</Typography>
              <Typography sx={{ mb: 1.25, fontSize: '0.8125rem', color: cv.textMuted }}>
                Auto Create captures a frame from your uploaded video.
              </Typography>
              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleThumbnailUpload}
              />
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                <Button
                  type="button"
                  onClick={() => thumbnailInputRef.current?.click()}
                  sx={{
                    minHeight: 112,
                    flexDirection: 'column',
                    gap: 1,
                    borderRadius: '12px',
                    border: `1px dashed ${cv.border}`,
                    backgroundColor: cv.surface,
                    color: cv.textSecondary,
                    textTransform: 'none',
                    '&:hover': {
                      borderColor: cv.borderFocus,
                      backgroundColor: cv.surfaceHover,
                    },
                  }}
                >
                  <CloudUploadOutlinedIcon sx={{ fontSize: 28, color: cv.textMuted }} />
                  <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: cv.textPrimary }}>
                    Click to upload
                  </Typography>
                </Button>

                <Tooltip title="Capture a random frame from your video" arrow>
                  <Button
                    type="button"
                    onClick={handleAutoCreateThumbnail}
                    disabled={isGeneratingThumbnail || !pendingUpload}
                    sx={{
                      minHeight: 112,
                      flexDirection: 'column',
                      gap: 1,
                      borderRadius: '12px',
                      border: `1px dashed ${cv.border}`,
                      backgroundColor: cv.surface,
                      color: cv.textSecondary,
                      textTransform: 'none',
                      overflow: 'hidden',
                      position: 'relative',
                      '&:hover': {
                        borderColor: cv.borderFocus,
                        backgroundColor: cv.surfaceHover,
                      },
                    }}
                  >
                    {thumbnail && !isGeneratingThumbnail ? (
                      <Box
                        component="img"
                        src={thumbnail}
                        alt=""
                        sx={{
                          position: 'absolute',
                          inset: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          opacity: 0.35,
                        }}
                      />
                    ) : null}
                    <AutoFixHighOutlinedIcon sx={{ fontSize: 28, color: palette.orange, zIndex: 1 }} />
                    <Typography
                      sx={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: cv.textPrimary,
                        zIndex: 1,
                      }}
                    >
                      {isGeneratingThumbnail ? 'Capturing frame…' : 'Auto Create'}
                    </Typography>
                  </Button>
                </Tooltip>
              </Box>
            </Box>
            ) : null}

            <Box>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 0.75,
                }}
              >
                <Typography sx={{ ...fieldLabelSx, mb: 0 }}>Tags</Typography>
                <Button
                  size="small"
                  startIcon={<AddIcon sx={{ fontSize: 16 }} />}
                  onClick={() => setCreateTagOpen(true)}
                  sx={{
                    minWidth: 0,
                    px: 1,
                    py: 0.35,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: cv.brandPurple,
                    borderRadius: '8px',
                    textTransform: 'none',
                    '&:hover': { backgroundColor: cv.purpleSelectionSoft },
                  }}
                >
                  Create tag
                </Button>
              </Box>

              {assignableTags.length === 0 ? (
                <Typography variant="body2" sx={{ color: cv.textMuted, fontSize: '0.8125rem' }}>
                  No tags yet. Create one to continue.
                </Typography>
              ) : (
                <TagPickerDropdown
                  assignableTags={assignableTags}
                  selectedTags={selectedTags}
                  onChange={setSelectedTags}
                  tagScopeColors={tagScopeColors}
                />
              )}
            </Box>

            <Box>
              <FormControl fullWidth size="small">
                <InputLabel shrink>Add to folder</InputLabel>
                <Select
                  value={folderId}
                  onChange={handleFolderChange}
                  label="Add to folder"
                  notched
                  displayEmpty
                  disabled={!pendingUpload?.parentFolderId}
                  renderValue={(value) =>
                    value ? selectedFolderLabel : rootFolderLabel
                  }
                  MenuProps={dropdownMenuProps}
                  sx={{
                    borderRadius: '10px',
                    backgroundColor: cv.surface,
                  }}
                >
                  <MenuItem value="">
                    <em>{rootFolderLabel}</em>
                  </MenuItem>
                  {folderOptions.map((folder) => (
                    <MenuItem key={folder.id} value={folder.id}>
                      {folder.label}
                    </MenuItem>
                  ))}
                  <MenuItem
                    value={CREATE_FOLDER_VALUE}
                    sx={{
                      mt: 0.5,
                      borderTop: `1px solid ${cv.border}`,
                      color: cv.brandPurple,
                      fontWeight: 600,
                    }}
                  >
                    <CreateNewFolderOutlinedIcon sx={{ fontSize: 18, mr: 1.5 }} />
                    Create new folder
                  </MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>

          <Box>
            <Typography sx={{ ...fieldLabelSx, mb: 1.25 }}>Preview</Typography>
            <Box
              sx={{
                borderRadius: '16px',
                border: `1px solid ${cv.emojiPickerBorder}`,
                background: cv.whiteSurfaceStrong,
                color: cv.gray900Ui,
                overflow: 'hidden',
                boxShadow: cv.previewCardShadow,
              }}
            >
              <Box sx={{ position: 'relative', aspectRatio: '16 / 10', background: cv.gray200 }}>
                {isAudio ? (
                  <Box
                    sx={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 1.5,
                      background:
                        cv.uploadPreviewGradient,
                    }}
                  >
                    <GraphicEqIcon sx={{ fontSize: 56, color: cv.brandPurple, opacity: 0.9 }} />
                    {duration ? (
                      <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: cv.gray600 }}>
                        {duration}
                      </Typography>
                    ) : isGeneratingThumbnail ? (
                      <Typography sx={{ fontSize: '0.875rem', color: palette.gray }}>
                        Reading duration…
                      </Typography>
                    ) : null}
                  </Box>
                ) : thumbnail ? (
                  <Box
                    component="img"
                    src={thumbnail}
                    alt=""
                    sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: palette.gray,
                      fontSize: '0.875rem',
                    }}
                  >
                    {isGeneratingThumbnail
                      ? isImage
                        ? 'Loading preview…'
                        : 'Generating thumbnail…'
                      : 'No preview yet'}
                  </Box>
                )}
                {isVideo ? (
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: cv.whiteSurfaceMedium,
                        boxShadow: cv.previewPlayShadow,
                      }}
                    >
                      <PlayArrowRoundedIcon sx={{ fontSize: 28, color: cv.gray900Ui, ml: 0.25 }} />
                    </Box>
                  </Box>
                ) : null}
              </Box>
              <Box sx={{ p: 2 }}>
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: '1rem',
                    lineHeight: 1.35,
                    mb: trimmedSummary || selectedTags.length > 0 ? 1 : 0,
                    color: cv.gray900Ui,
                  }}
                >
                  {title.trim() || copy.previewTitleFallback}
                </Typography>
                {trimmedSummary ? (
                  <Typography
                    sx={{
                      fontSize: '0.875rem',
                      lineHeight: 1.5,
                      color: cv.gray600,
                      display: '-webkit-box',
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      mb: selectedTags.length > 0 ? 1 : 0,
                    }}
                  >
                    {trimmedSummary}
                  </Typography>
                ) : null}
                {selectedTags.length > 0 ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selectedTags.map((tag) => (
                      <Chip
                        key={tag.id}
                        label={tag.name}
                        size="small"
                        sx={getManagedTagChipSx(tag, tagScopeColors, {
                          selected: true,
                          height: 24,
                          fontSize: '0.75rem',
                        })}
                      />
                    ))}
                  </Box>
                ) : null}
              </Box>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
        <Button
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
          onClick={handleSubmit}
          disabled={!canUpload}
          variant="contained"
          sx={{
            borderRadius: '10px',
            px: 2.5,
            background: cv.brandGradient,
            boxShadow: cv.brandShadow,
            '&:hover': {
              background: cv.brandGradientHover,
            },
            '&.Mui-disabled': {
              background: cv.surfaceRaised,
              color: cv.textMuted,
            },
          }}
        >
          Upload
        </Button>
      </DialogActions>

      <NewFolderModal
        open={createFolderOpen}
        onClose={() => setCreateFolderOpen(false)}
        onCreate={handleCreateFolder}
      />

      <CreateTagModal
        open={createTagOpen}
        mode="create"
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        onClose={() => setCreateTagOpen(false)}
        onCreate={handleCreateTag}
        onUpdate={() => false}
      />
    </Dialog>
  );
}
