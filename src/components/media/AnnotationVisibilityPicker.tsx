import { useState } from 'react';
import { cv } from '../../theme/cssVars';
import {
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import CheckOutlinedIcon from '@mui/icons-material/CheckOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import type { AnnotationAccessGroup, AnnotationVisibility } from '../../types/annotationVisibility';
import type { MediaCollaborator } from '../../types/mediaCollaborator';
import {
  getVisibilityLabel,
  resolveAnnotationVisibility,
} from '../../utils/annotationVisibilityUtils';
import CreateAnnotationGroupModal from './CreateAnnotationGroupModal';
import { floatingPanelMenuSlotProps } from '../../constants/floatingPanel';

type PickerVariant = 'dark' | 'light';

interface AnnotationVisibilityPickerProps {
  visibility?: AnnotationVisibility;
  groupId?: string;
  groups: AnnotationAccessGroup[];
  collaborators: MediaCollaborator[];
  onChange: (visibility: AnnotationVisibility, groupId?: string) => void;
  onCreateGroup: (name: string, memberIds: string[]) => AnnotationAccessGroup | Promise<AnnotationAccessGroup | null | undefined>;
  onDeleteGroup?: (groupId: string) => void;
  onUpdateGroup?: (groupId: string, name: string, memberIds: string[]) => Promise<AnnotationAccessGroup | null | undefined>;
  onAddCollaborator?: (name: string, email: string) => MediaCollaborator | null;
  variant?: PickerVariant;
  size?: 'small' | 'medium';
  isAuthor?: boolean;
  /** Raise menu above portaled floating panels (e.g. comment thread). */
  elevated?: boolean;
}

const menuPaperSx = {
  mt: 0.5,
  minWidth: 196,
  borderRadius: '12px',
  border: '1px solid var(--noah-border)',
  background: 'var(--noah-popover-surface-deep)',
  backdropFilter: 'blur(20px)',
  boxShadow: cv.dropdownShadow,
};

function VisibilityIcon({
  visibility,
  fontSize = 18,
}: {
  visibility: AnnotationVisibility;
  fontSize?: number;
}) {
  if (visibility === 'private') {
    return <LockOutlinedIcon sx={{ fontSize }} />;
  }
  if (visibility === 'group') {
    return <GroupsOutlinedIcon sx={{ fontSize }} />;
  }
  return <PublicOutlinedIcon sx={{ fontSize }} />;
}

function getButtonSx(variant: PickerVariant, size: 'small' | 'medium') {
  const dimension = size === 'small' ? 28 : 32;
  if (variant === 'light') {
    return {
      width: dimension,
      height: dimension,
      color: cv.dialogShadow,
      '&:hover': {
        backgroundColor: cv.inkOverlay06,
        color: cv.inkOverlay80,
      },
    };
  }

  return {
    width: dimension,
    height: dimension,
    color: cv.textSecondary,
    '&:hover': {
      backgroundColor: cv.surfaceHover,
      color: cv.textPrimary,
    },
  };
}

export default function AnnotationVisibilityPicker({
  visibility,
  groupId,
  groups,
  collaborators,
  onChange,
  onCreateGroup,
  onDeleteGroup,
  onUpdateGroup,
  onAddCollaborator,
  variant = 'dark',
  size = 'small',
  elevated = false,
  isAuthor = true,
}: AnnotationVisibilityPickerProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [groupToEdit, setGroupToEdit] = useState<AnnotationAccessGroup | undefined>(undefined);
  const [groupToDelete, setGroupToDelete] = useState<AnnotationAccessGroup | null>(null);
  const resolvedVisibility = resolveAnnotationVisibility(visibility);
  const label = getVisibilityLabel(resolvedVisibility, groupId, groups);
  const open = Boolean(anchorEl);

  const handleSelect = (nextVisibility: AnnotationVisibility, nextGroupId?: string) => {
    onChange(nextVisibility, nextGroupId);
    setAnchorEl(null);
  };

  const handleCreateGroup = async (name: string, memberIds: string[]) => {
    let group: AnnotationAccessGroup | null | undefined;
    if (groupToEdit && onUpdateGroup) {
      group = await onUpdateGroup(groupToEdit.id, name, memberIds);
    } else {
      group = await onCreateGroup(name, memberIds);
    }
    if (group && group.id) {
      onChange('group', group.id);
    }
  };

  const isSelected = (option: AnnotationVisibility, optionGroupId?: string) => {
    if (resolvedVisibility !== option) return false;
    if (option === 'group') return groupId === optionGroupId;
    return true;
  };

  // Non-authors cannot change visibility — render nothing
  if (!isAuthor) return null;

  return (
    <>
      <Tooltip title={`${label} — change visibility`} arrow placement="top">
        <IconButton
          type="button"
          aria-label={`Visibility: ${label}. Change visibility.`}
          aria-haspopup="menu"
          aria-expanded={open}
          size="small"
          onClick={(event) => {
            event.stopPropagation();
            setAnchorEl(event.currentTarget);
          }}
          sx={getButtonSx(variant, size)}
        >
          <VisibilityIcon visibility={resolvedVisibility} fontSize={size === 'small' ? 18 : 20} />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          ...(elevated ? floatingPanelMenuSlotProps : {}),
          paper: { sx: menuPaperSx },
        }}
      >
        <MenuItem
          selected={isSelected('public')}
          onClick={() => handleSelect('public')}
          sx={{ fontSize: '0.875rem', gap: 1 }}
        >
          <ListItemIcon sx={{ minWidth: 28 }}>
            <PublicOutlinedIcon sx={{ fontSize: 18 }} />
          </ListItemIcon>
          <ListItemText>Public</ListItemText>
          {isSelected('public') && <CheckOutlinedIcon sx={{ fontSize: 16, ml: 1 }} />}
        </MenuItem>

        <MenuItem
          selected={isSelected('private')}
          onClick={() => handleSelect('private')}
          sx={{ fontSize: '0.875rem', gap: 1 }}
        >
          <ListItemIcon sx={{ minWidth: 28 }}>
            <LockOutlinedIcon sx={{ fontSize: 18 }} />
          </ListItemIcon>
          <ListItemText>Private</ListItemText>
          {isSelected('private') && <CheckOutlinedIcon sx={{ fontSize: 16, ml: 1 }} />}
        </MenuItem>

        {groups.length > 0 && <Divider sx={{ my: 0.5, borderColor: cv.border }} />}

        {groups.map((group) => (
          <MenuItem
            key={group.id}
            selected={isSelected('group', group.id)}
            onClick={() => handleSelect('group', group.id)}
            sx={{ fontSize: '0.875rem', gap: 1, pr: 0.5 }}
          >
            <ListItemIcon sx={{ minWidth: 28 }}>
              <GroupsOutlinedIcon sx={{ fontSize: 18 }} />
            </ListItemIcon>
            <ListItemText primary={group.name} sx={{ mr: 'auto' }} />
            {isSelected('group', group.id) && (
              <CheckOutlinedIcon sx={{ fontSize: 16, mx: 0.5 }} />
            )}
            {onUpdateGroup && (
              <IconButton
                size="small"
                aria-label={`Edit group ${group.name}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setGroupToEdit(group);
                  setCreateModalOpen(true);
                  setAnchorEl(null);
                }}
                sx={{ p: 0.25, color: cv.textMuted, '&:hover': { color: cv.textPrimary } }}
              >
                <EditOutlinedIcon sx={{ fontSize: 15 }} />
              </IconButton>
            )}
            {onDeleteGroup && (
              <IconButton
                size="small"
                aria-label={`Delete group ${group.name}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setGroupToDelete(group);
                  setAnchorEl(null);
                }}
                sx={{ p: 0.25, color: cv.textMuted, '&:hover': { color: cv.destructive } }}
              >
                <DeleteOutlinedIcon sx={{ fontSize: 15 }} />
              </IconButton>
            )}
          </MenuItem>
        ))}

        <Divider sx={{ my: 0.5, borderColor: cv.border }} />

        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            setGroupToEdit(undefined);
            setCreateModalOpen(true);
          }}
          sx={{ fontSize: '0.875rem', gap: 1 }}
        >
          <ListItemIcon sx={{ minWidth: 28 }}>
            <AddOutlinedIcon sx={{ fontSize: 18 }} />
          </ListItemIcon>
          <ListItemText>Create new group…</ListItemText>
        </MenuItem>
      </Menu>

      <CreateAnnotationGroupModal
        open={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setGroupToEdit(undefined);
        }}
        collaborators={collaborators}
        onCreate={handleCreateGroup}
        onAddCollaborator={onAddCollaborator}
        groupToEdit={groupToEdit}
      />

      <Dialog
        open={Boolean(groupToDelete)}
        onClose={() => setGroupToDelete(null)}
        PaperProps={{
          sx: {
            backgroundColor: cv.surface,
            backgroundImage: 'none',
            borderRadius: '12px',
            border: `1px solid ${cv.border}`,
            boxShadow: cv.dialogShadow,
          },
        }}
      >
        <DialogTitle sx={{ color: cv.textPrimary, fontSize: '1.125rem', pb: 1 }}>
          Delete Group?
        </DialogTitle>
        <DialogContent sx={{ pb: 2 }}>
          <DialogContentText sx={{ color: cv.textSecondary, fontSize: '0.875rem' }}>
            Are you sure you want to delete the "{groupToDelete?.name}" group? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button
            onClick={() => setGroupToDelete(null)}
            sx={{ textTransform: 'none', color: cv.textSecondary }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (groupToDelete && onDeleteGroup) {
                onDeleteGroup(groupToDelete.id);
              }
              setGroupToDelete(null);
            }}
            variant="contained"
            color="error"
            disableElevation
            sx={{ textTransform: 'none' }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
