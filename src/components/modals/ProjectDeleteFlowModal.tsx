import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  Collapse,
} from '@mui/material';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined';
import WorkOutlineOutlinedIcon from '@mui/icons-material/WorkOutlineOutlined';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import VideocamOutlinedIcon from '@mui/icons-material/VideocamOutlined';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import AudioFileOutlinedIcon from '@mui/icons-material/AudioFileOutlined';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { cv } from '../../theme/cssVars';
import { PROJECT_ACCENT_COLOR } from '../../utils/folderColorStyle';
import { apiClient } from '../../api/client';

export interface ProjectDeleteFlowModalProps {
  open: boolean;
  projectId: string | null;
  projectName?: string;
  onClose: () => void;
  onConfirmDelete: (
    projectId: string,
    isWholeProject: boolean,
    selectedFileIds: string[],
    selectedFolderIds: string[]
  ) => Promise<void>;
}

interface FileItem {
  id: string;
  title: string;
  type?: string;
  ownerType?: string;
  ownerId?: string;
  folderId?: string;
}

interface FolderItem {
  id: string;
  name: string;
  parentId?: string | null;
}

interface TreeNode {
  id: string;
  name: string;
  isFolder: boolean;
  type?: string;
  children: TreeNode[];
  parentId?: string | null;
  allDescendantAssetIds: string[];
  allDescendantFolderIds: string[];
}

const isWorkspaceDateContainer = (name?: string): boolean => {
  if (!name) return false;
  const trimmed = name.trim();
  if (/^\d{4}$/.test(trimmed)) return true;
  const lower = trimmed.toLowerCase();
  const months = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december',
    'jan', 'feb', 'mar', 'apr', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
  ];
  return months.some((m) => {
    if (lower === m) return true;
    if (lower.includes(m) && (/\d/.test(lower) || lower.includes('/') || lower.includes('-'))) return true;
    return false;
  });
};

export default function ProjectDeleteFlowModal({
  open,
  projectId,
  projectName = 'Project',
  onClose,
  onConfirmDelete,
}: ProjectDeleteFlowModalProps) {
  // Modal step: 'confirm1' -> ('confirm_whole' | 'select_tree' -> 'confirm_selected')
  const [step, setStep] = useState<'confirm1' | 'confirm_whole' | 'select_tree' | 'confirm_selected'>('confirm1');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);

  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  const [selectedFolderIds, setSelectedFolderIds] = useState<Set<string>>(new Set());
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(new Set());
  const [isProjectRootChecked, setIsProjectRootChecked] = useState(true);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!open || !projectId) {
      setStep('confirm1');
      setFiles([]);
      setFolders([]);
      setSelectedFileIds(new Set());
      setSelectedFolderIds(new Set());
      setExpandedFolderIds(new Set());
      setIsProjectRootChecked(true);
      return;
    }
    setStep('confirm1');
  }, [open, projectId]);

  // Load project files and folders when stepping into 'select_tree'
  useEffect(() => {
    if (step !== 'select_tree' || !projectId) return;

    const fetchProjectTree = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await apiClient.get<any>(`/workspaces/project/find-all-data/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = res.data?.data || res.data || res;
        const mediaList: any[] = (Array.isArray(payload?.media) ? payload.media : [])
          .filter((m: any) => m.type !== 'folder');
        const folderListUnfiltered: any[] = Array.isArray(payload?.folders) ? payload.folders : [];
        const folderList = folderListUnfiltered.filter((f) => !isWorkspaceDateContainer(f.name));

        const formattedFiles: FileItem[] = mediaList.map((m) => ({
          id: m.id,
          title: m.title || m.name || 'Untitled File',
          type: m.type || 'file',
          ownerType: m.ownerType,
          ownerId: m.ownerId,
          folderId: m.folderId || (m.ownerType === 'FOLDER' ? m.ownerId : undefined),
        }));

        const formattedFolders: FolderItem[] = folderList.map((f) => ({
          id: f.id,
          name: f.name || 'Untitled Folder',
          parentId: f.parentId || f.parent_folder_id || null,
        }));

        setFiles(formattedFiles);
        setFolders(formattedFolders);

        // By default select all files and folders when opening tree
        const allFileSet = new Set(formattedFiles.map((f) => f.id));
        const allFolderSet = new Set(formattedFolders.map((f) => f.id));
        setSelectedFileIds(allFileSet);
        setSelectedFolderIds(allFolderSet);
        setIsProjectRootChecked(true);

        // Keep folders collapsed by default
        setExpandedFolderIds(new Set());
      } catch (err) {
        console.error('Failed to load project files & folders:', err);
      } finally {
        setLoading(false);
      }
    };

    void fetchProjectTree();
  }, [step, projectId]);

  // Build tree data structure
  const treeData = useMemo(() => {
    if (!files.length && !folders.length) return [];

    const folderMap = new Map<string, TreeNode>();
    folders.forEach((f) => {
      folderMap.set(f.id, {
        id: f.id,
        name: f.name,
        isFolder: true,
        children: [],
        parentId: f.parentId,
        allDescendantAssetIds: [],
        allDescendantFolderIds: [f.id],
      });
    });

    const rootNodes: TreeNode[] = [];

    // Attach folders to parents or root
    folders.forEach((f) => {
      const node = folderMap.get(f.id)!;
      if (f.parentId && folderMap.has(f.parentId)) {
        folderMap.get(f.parentId)!.children.push(node);
      } else {
        rootNodes.push(node);
      }
    });

    // Attach files to folder or root
    files.forEach((file) => {
      const fileNode: TreeNode = {
        id: file.id,
        name: file.title,
        isFolder: false,
        type: file.type,
        children: [],
        allDescendantAssetIds: [file.id],
        allDescendantFolderIds: [],
      };

      if (file.folderId && folderMap.has(file.folderId)) {
        folderMap.get(file.folderId)!.children.push(fileNode);
      } else {
        rootNodes.push(fileNode);
      }
    });

    // Compute descendant IDs recursively
    const computeDescendants = (node: TreeNode): { assets: string[]; folders: string[] } => {
      let assets = node.isFolder ? [] : [node.id];
      let descendantFolders = node.isFolder ? [node.id] : [];

      for (const child of node.children) {
        const childRes = computeDescendants(child);
        assets = assets.concat(childRes.assets);
        descendantFolders = descendantFolders.concat(childRes.folders);
      }

      node.allDescendantAssetIds = Array.from(new Set(assets));
      node.allDescendantFolderIds = Array.from(new Set(descendantFolders));
      return { assets: node.allDescendantAssetIds, folders: node.allDescendantFolderIds };
    };

    rootNodes.forEach(computeDescendants);

    return rootNodes;
  }, [files, folders]);

  // Toggle folder expand/collapse
  const toggleExpand = (folderId: string) => {
    setExpandedFolderIds((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  // Check/uncheck single item or folder node
  const toggleNodeSelection = (node: TreeNode) => {
    const isCurrentlySelected = node.isFolder
      ? selectedFolderIds.has(node.id)
      : selectedFileIds.has(node.id);

    const nextFiles = new Set(selectedFileIds);
    const nextFolders = new Set(selectedFolderIds);

    const targetAssets = node.allDescendantAssetIds;
    const targetFolders = node.allDescendantFolderIds;

    if (isCurrentlySelected) {
      targetAssets.forEach((id) => nextFiles.delete(id));
      targetFolders.forEach((id) => nextFolders.delete(id));
    } else {
      targetAssets.forEach((id) => nextFiles.add(id));
      targetFolders.forEach((id) => nextFolders.add(id));
    }

    setSelectedFileIds(nextFiles);
    setSelectedFolderIds(nextFolders);

    const allFilesCount = files.length;
    const allFoldersCount = folders.length;
    setIsProjectRootChecked(
      nextFiles.size === allFilesCount && nextFolders.size === allFoldersCount
    );
  };

  // Toggle Project Root level check/uncheck all
  const toggleProjectRootSelection = () => {
    if (isProjectRootChecked) {
      setSelectedFileIds(new Set());
      setSelectedFolderIds(new Set());
      setIsProjectRootChecked(false);
    } else {
      setSelectedFileIds(new Set(files.map((f) => f.id)));
      setSelectedFolderIds(new Set(folders.map((f) => f.id)));
      setIsProjectRootChecked(true);
    }
  };

  // Handle Scenario 1 Submit (Delete Whole Project)
  const handleWholeProjectSubmit = async () => {
    if (!projectId) return;
    setSubmitting(true);
    try {
      await onConfirmDelete(projectId, true, [], []);
      onClose();
    } catch (err) {
      console.error('Delete whole project failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Scenario 2 Submit (Delete Selected Files/Folders or Empty Project)
  const handleSelectedSubmit = async () => {
    if (!projectId) return;
    setSubmitting(true);
    try {
      const isWhole = treeData.length === 0;
      await onConfirmDelete(
        projectId,
        isWhole,
        Array.from(selectedFileIds),
        Array.from(selectedFolderIds),
      );
      onClose();
    } catch (err) {
      console.error('Delete selected files failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Render file/folder icon helper
  const renderItemIcon = (isFolder: boolean, type?: string, isExpanded?: boolean) => {
    if (isFolder) {
      return isExpanded ? (
        <FolderOpenOutlinedIcon sx={{ fontSize: 20, color: cv.warning }} />
      ) : (
        <FolderOutlinedIcon sx={{ fontSize: 20, color: cv.warning }} />
      );
    }

    const rawType = (type || '').toLowerCase();
    if (rawType.includes('video')) return <VideocamOutlinedIcon sx={{ fontSize: 20, color: cv.brandBlue }} />;
    if (rawType.includes('image')) return <ImageOutlinedIcon sx={{ fontSize: 20, color: cv.success }} />;
    if (rawType.includes('audio')) return <AudioFileOutlinedIcon sx={{ fontSize: 20, color: cv.brandPurple }} />;
    return <InsertDriveFileOutlinedIcon sx={{ fontSize: 20, color: cv.textMuted }} />;
  };

  // Recursive Tree Node Renderer
  const renderTreeNode = (node: TreeNode, depth: number = 0) => {
    const isExpanded = expandedFolderIds.has(node.id);

    // Calculate node selection state
    let isChecked = false;
    let isIndeterminate = false;

    if (node.isFolder) {
      const totalChildrenCount = node.allDescendantAssetIds.length + node.allDescendantFolderIds.length;
      let selectedChildrenCount = 0;
      node.allDescendantAssetIds.forEach((id) => {
        if (selectedFileIds.has(id)) selectedChildrenCount++;
      });
      node.allDescendantFolderIds.forEach((id) => {
        if (selectedFolderIds.has(id)) selectedChildrenCount++;
      });

      isChecked = selectedFolderIds.has(node.id) || (totalChildrenCount > 0 && selectedChildrenCount === totalChildrenCount);
      isIndeterminate = !isChecked && selectedChildrenCount > 0;
    } else {
      isChecked = selectedFileIds.has(node.id);
    }

    return (
      <Box key={node.id} sx={{ flexDirection: 'column' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            py: 0.75,
            px: 1,
            pl: 1 + depth * 2.5,
            borderRadius: '8px',
            '&:hover': { bgcolor: cv.surfaceHover || 'rgba(255,255,255,0.04)' },
          }}
        >
          {node.isFolder && node.children.length > 0 ? (
            <IconButton
              size="small"
              onClick={() => toggleExpand(node.id)}
              sx={{ p: 0.25, mr: 0.5, color: cv.textSecondary }}
            >
              {isExpanded ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
            </IconButton>
          ) : (
            <Box sx={{ width: 24, mr: 0.5 }} />
          )}

          <Checkbox
            size="small"
            checked={isChecked}
            indeterminate={isIndeterminate}
            onChange={() => toggleNodeSelection(node)}
            sx={{ p: 0.5, mr: 1, color: cv.borderStrong }}
          />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
            {renderItemIcon(node.isFolder, node.type, isExpanded)}
            <Typography
              variant="body2"
              noWrap
              sx={{
                fontSize: '0.875rem',
                color: cv.textPrimary,
                fontWeight: node.isFolder ? 600 : 400,
              }}
            >
              {node.name}
            </Typography>
          </Box>
        </Box>

        {node.isFolder && node.children.length > 0 && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              {node.children.map((child) => renderTreeNode(child, depth + 1))}
            </Box>
          </Collapse>
        )}
      </Box>
    );
  };

  const totalSelectedCount = selectedFileIds.size + selectedFolderIds.size;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: cv.dialogSurface || '#2f3034',
          color: cv.textPrimary,
          backgroundImage: 'none',
          border: `1px solid ${cv.border || 'rgba(255, 255, 255, 0.08)'}`,
          borderRadius: '16px',
          boxShadow: cv.dialogShadow || '0 24px 48px rgba(0, 0, 0, 0.5)',
          p: 1,
        },
      }}
    >
      {/* STEP 1: Initial Confirmation Popup */}
      {step === 'confirm1' && (
        <Box sx={{ p: 2, position: 'relative' }}>
          <IconButton
            onClick={onClose}
            sx={{
              position: 'absolute',
              right: 12,
              top: 12,
              color: cv.textMuted || 'rgba(255, 255, 255, 0.4)',
              '&:hover': { color: cv.textPrimary || '#ffffff', bgcolor: 'rgba(255, 255, 255, 0.08)' },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>

          {/* Top Red Circular Icon Badge */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1, mb: 2 }}>
            <Box
              sx={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                bgcolor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.28)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(239, 68, 68, 0.18)',
              }}
            >
              <DeleteOutlineOutlinedIcon sx={{ fontSize: 30, color: cv.destructive || '#ef4444' }} />
            </Box>
          </Box>

          <Typography
            variant="h6"
            align="center"
            sx={{ fontWeight: 700, fontSize: '1.2rem', color: cv.textPrimary, mb: 1, px: 2 }}
          >
            Would you like to delete the entire project or select specific files and folders?
          </Typography>

          <Typography
            variant="body2"
            align="center"
            sx={{ color: cv.textSecondary, fontSize: '0.9rem', mb: 2.5 }}
          >
            Project: <strong style={{ color: cv.textPrimary }}>{projectName}</strong>
          </Typography>

          {/* Option Card Box */}
          <Box
            sx={{
              p: 2.5,
              borderRadius: '14px',
              bgcolor: 'rgba(168, 85, 247, 0.05)',
              border: `1px solid ${cv.border || 'rgba(168, 85, 247, 0.3)'}`,
              display: 'flex',
              gap: 1.5,
              mb: 3,
            }}
          >
            <Box
              sx={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                border: '1px solid rgba(168, 85, 247, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                mt: 0.25,
                color: cv.brandOrchid || '#a855f7',
              }}
            >
              <InfoOutlinedIcon sx={{ fontSize: 18 }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: cv.textPrimary, mb: 0.5 }}>
                You have two options:
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 2, fontSize: '0.8125rem', color: cv.textSecondary, lineHeight: 1.6 }}>
                <li>
                  <strong style={{ color: cv.textPrimary }}>Delete whole project</strong> – This will permanently delete the entire project along with all its files and folders.
                </li>
                <li>
                  <strong style={{ color: cv.textPrimary }}>Select files and folder</strong> – This will allow you to choose specific files and folders to delete.
                </li>
              </Box>
            </Box>
          </Box>

          {/* Action Buttons Row */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              onClick={onClose}
              sx={{
                borderRadius: '10px',
                bgcolor: 'rgba(255, 255, 255, 0.08)',
                color: cv.textPrimary || '#ffffff',
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                py: 1,
                boxShadow: 'none',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.15)', boxShadow: 'none' },
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={<DeleteOutlineOutlinedIcon fontSize="small" />}
              onClick={() => setStep('confirm_whole')}
              sx={{
                borderRadius: '10px',
                bgcolor: cv.destructive || '#ef4444',
                color: cv.textOnCta || '#ffffff',
                textTransform: 'none',
                fontWeight: 600,
                px: 2.5,
                py: 1,
                boxShadow: 'none',
                '&:hover': { bgcolor: cv.destructiveHover || '#dc2626', boxShadow: 'none' },
              }}
            >
              Delete whole project
            </Button>
            <Button
              variant="contained"
              startIcon={<FolderOutlinedIcon fontSize="small" />}
              onClick={() => setStep('select_tree')}
              sx={{
                borderRadius: '10px',
                bgcolor: cv.brandOrchid || '#a855f7',
                color: cv.textOnCta || '#ffffff',
                textTransform: 'none',
                fontWeight: 600,
                px: 2.5,
                py: 1,
                boxShadow: 'none',
                '&:hover': { bgcolor: cv.brandOrchidHover || '#9333ea', boxShadow: 'none' },
              }}
            >
              Select files and folder
            </Button>
          </Box>
        </Box>
      )}

      {/* STEP 2A (If Admin clicked "Yes"): Delete Whole Project Confirmation */}
      {step === 'confirm_whole' && (
        <>
          <DialogTitle sx={{ fontWeight: 600, fontSize: '1.125rem', pt: 2, pb: 1, display: 'flex', alignItems: 'center', gap: 1, color: cv.textPrimary }}>
            <WarningAmberOutlinedIcon sx={{ color: cv.destructive || '#ff6b6b' }} />
            Delete Whole Project?
          </DialogTitle>
          <DialogContent sx={{ py: 1 }}>
            <Typography variant="body2" sx={{ color: cv.textSecondary, lineHeight: 1.6 }}>
              This will move the entire project, including all files and folders, to the Super Admin Delete Management panel for review.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2, pt: 2, gap: 1 }}>
            <Button
              variant="outlined"
              onClick={onClose}
              disabled={submitting}
              sx={{
                borderRadius: '8px',
                borderColor: cv.borderStrong || 'rgba(255,255,255,0.15)',
                bgcolor: cv.surfaceMuted || 'rgba(255,255,255,0.06)',
                color: cv.textPrimary,
                textTransform: 'none',
                px: 2.5,
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              disabled={submitting}
              onClick={() => void handleWholeProjectSubmit()}
              sx={{
                borderRadius: '8px',
                bgcolor: cv.destructive || '#ff6b6b',
                color: cv.textOnCta || '#ffffff',
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                '&:hover': { bgcolor: cv.destructiveHover || '#fa5252' },
              }}
            >
              {submitting ? 'Submitting…' : 'Delete'}
            </Button>
          </DialogActions>
        </>
      )}

      {/* STEP 2B (If Admin clicked "No"): File/Folder Selection Popup */}
      {step === 'select_tree' && (
        <>
          <DialogTitle sx={{ fontWeight: 600, fontSize: '1.125rem', pt: 2, pb: 1, color: cv.textPrimary }}>
            Select Files and Folders to Delete
          </DialogTitle>
          <DialogContent sx={{ py: 1 }}>
            <Typography variant="body2" sx={{ color: cv.textSecondary, mb: 2 }}>
              Choose which files or folders inside <strong style={{ color: cv.textPrimary }}>{projectName}</strong> should be moved to Super Admin Delete Management panel for review.
            </Typography>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                <CircularProgress size={32} />
              </Box>
            ) : treeData.length === 0 ? (
              <Box
                sx={{
                  p: 3,
                  bgcolor: cv.surfaceRaised || 'rgba(255,255,255,0.03)',
                  borderRadius: '10px',
                  textAlign: 'center',
                }}
              >
                <Typography variant="body2" sx={{ color: cv.textMuted }}>
                  No files or folders found inside this project. You can still click &apos;Delete&apos; to send this project to Super Admin Delete Management panel for review.
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  border: `1px solid ${cv.borderStrong || 'rgba(255,255,255,0.12)'}`,
                  borderRadius: '12px',
                  overflow: 'hidden',
                  maxHeight: 340,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Project Header Row */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 1.25,
                    px: 1.5,
                    bgcolor: cv.surfaceRaised || 'rgba(255,255,255,0.04)',
                    borderBottom: `1px solid ${cv.borderStrong || 'rgba(255,255,255,0.12)'}`,
                  }}
                >
                  <Checkbox
                    size="small"
                    checked={isProjectRootChecked}
                    indeterminate={
                      totalSelectedCount > 0 &&
                      (selectedFileIds.size < files.length || selectedFolderIds.size < folders.length)
                    }
                    onChange={toggleProjectRootSelection}
                    sx={{ p: 0.5, mr: 1, color: cv.borderStrong }}
                  />
                  <WorkOutlineOutlinedIcon sx={{ fontSize: 20, color: PROJECT_ACCENT_COLOR, mr: 1 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: cv.textPrimary, flex: 1 }}>
                    {projectName}
                  </Typography>
                  <Typography variant="caption" sx={{ color: cv.textMuted }}>
                    {totalSelectedCount} item(s) selected
                  </Typography>
                </Box>

                {/* Tree Items List */}
                <Box sx={{ overflowY: 'auto', p: 1, flex: 1 }}>
                  {treeData.map((node) => renderTreeNode(node))}
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2, pt: 2, gap: 1, justifyContent: 'space-between' }}>
            <Typography variant="caption" sx={{ color: cv.textMuted }}>
              {totalSelectedCount === 0 ? 'No items selected' : `${totalSelectedCount} item(s) selected for review`}
            </Typography>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                onClick={onClose}
                disabled={submitting}
                sx={{
                  borderRadius: '8px',
                  borderColor: cv.borderStrong || 'rgba(255,255,255,0.15)',
                  bgcolor: cv.surfaceMuted || 'rgba(255,255,255,0.06)',
                  color: cv.textPrimary,
                  textTransform: 'none',
                  px: 2.5,
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                disabled={submitting || (treeData.length > 0 && totalSelectedCount === 0)}
                onClick={() => setStep('confirm_selected')}
                sx={{
                  borderRadius: '8px',
                  bgcolor: cv.destructive || '#ff6b6b',
                  color: cv.textOnCta || '#ffffff',
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                  '&:hover': { bgcolor: cv.destructiveHover || '#fa5252' },
                }}
              >
                Delete
              </Button>
            </Box>
          </DialogActions>
        </>
      )}

      {/* STEP 3: Warning Confirmation Popup for Selected Items Deletion */}
      {step === 'confirm_selected' && (
        <>
          <DialogTitle sx={{ fontWeight: 600, fontSize: '1.125rem', pt: 2, pb: 1, display: 'flex', alignItems: 'center', gap: 1, color: cv.textPrimary }}>
            <WarningAmberOutlinedIcon sx={{ color: cv.destructive || '#ff6b6b' }} />
            Are you sure you want to delete the selected items?
          </DialogTitle>
          <DialogContent sx={{ py: 1 }}>
            <Typography variant="body2" sx={{ color: cv.textSecondary, lineHeight: 1.6 }}>
              This will move the selected files and folders inside <strong style={{ color: cv.textPrimary }}>{projectName}</strong> to the Super Admin Delete Management panel for review.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2, pt: 2, gap: 1 }}>
            <Button
              variant="outlined"
              onClick={() => setStep('select_tree')}
              disabled={submitting}
              sx={{
                borderRadius: '8px',
                borderColor: cv.borderStrong || 'rgba(255,255,255,0.15)',
                bgcolor: cv.surfaceMuted || 'rgba(255,255,255,0.06)',
                color: cv.textPrimary,
                textTransform: 'none',
                px: 2.5,
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              disabled={submitting}
              onClick={() => void handleSelectedSubmit()}
              sx={{
                borderRadius: '8px',
                bgcolor: cv.destructive || '#ff6b6b',
                color: cv.textOnCta || '#ffffff',
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                '&:hover': { bgcolor: cv.destructiveHover || '#fa5252' },
              }}
            >
              {submitting ? 'Submitting…' : 'Delete'}
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
