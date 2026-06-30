import { useEffect, useState } from 'react';
import { cv } from '../../theme/cssVars';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';
import type { MediaLocation, SidebarFolder } from '../../data/mockMedia';
import { DEFAULT_FOLDER_COLOR } from '../../constants/folderColors';
import FolderColorPickerField from './FolderColorPickerField';
import ProjectLocationFields, { buildProjectLocation } from './ProjectLocationFields';

interface NewFolderModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (
    name: string,
    color: string,
    projectLocation?: MediaLocation | null,
  ) => void;
  parentFolderTitle?: string;
  defaultProjectLocation?: MediaLocation | null;
  projectFolders?: SidebarFolder[];
}

const dialogPaperSx = {
  borderRadius: '20px',
  border: "1px solid var(--noah-border)",
  background: 'var(--noah-dialog-surface)',
  backdropFilter: 'blur(40px) saturate(180%)',
  boxShadow: cv.dialogShadow,
  maxWidth: 440,
};

export default function NewFolderModal({
  open,
  onClose,
  onCreate,
  parentFolderTitle,
  defaultProjectLocation,
  projectFolders = [],
}: NewFolderModalProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(DEFAULT_FOLDER_COLOR);
  const [projectId, setProjectId] = useState('');

  useEffect(() => {
    if (!open) return;
    setName('');
    setColor(DEFAULT_FOLDER_COLOR);
    setProjectId(defaultProjectLocation?.folderId ?? '');
  }, [defaultProjectLocation, open]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onCreate(trimmed, color, buildProjectLocation(projectId));
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      aria-labelledby="new-folder-title"
      slotProps={{
        paper: { sx: dialogPaperSx },
        backdrop: {
          sx: { backgroundColor: cv.backdropScrim, backdropFilter: 'blur(4px)' },
        },
      }}
    >
      <Box component="form" onSubmit={handleSubmit}>
        <DialogTitle
          id="new-folder-title"
          sx={{
            pb: 1,
            fontWeight: 600,
            fontSize: '1.25rem',
            color: cv.textPrimary,
          }}
        >
          New folder
        </DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          <Typography variant="body2" sx={{ color: cv.textSecondary, mb: 2 }}>
            {parentFolderTitle
              ? `Create a new folder inside ${parentFolderTitle}.`
              : 'Create a new folder in your media library.'}
          </Typography>
          <TextField
            fullWidth
            label="Folder name"
            placeholder="e.g. Campaign Assets"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            required
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <FolderColorPickerField value={color} onChange={setColor} />
          {projectFolders.length > 0 ? (
            <ProjectLocationFields
              projectId={projectId}
              projectFolders={projectFolders}
              onProjectChange={setProjectId}
            />
          ) : null}
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
              '&:hover': {
                background: cv.brandGradientHover,
              },
              '&.Mui-disabled': {
                background: cv.surfaceRaised,
                color: cv.textMuted,
              },
            }}
          >
            Create folder
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
