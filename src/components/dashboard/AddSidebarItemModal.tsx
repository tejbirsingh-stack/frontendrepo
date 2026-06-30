import { useEffect, useState } from 'react';
import { cv } from '../../theme/cssVars';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { dropdownMenuProps } from '../../constants/dropdownMenu';
import { DEFAULT_FOLDER_COLOR } from '../../constants/folderColors';
import type { MediaType } from '../../data/mockMedia';
import type { SidebarFolder } from '../../data/mockMedia';
import FolderColorPickerField from './FolderColorPickerField';

export type SidebarItemMode = 'folder' | 'file';

const fileTypeOptions: { value: MediaType; label: string }[] = [
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
  { value: 'audio', label: 'Audio' },
];

interface AddSidebarItemModalProps {
  open: boolean;
  mode: SidebarItemMode;
  folders: SidebarFolder[];
  onClose: () => void;
  onCreateFolder: (name: string, color: string) => void;
  onCreateFile: (folderId: string, name: string, type: MediaType) => void;
}

const dialogPaperSx = {
  borderRadius: '20px',
  border: "1px solid var(--noah-border)",
  background: 'var(--noah-dialog-surface)',
  backdropFilter: 'blur(40px) saturate(180%)',
  boxShadow: cv.dialogShadow,
  maxWidth: 440,
};

export default function AddSidebarItemModal({
  open,
  mode,
  folders,
  onClose,
  onCreateFolder,
  onCreateFile,
}: AddSidebarItemModalProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(DEFAULT_FOLDER_COLOR);
  const [parentFolderId, setParentFolderId] = useState('');
  const [fileType, setFileType] = useState<MediaType>('image');

  useEffect(() => {
    if (!open) return;
    setName('');
    setColor(DEFAULT_FOLDER_COLOR);
    setFileType('image');
    setParentFolderId(folders[0]?.id ?? '');
  }, [open, folders]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    if (mode === 'folder') {
      onCreateFolder(trimmed, color);
    } else if (parentFolderId) {
      onCreateFile(parentFolderId, trimmed, fileType);
    }

    onClose();
  };

  const isFileMode = mode === 'file';
  const canSubmit = Boolean(name.trim()) && (!isFileMode || parentFolderId);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      aria-labelledby="add-sidebar-item-title"
      slotProps={{
        paper: { sx: dialogPaperSx },
        backdrop: {
          sx: { backgroundColor: cv.backdropScrim, backdropFilter: 'blur(4px)' },
        },
      }}
    >
      <Box component="form" onSubmit={handleSubmit}>
        <DialogTitle
          id="add-sidebar-item-title"
          sx={{
            pb: 1,
            fontWeight: 600,
            fontSize: '1.25rem',
            color: cv.textPrimary,
          }}
        >
          {isFileMode ? 'New file' : 'New folder'}
        </DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          <Typography variant="body2" sx={{ color: cv.textSecondary, mb: 2 }}>
            {isFileMode
              ? 'Add a file to a folder in this workspace.'
              : 'Create a new folder in Files & Folders.'}
          </Typography>

          <TextField
            fullWidth
            label={isFileMode ? 'File name' : 'Folder name'}
            placeholder={isFileMode ? 'e.g. Hero Banner.png' : 'e.g. Campaign Assets'}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            required
            sx={{ mb: isFileMode ? 2 : 0 }}
            slotProps={{ inputLabel: { shrink: true } }}
          />

          {!isFileMode ? <FolderColorPickerField value={color} onChange={setColor} /> : null}

          {isFileMode && (
            <>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel shrink>Parent folder</InputLabel>
                <Select
                  value={parentFolderId}
                  onChange={(e: SelectChangeEvent) => setParentFolderId(e.target.value)}
                  label="Parent folder"
                  notched
                  disabled={folders.length === 0}
                  MenuProps={dropdownMenuProps}
                >
                  {folders.map((folder) => (
                    <MenuItem key={folder.id} value={folder.id}>
                      {folder.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel shrink>File type</InputLabel>
                <Select
                  value={fileType}
                  onChange={(e: SelectChangeEvent) => setFileType(e.target.value as MediaType)}
                  label="File type"
                  notched
                  MenuProps={dropdownMenuProps}
                >
                  {fileTypeOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {folders.length === 0 && (
                <Typography variant="caption" sx={{ display: 'block', mt: 1, color: cv.destructive }}>
                  Create a folder first before adding files.
                </Typography>
              )}
            </>
          )}
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
            disabled={!canSubmit}
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
            {isFileMode ? 'Add file' : 'Add folder'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
