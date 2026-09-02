import { useEffect, useMemo, useState } from 'react';
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
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import WorkOutlineOutlinedIcon from '@mui/icons-material/WorkOutlineOutlined';
import WorkspacesOutlinedIcon from '@mui/icons-material/WorkspacesOutlined';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import type { MediaItem } from '../../data/mockMedia';
import type { Workspace } from '../../data/workspaces';

import {
  PROJECT_ACCENT_COLOR,
  resolveFolderColor,
} from '../../utils/folderColorStyle';

export type MoveDestination =
  | { kind: 'folder'; folderId: string; workspaceId: string }
  | { kind: 'project'; projectId: string; workspaceId: string; targetFolderId?: string | null };

export function FolderTreeNode({
  folder,
  foldersByParent,
  selectedFolderId,
  onSelect,
  onExpand,
  level = 0,
}: {
  folder: any;
  foldersByParent: Record<string, any[]>;
  selectedFolderId: string | null;
  onSelect: (id: string) => void;
  onExpand?: (id: string) => void;
  level?: number;
}) {
  const children = foldersByParent[folder.id] || [];
  // Use backend metadata if available, otherwise assume it could have children so it's clickable
  const appearsToHaveChildren = children.length > 0 || folder.itemCount > 0 || folder.itemCount === undefined;
  const [expanded, setExpanded] = useState(false);
  const selected = selectedFolderId === folder.id;
  const color = resolveFolderColor(folder.folderColor);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          width: '100%',
          textAlign: 'left',
          border: selected ? `1px solid ${cv.purpleFocusBorder}` : '1px solid transparent',
          borderRadius: '10px',
          px: 1,
          py: 0.5,
          mb: 0.5,
          cursor: folder.disabled ? 'not-allowed' : 'pointer',
          backgroundColor: selected && !folder.disabled ? cv.purpleSelectionSoft : 'transparent',
          color: folder.disabled ? cv.textMuted : cv.textPrimary,
          pl: level * 2 + 1,
          '&:hover': {
            backgroundColor: selected && !folder.disabled ? cv.purpleSelectionHover : (folder.disabled ? 'transparent' : cv.surfaceHover),
          },
        }}
        onClick={() => {
          if (!folder.disabled) onSelect(folder.id);
        }}
      >
        <Box
          component="span"
          onClick={(e) => {
            e.stopPropagation();
            if (!expanded && onExpand && children.length === 0) onExpand(folder.id);
            setExpanded(!expanded);
          }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 20,
            height: 20,
            cursor: 'pointer',
            opacity: appearsToHaveChildren ? 1 : 0.4,
            '&:hover': {
              backgroundColor: cv.surfaceHover,
              borderRadius: '4px'
            }
          }}
        >
          {expanded ? (
            <ExpandMoreIcon sx={{ fontSize: 16, color: cv.textMuted }} />
          ) : (
            <ChevronRightIcon sx={{ fontSize: 16, color: cv.textMuted }} />
          )}
        </Box>
        <FolderOutlinedIcon sx={{ fontSize: 18, color: folder.disabled ? cv.textMuted : color, flexShrink: 0 }} />
        <Typography noWrap sx={{ fontSize: '0.875rem', fontWeight: selected && !folder.disabled ? 600 : 500 }}>
          {folder.title}
        </Typography>
      </Box>

      {expanded && children.length > 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          {children.map((child) => (
            <FolderTreeNode
              key={child.id}
              folder={child}
              foldersByParent={foldersByParent}
              selectedFolderId={selectedFolderId}
              onSelect={onSelect}
              onExpand={onExpand}
              level={level + 1}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}

type DestinationSubTab = 'folder' | 'project';

interface MoveItemsModalProps {
  open: boolean;
  itemCount: number;
  /** Item being moved — used to exclude itself from folder destinations. */
  excludeItemId?: string;
  sourceItemIds?: string[];
  mediaItems: MediaItem[];
  workspaces: Workspace[];
  activeWorkspaceId: string;
  trashedIds: Set<string>;
  onClose: () => void;
  onMove: (destination: MoveDestination) => void;
}

const dialogPaperSx = {
  borderRadius: '20px',
  border: '1px solid var(--noah-border)',
  background: 'var(--noah-dialog-surface)',
  backdropFilter: 'blur(40px) saturate(180%)',
  boxShadow: cv.dialogShadow,
  maxWidth: 480,
};

const tabRowSx = {
  display: 'flex',
  gap: 0.5,
  p: 0.5,
  borderRadius: '12px',
  backgroundColor: cv.surface,
  border: `1px solid ${cv.border}`,
  mb: 1.5,
};

function tabButtonSx(active: boolean) {
  return {
    flex: 1,
    border: 'none',
    borderRadius: '8px',
    px: 1.5,
    py: 0.85,
    fontSize: '0.8125rem',
    fontWeight: active ? 600 : 500,
    cursor: 'pointer',
    color: active ? cv.textPrimary : cv.textSecondary,
    backgroundColor: active ? cv.purpleSelectionHover : 'transparent',
    boxShadow: active ? `inset 0 0 0 1px ${cv.purpleSelectionStrong}` : 'none',
    transition: 'background-color 0.15s ease, color 0.15s ease',
    '&:hover': {
      color: cv.textPrimary,
      backgroundColor: active ? cv.purpleSelectionMedium : cv.glassBackground,
    },
  };
}

function listButtonSx(selected: boolean) {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 1.25,
    width: '100%',
    textAlign: 'left' as const,
    border: selected ? `1px solid ${cv.purpleFocusBorder}` : '1px solid transparent',
    borderRadius: '10px',
    px: 1.25,
    py: 1,
    mb: 0.5,
    cursor: 'pointer',
    backgroundColor: selected ? cv.purpleSelectionSoft : 'transparent',
    color: cv.textPrimary,
    '&:hover': {
      backgroundColor: selected ? cv.purpleSelectionHover : cv.surfaceHover,
    },
  };
}



export default function MoveItemsModal({
  open,
  itemCount,
  excludeItemId,
  sourceItemIds,
  mediaItems,
  workspaces,
  activeWorkspaceId,
  trashedIds,
  onClose,
  onMove,
}: MoveItemsModalProps) {
  const [destinationSubTab, setDestinationSubTab] = useState<DestinationSubTab>('folder');
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(activeWorkspaceId);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const [fetchedFolders, setFetchedFolders] = useState<any[]>([]);
  const [fetchedProjects, setFetchedProjects] = useState<any[]>([]);
  const [isLoadingDestinations, setIsLoadingDestinations] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDestinationSubTab('folder');
    setSelectedWorkspaceId(activeWorkspaceId);
    setSelectedFolderId(null);
    setSelectedProjectId(null);
  }, [open, activeWorkspaceId]);

  useEffect(() => {
    if (!open || !selectedWorkspaceId) return;

    let mounted = true;
    setIsLoadingDestinations(true);
    setFetchedFolders([]);
    setFetchedProjects([]);

    import('../../api/client').then(({ apiClient }) => {
      // Use timestamp param for cache-busting to avoid stale workspace data between switches
      apiClient.get<any>(`/workspaces/find-all-data/${selectedWorkspaceId}?_t=${Date.now()}`)
        .then(response => {
          if (!mounted) return;
          // apiClient auto-unwraps the top-level { success, data } envelope,
          // so `response` here IS the inner object: { media, folders, projects, allProjects }
          console.log('[MoveModal] raw response:', response);
          const data = (response as any) || {};
          const folders = data.folders || [];
          const projects = data.allProjects || data.projects || [];
          console.log('[MoveModal] folders:', folders.length, 'projects:', projects.length);
          setFetchedFolders(folders);
          setFetchedProjects(projects);
          setIsLoadingDestinations(false);
        })
        .catch(err => {
          console.error('[MoveModal] Failed to fetch workspace data', err);
          if (mounted) setIsLoadingDestinations(false);
        });
    });

    return () => { mounted = false; };
  }, [selectedWorkspaceId, open]);

  const handleFetchChildren = async (folderId: string) => {
    try {
      const { apiClient } = await import('../../api/client');
      const response = await apiClient.get<any>(`/workspaces/folder/find-all-data/${folderId}`);
      const data = response.data || response;
      const actualData = data.data || data;
      if (actualData && Array.isArray(actualData.folders)) {
        setFetchedFolders((prev) => {
          const newFolders = actualData.folders.filter((nf: any) => !prev.some((pf) => pf.id === nf.id));
          if (newFolders.length === 0) return prev;
          return [...prev, ...newFolders];
        });
      }
    } catch (err) {
      console.error('[MoveModal] Failed to fetch folder children', err);
    }
  };

  const { rootFolders, foldersByParent } = useMemo(() => {
    const activeFolders = fetchedFolders.filter(f => !trashedIds.has(f.id));

    const excludedIds = new Set<string>();
    if (excludeItemId) excludedIds.add(excludeItemId);
    if (sourceItemIds) sourceItemIds.forEach(id => excludedIds.add(id));

    if (excludedIds.size > 0) {
      let changed = true;
      while (changed) {
        changed = false;
        for (const f of activeFolders) {
          if (f.parentId && excludedIds.has(f.parentId) && !excludedIds.has(f.id)) {
            excludedIds.add(f.id);
            changed = true;
          }
        }
      }
    }

    const mappedFolders = activeFolders.map(folder => ({
      id: folder.id,
      title: folder.name,
      folderColor: folder.color,
      parentFolderId: folder.parentId || null,
      disabled: excludedIds.has(folder.id),
    })).sort((a, b) => a.title.localeCompare(b.title));

    const byParent: Record<string, any[]> = {};
    const roots: any[] = [];

    mappedFolders.forEach(f => {
      const pid = f.parentFolderId;
      if (pid) {
        if (!byParent[pid]) byParent[pid] = [];
        byParent[pid].push(f);
      } else {
        roots.push(f);
      }
    });

    // In case a parent is missing (e.g. database inconsistency), promote orphans to root
    mappedFolders.forEach(f => {
      const pid = f.parentFolderId;
      if (pid && !mappedFolders.find(p => p.id === pid)) {
        if (!roots.includes(f)) roots.push(f);
      }
    });

    return { rootFolders: roots, foldersByParent: byParent };
  }, [fetchedFolders, excludeItemId, trashedIds]);

  const { movingItems, hasFiles, allAlreadyAtRoot, hasProjects } = useMemo(() => {
    const ids = sourceItemIds || (excludeItemId ? [excludeItemId] : []);
    const items = mediaItems.filter(item => ids.includes(item.id));
    return {
      movingItems: items,
      hasFiles: items.some(item => item.type !== 'folder'),
      allAlreadyAtRoot: items.length > 0 && items.every(item => !item.parentFolderId),
      hasProjects: items.some(item => item.isProject)
    };
  }, [mediaItems, sourceItemIds, excludeItemId]);

  const alreadyAssignedProjectIds = useMemo(() => {
    const projectIds = new Set<string>();
    movingItems.forEach(item => {
      (item.linkedProjectIds || []).forEach(pid => projectIds.add(pid));
    });
    return projectIds;
  }, [mediaItems, sourceItemIds, excludeItemId]);

  const workspaceProjects = useMemo(() => {
    return fetchedProjects
      .filter((project) => project.id !== excludeItemId && !alreadyAssignedProjectIds.has(project.id) && !trashedIds.has(project.id))
      .map((project) => ({
        id: project.id,
        title: project.name,
        folderId: project.folderId || null,
      }))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [fetchedProjects, excludeItemId, alreadyAssignedProjectIds, trashedIds]);

  const canMove =
    destinationSubTab === 'folder'
      ? Boolean(selectedFolderId)
      : Boolean(selectedProjectId);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canMove) return;

    if (destinationSubTab === 'folder' && selectedFolderId) {
      onMove({
        kind: 'folder',
        folderId: selectedFolderId,
        workspaceId: selectedWorkspaceId,
      });
    } else if (destinationSubTab === 'project' && selectedProjectId) {
      const project = workspaceProjects.find(p => p.id === selectedProjectId);
      onMove({
        kind: 'project',
        projectId: selectedProjectId,
        workspaceId: selectedWorkspaceId,
        targetFolderId: project?.folderId || null,
      });
    } else {
      return;
    }

    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      aria-labelledby="move-items-title"
      slotProps={{
        paper: { sx: dialogPaperSx },
        backdrop: {
          sx: { backgroundColor: cv.backdropScrim, backdropFilter: 'blur(4px)' },
        },
      }}
    >
      <Box component="form" onSubmit={handleSubmit}>
        <DialogTitle
          id="move-items-title"
          sx={{
            pb: 0.5,
            fontWeight: 600,
            fontSize: '1.5rem',
            color: cv.textPrimary,
          }}
        >
          Move items
        </DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          <Typography variant="body2" sx={{ color: cv.textSecondary, mb: 2 }}>
            Choose where to move {itemCount} {itemCount === 1 ? 'item' : 'items'}.
          </Typography>

          <Typography
            sx={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: cv.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              mb: 1,
            }}
          >
            1. Select workspace
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2.5 }}>
            {workspaces.map((workspace) => {
              const selected = selectedWorkspaceId === workspace.id;
              const isLocked = false;
              return (
                <Box
                  key={workspace.id}
                  component="button"
                  type="button"
                  disabled={isLocked}
                  onClick={() => {
                    if (isLocked) return;
                    setSelectedWorkspaceId(workspace.id);
                    setSelectedFolderId(null);
                    setSelectedProjectId(null);
                  }}
                  sx={{
                    ...listButtonSx(selected),
                    alignItems: 'flex-start',
                    mb: 0,
                    opacity: isLocked ? 0.5 : 1,
                    cursor: isLocked ? 'not-allowed' : 'pointer',
                    border: selected
                      ? `1px solid ${cv.purpleFocusBorder}`
                      : `1px solid ${cv.border}`,
                  }}
                >
                  <WorkspacesOutlinedIcon
                    sx={{
                      fontSize: 20,
                      color: workspace.color || cv.brandPurple,
                      mt: 0.15,
                      flexShrink: 0,
                    }}
                  />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: cv.textPrimary,
                      }}
                    >
                      {workspace.name}
                    </Typography>
                    {workspace.description ? (
                      <Typography
                        sx={{
                          fontSize: '0.75rem',
                          color: cv.textMuted,
                          mt: 0.25,
                        }}
                      >
                        {workspace.description}
                      </Typography>
                    ) : null}
                  </Box>
                </Box>
              );
            })}
          </Box>

          <Typography
            sx={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: cv.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              mb: 1,
            }}
          >
            2. Move into folder or assign to project
          </Typography>

          <Box sx={tabRowSx} role="tablist" aria-label="Move into folder or project">
            {(
              [
                { value: 'folder', label: 'Folder' },
                { value: 'project', label: 'Project' },
              ] as const
            ).map((option) => (
              <Box
                key={option.value}
                component="button"
                type="button"
                role="tab"
                aria-selected={destinationSubTab === option.value}
                onClick={() => {
                  setDestinationSubTab(option.value);
                  setSelectedFolderId(null);
                  setSelectedProjectId(null);
                }}
                sx={tabButtonSx(destinationSubTab === option.value)}
              >
                {option.label}
              </Box>
            ))}
          </Box>

          <Box sx={{ maxHeight: 240, overflowY: 'auto', pr: 0.5 }}>
            {isLoadingDestinations ? (
              <Typography sx={{ fontSize: '0.875rem', color: cv.textMuted, py: 2, textAlign: 'center' }}>
                Loading destinations...
              </Typography>
            ) : destinationSubTab === 'folder' ? (
              rootFolders.length === 0 ? (
                <Typography
                  sx={{ fontSize: '0.875rem', color: cv.textMuted, py: 2, textAlign: 'center' }}
                >
                  No folders available
                </Typography>
              ) : (
                <>
                  {/* Workspace Root option temporarily hidden per user request */}
                  {false && !hasFiles && (!allAlreadyAtRoot || selectedWorkspaceId !== activeWorkspaceId) && (
                    <Box
                      component="button"
                      type="button"
                      onClick={() => {
                        setSelectedFolderId('__ROOT__');
                        setSelectedProjectId(null);
                      }}
                      sx={listButtonSx(selectedFolderId === '__ROOT__')}
                    >
                      <FolderOutlinedIcon sx={{ fontSize: 18, color: cv.brandMain, flexShrink: 0 }} />
                      <Typography
                        noWrap
                        sx={{ fontSize: '0.875rem', fontWeight: selectedFolderId === '__ROOT__' ? 600 : 500 }}
                      >
                        Workspace Root
                      </Typography>
                    </Box>
                  )}
                  {rootFolders.map((folder) => (
                    <FolderTreeNode
                      key={folder.id}
                      folder={folder}
                      foldersByParent={foldersByParent}
                      selectedFolderId={selectedFolderId}
                      onSelect={(id) => {
                        setSelectedFolderId(id);
                        setSelectedProjectId(null);
                      }}
                      onExpand={handleFetchChildren}
                    />
                  ))}
                </>
              )
            ) : workspaceProjects.length === 0 ? (
              <Typography
                sx={{ fontSize: '0.875rem', color: cv.textMuted, py: 2, textAlign: 'center' }}
              >
                No projects available
              </Typography>
            ) : (
              workspaceProjects.map((project) => {
                const selected = selectedProjectId === project.id;
                return (
                  <Box
                    key={project.id}
                    component="button"
                    type="button"
                    onClick={() => {
                      setSelectedProjectId(project.id);
                      setSelectedFolderId(null);
                    }}
                    sx={listButtonSx(selected)}
                  >
                    <WorkOutlineOutlinedIcon
                      sx={{ fontSize: 18, color: PROJECT_ACCENT_COLOR, flexShrink: 0 }}
                    />
                    <Typography
                      noWrap
                      sx={{ fontSize: '0.875rem', fontWeight: selected ? 600 : 500 }}
                    >
                      {project.title}
                    </Typography>
                  </Box>
                );
              })
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
            disabled={!canMove}
            sx={{
              borderRadius: '10px',
              px: 2.5,
              background: cv.brandGradient,
              boxShadow: cv.brandShadow,
              '&:hover': { background: cv.brandGradientHover },
              '&.Mui-disabled': {
                background: cv.surfaceHover,
                color: cv.textMuted,
              },
            }}
          >
            {destinationSubTab === 'project' ? 'Assign' : 'Move'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
