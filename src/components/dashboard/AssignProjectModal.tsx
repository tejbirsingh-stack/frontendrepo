import { useEffect, useState } from 'react';
import { cv } from '../../theme/cssVars';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import type { MediaLocation, SidebarFolder } from '../../data/mockMedia';
import ProjectLocationFields, { buildProjectLocation } from './ProjectLocationFields';

interface AssignProjectModalProps {
  open: boolean;
  itemTitle: string;
  projectFolders: SidebarFolder[];
  initialProjectLocation?: MediaLocation | null;
  onClose: () => void;
  onSave: (projectLocation: MediaLocation | null) => void;
}

const dialogPaperSx = {
  borderRadius: '20px',
  border: "1px solid var(--noah-border)",
  background: 'var(--noah-dialog-surface)',
  backdropFilter: 'blur(40px) saturate(180%)',
  boxShadow: cv.dialogShadow,
  maxWidth: 440,
};

export default function AssignProjectModal({
  open,
  itemTitle,
  projectFolders,
  initialProjectLocation,
  onClose,
  onSave,
}: AssignProjectModalProps) {
  const [projectId, setProjectId] = useState('');

  useEffect(() => {
    if (!open) return;
    setProjectId(initialProjectLocation?.folderId ?? '');
  }, [initialProjectLocation, open]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSave(buildProjectLocation(projectId));
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      aria-labelledby="assign-project-title"
      slotProps={{
        paper: { sx: dialogPaperSx },
        backdrop: {
          sx: { backgroundColor: cv.backdropScrim, backdropFilter: 'blur(4px)' },
        },
      }}
    >
      <Box component="form" onSubmit={handleSubmit}>
        <DialogTitle
          id="assign-project-title"
          sx={{
            pb: 1,
            fontWeight: 600,
            fontSize: '1.25rem',
            color: cv.textPrimary,
          }}
        >
          Assign to project
        </DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          <Typography variant="body2" sx={{ color: cv.textSecondary, mb: 1 }}>
            Link <strong>{itemTitle}</strong> to a project so it appears in the Projects
            sidebar and project views.
          </Typography>
          <ProjectLocationFields
            projectId={projectId}
            projectFolders={projectFolders}
            onProjectChange={setProjectId}
          />
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
            sx={{
              borderRadius: '10px',
              px: 2.5,
              background: cv.brandGradient,
              boxShadow: cv.brandShadow,
              '&:hover': { background: cv.brandGradientHover },
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
