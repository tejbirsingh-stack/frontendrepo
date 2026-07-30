import { useEffect, useMemo, useState } from 'react';
import { cv } from '../../theme/cssVars';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { dropdownMenuProps } from '../../constants/dropdownMenu';
import type { ManagedTag, TagScope } from '../../types/managedTag';
import type { Workspace } from '../../data/workspaces';

interface CreateTagModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  workspaces: Workspace[];
  activeWorkspaceId: string;
  editingTag?: ManagedTag | null;
  availableTags?: ManagedTag[];
  onClose: () => void;
  onCreate: (input: {
    name: string;
    scope: TagScope;
    workspaceId: string | null;
    parentId?: string | null;
  }) => boolean | Promise<boolean>;
  onUpdate: (id: string, updates: { name?: string; parentId?: string | null }) => boolean | Promise<boolean>;
}

const dialogPaperSx = {
  borderRadius: '20px',
  border: '1px solid var(--noah-border)',
  background: 'var(--noah-dialog-surface)',
  backdropFilter: 'blur(40px) saturate(180%)',
  boxShadow: cv.dialogShadow,
  maxWidth: 480,
};

const scopeDescriptions: Record<TagScope, string> = {
  personal: 'Only you can see and use this tag.',
  company: 'Visible to everyone in your organization.',
  project: 'Available only within the selected project workspace.',
};

export default function CreateTagModal({
  open,
  mode,
  workspaces,
  activeWorkspaceId,
  editingTag,
  availableTags = [],
  onClose,
  onCreate,
  onUpdate,
}: CreateTagModalProps) {
  const [name, setName] = useState('');
  const [scope, setScope] = useState<TagScope>('personal');
  const [workspaceId, setWorkspaceId] = useState(activeWorkspaceId);
  const [parentId, setParentId] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Compute all descendant IDs of the tag being edited.
  // These must be excluded from the parent picker to prevent circular references.
  // Uses BFS over the flat availableTags list (each tag has a parentId).
  const descendantIds = useMemo<Set<string>>(() => {
    if (!editingTag) return new Set();
    const result = new Set<string>();
    const queue = [editingTag.id];
    while (queue.length > 0) {
      const current = queue.shift()!;
      const children = availableTags.filter((t) => t.parentId === current);
      for (const child of children) {
        result.add(child.id);
        queue.push(child.id);
      }
    }
    return result;
  }, [editingTag, availableTags]);

  useEffect(() => {
    if (!open) return;

    if (mode === 'edit' && editingTag) {
      setName(editingTag.name);
      setScope(editingTag.scope);
      setWorkspaceId(editingTag.workspaceId ?? activeWorkspaceId);
      setParentId(editingTag.parentId ?? null);
    } else {
      setName('');
      setScope('personal');
      setWorkspaceId(activeWorkspaceId);
      setParentId(null);
    }
    setError('');
  }, [activeWorkspaceId, editingTag, mode, open]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Tag name is required.');
      return;
    }

    if (scope === 'project' && !workspaceId) {
      setError('Select a project workspace for this tag.');
      return;
    }

    const success =
      mode === 'edit' && editingTag
        ? await onUpdate(editingTag.id, { name: trimmed, parentId })
        : await onCreate({
            name: trimmed,
            scope,
            workspaceId: scope === 'project' ? workspaceId : null,
            parentId,
          });

    if (!success) {
      setError('A tag with this name already exists in this scope.');
      return;
    }

    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      aria-labelledby="create-tag-title"
      slotProps={{
        paper: { sx: dialogPaperSx },
        backdrop: {
          sx: { backgroundColor: cv.backdropScrim, backdropFilter: 'blur(4px)' },
        },
      }}
    >
      <Box component="form" onSubmit={handleSubmit}>
        <DialogTitle
          id="create-tag-title"
          sx={{ pb: 1, fontWeight: 600, fontSize: '1.25rem', color: cv.textPrimary }}
        >
          {mode === 'edit' ? 'Edit tag' : 'Create tag'}
        </DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          <Typography variant="body2" sx={{ color: cv.textSecondary, mb: 2 }}>
            {mode === 'edit'
              ? 'Update the tag name. Scope and color are managed by category settings.'
              : 'Create a personal, company-wide, or project-specific tag. Color comes from the tag category.'}
          </Typography>

          <TextField
            fullWidth
            label="Tag name"
            placeholder="e.g. campaign"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            autoFocus
            required
            error={!!error}
            helperText={error || `${name.length}/50`}
            slotProps={{
              inputLabel: { shrink: true },
              htmlInput: { maxLength: 50 },
            }}
            sx={{
              mb: 2,
              '& .MuiFormHelperText-root': {
                textAlign: error ? 'left' : 'right',
                color: error ? undefined : cv.textMuted,
                fontSize: '0.75rem',
                mt: 0.5,
              },
            }}
          />

          {mode === 'create' ? (
            <>
              <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: cv.textPrimary, mb: 1 }}>
                Tag type
              </Typography>
              <FormControl fullWidth sx={{ mb: 1.5 }}>
                <RadioGroup
                  value={scope}
                  onChange={(event) => {
                    setScope(event.target.value as TagScope);
                    setParentId(null); // reset parent when scope changes
                    setError('');
                  }}
                >
                  <FormControlLabel
                    value="personal"
                    control={<Radio size="small" sx={{ color: cv.textMuted }} />}
                    label={
                      <Box>
                        <Typography sx={{ fontSize: '0.875rem', color: cv.textPrimary }}>
                          Personal
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted }}>
                          {scopeDescriptions.personal}
                        </Typography>
                      </Box>
                    }
                    sx={{ alignItems: 'flex-start', mx: 0, mb: 1 }}
                  />
                  <FormControlLabel
                    value="company"
                    control={<Radio size="small" sx={{ color: cv.textMuted }} />}
                    label={
                      <Box>
                        <Typography sx={{ fontSize: '0.875rem', color: cv.textPrimary }}>
                          Company
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted }}>
                          {scopeDescriptions.company}
                        </Typography>
                      </Box>
                    }
                    sx={{ alignItems: 'flex-start', mx: 0, mb: 1 }}
                  />
                  <FormControlLabel
                    value="project"
                    control={<Radio size="small" sx={{ color: cv.textMuted }} />}
                    label={
                      <Box>
                        <Typography sx={{ fontSize: '0.875rem', color: cv.textPrimary }}>
                          Project
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted }}>
                          {scopeDescriptions.project}
                        </Typography>
                      </Box>
                    }
                    sx={{ alignItems: 'flex-start', mx: 0 }}
                  />
                </RadioGroup>
              </FormControl>

              {scope === 'project' ? (
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: cv.textPrimary, mb: 1 }}>
                    Project workspace
                  </Typography>
                  <Select
                    value={workspaceId}
                    onChange={(event: SelectChangeEvent) => setWorkspaceId(event.target.value)}
                    MenuProps={dropdownMenuProps}
                    sx={{
                      borderRadius: '10px',
                      fontSize: '0.875rem',
                      color: cv.textSecondary,
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: cv.border },
                    }}
                  >
                    {workspaces.map((workspace) => (
                      <MenuItem
                        key={workspace.id}
                        value={workspace.id}
                        sx={{ fontSize: '0.875rem', color: cv.textPrimary }}
                      >
                        {workspace.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : null}

              <FormControl fullWidth sx={{ mb: 2 }}>
                <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: cv.textPrimary, mb: 1 }}>
                  Parent tag (optional)
                </Typography>
                <Select
                  value={parentId ?? 'none'}
                  onChange={(event: SelectChangeEvent) => {
                    const val = event.target.value;
                    setParentId(val === 'none' ? null : val);
                    setError('');
                  }}
                  MenuProps={dropdownMenuProps}
                  sx={{
                    borderRadius: '10px',
                    fontSize: '0.875rem',
                    color: parentId ? cv.textPrimary : cv.textSecondary,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: cv.border },
                  }}
                >
                  <MenuItem value="none" sx={{ fontSize: '0.875rem', color: cv.textSecondary }}>
                    None (top-level tag)
                  </MenuItem>
                  {availableTags
                    .filter((t) => {
                      if (t.id === editingTag?.id) return false;
                      if (descendantIds.has(t.id)) return false; // block descendants (cycle prevention)
                      if (scope === 'personal') return t.scope === 'personal';
                      if (scope === 'company') return t.scope === 'company';
                      if (scope === 'project') {
                        return t.scope === 'company' || (t.scope === 'project' && t.workspaceId === workspaceId);
                      }
                      return false;
                    })
                    .map((tag) => (
                    <MenuItem
                      key={tag.id}
                      value={tag.id}
                      sx={{ fontSize: '0.875rem', color: cv.textPrimary }}
                    >
                      {tag.scope === 'company' && scope === 'project' ? (
                        <Box component="span" sx={{ fontSize: '0.7rem', opacity: 0.6, mr: 0.5 }}>[Company]</Box>
                      ) : null}
                      {tag.parentName ? `${tag.parentName} › ` : ''}{tag.name}
                    </MenuItem>
                  ))}
                </Select>
                <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted, mt: 0.5 }}>
                  Assigning this tag will automatically apply its parent tags.
                </Typography>
              </FormControl>
            </>
          ) : editingTag ? (
            <Box
              sx={{
                mb: 2,
                px: 1.25,
                py: 1,
                borderRadius: '10px',
                border: `1px solid ${cv.border}`,
                backgroundColor: cv.surface,
              }}
            >
              <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted, mb: 0.25 }}>
                Scope
              </Typography>
              <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: cv.textPrimary }}>
                {editingTag.scope === 'personal'
                  ? 'Personal'
                  : editingTag.scope === 'company'
                    ? 'Company'
                    : `Project · ${
                        workspaces.find((workspace) => workspace.id === editingTag.workspaceId)
                          ?.name ?? 'Workspace'
                      }`}
              </Typography>
            </Box>
          ) : null}

          {mode === 'edit' && editingTag ? (
            <FormControl fullWidth sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: cv.textPrimary, mb: 1 }}>
                Parent tag (optional)
              </Typography>
              <Select
                value={parentId ?? 'none'}
                onChange={(event: SelectChangeEvent) => {
                  const val = event.target.value;
                  setParentId(val === 'none' ? null : val);
                  setError('');
                }}
                MenuProps={dropdownMenuProps}
                sx={{
                  borderRadius: '10px',
                  fontSize: '0.875rem',
                  color: parentId ? cv.textPrimary : cv.textSecondary,
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: cv.border },
                }}
              >
                <MenuItem value="none" sx={{ fontSize: '0.875rem', color: cv.textSecondary }}>
                  None (top-level tag)
                </MenuItem>
                {availableTags
                  .filter((t) => {
                    if (t.id === editingTag?.id) return false;
                    if (descendantIds.has(t.id)) return false; // block descendants (cycle prevention)
                    if (scope === 'personal') return t.scope === 'personal';
                    if (scope === 'company') return t.scope === 'company';
                    if (scope === 'project') {
                      return t.scope === 'company' || (t.scope === 'project' && t.workspaceId === workspaceId);
                    }
                    return false;
                  })
                  .map((tag) => (
                  <MenuItem
                    key={tag.id}
                    value={tag.id}
                    sx={{ fontSize: '0.875rem', color: cv.textPrimary }}
                  >
                    {tag.parentName ? `${tag.parentName} › ` : ''}{tag.name}
                  </MenuItem>
                ))}
              </Select>
              <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted, mt: 0.5 }}>
                Assigning this tag will automatically apply its parent tags.
              </Typography>
            </FormControl>
          ) : null}

          {error ? (
            <Typography sx={{ mt: 2, fontSize: '0.8125rem', color: cv.destructive }}>
              {error}
            </Typography>
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
            }}
          >
            {mode === 'edit' ? 'Save changes' : 'Create tag'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
