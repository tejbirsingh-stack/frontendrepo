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
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import VideocamOutlinedIcon from '@mui/icons-material/VideocamOutlined';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import AudioFileOutlinedIcon from '@mui/icons-material/AudioFileOutlined';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { cv } from '../../theme/cssVars';
import { apiClient } from '../../api/client';

export interface FolderDeleteFlowModalProps {
  open: boolean;
  folderId: string | null;
  folderName?: string;
  onClose: () => void;
  onConfirmDelete: (
    folderId: string,
    isWholeFolder: boolean,
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

export default function FolderDeleteFlowModal({
  open,
  folderId,
  folderName = 'Folder',
  onClose,
  onConfirmDelete,
}: FolderDeleteFlowModalProps) {
  // Modal step: directly open 'select_tree' with items pre-selected
  const [step, setStep] = useState<'confirm1' | 'confirm_whole' | 'select_tree' | 'confirm_selected'>('select_tree');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);

  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  const [selectedFolderIds, setSelectedFolderIds] = useState<Set<string>>(new Set());
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(new Set());
  const [isRootChecked, setIsRootChecked] = useState(true);

  // Load folder tree data when modal opens
  useEffect(() => {
    if (!open || !folderId) {
      setStep('select_tree');
      setFiles([]);
      setFolders([]);
      setSelectedFileIds(new Set());
      setSelectedFolderIds(new Set());
      setExpandedFolderIds(new Set());
      setIsRootChecked(true);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setStep('select_tree');
    setLoading(true);

    const fetchFolderTree = async () => {
      try {
        const res = await apiClient.get<any>(`/workspaces/folder/find-all-tree/${folderId}`);
        if (!isMounted) return;

        const payload = (res && (Array.isArray(res.folders) || Array.isArray(res.media)))
          ? res
          : (res?.data?.data || res?.data || res);

        const mediaList: any[] = Array.isArray(payload?.media) ? payload.media : [];
        const folderList: any[] = Array.isArray(payload?.folders) ? payload.folders : [];

        const formattedFiles: FileItem[] = mediaList.map((m) => {
          let parentFolderId = m.folderId || (m.ownerType === 'FOLDER' ? m.ownerId : undefined);
          if (!parentFolderId && m.deletionReason) {
            const fMatch = m.deletionReason.match(/Deleted with folder:\s*\[([0-9a-fA-F-]+)\]/i);
            if (fMatch) parentFolderId = fMatch[1];
          }
          return {
            id: m.id,
            title: m.title || m.name || 'Untitled File',
            type: m.type || 'file',
            ownerType: m.ownerType,
            ownerId: m.ownerId,
            folderId: parentFolderId || folderId,
          };
        });

        const formattedFolders: FolderItem[] = folderList.map((f) => ({
          id: f.id,
          name: f.name || 'Untitled Folder',
          parentId: f.parentId || null,
        }));

        setFiles(formattedFiles);
        setFolders(formattedFolders);

        // Pre-select all assets and folders (including root folder) by default
        const allFIdSet = new Set(formattedFiles.map((f) => f.id));
        const allSubFolderIdSet = new Set([folderId, ...formattedFolders.map((f) => f.id)]);
        setSelectedFileIds(allFIdSet);
        setSelectedFolderIds(allSubFolderIdSet);
        setIsRootChecked(true);
        setExpandedFolderIds(new Set([folderId]));
      } catch (err) {
        console.error('Error loading folder tree:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void fetchFolderTree();

    return () => {
      isMounted = false;
    };
  }, [open, folderId]);

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

  // Construct tree structure
  const rootNode = useMemo<TreeNode | null>(() => {
    if (!folderId) return null;

    const folderMap = new Map<string, TreeNode>();
    const dateFolderParentMap = new Map<string, string>();

    // Add root node
    const root: TreeNode = {
      id: folderId,
      name: folderName,
      isFolder: true,
      children: [],
      parentId: null,
      allDescendantAssetIds: [],
      allDescendantFolderIds: [],
    };
    folderMap.set(folderId, root);

    // Add subfolder nodes, mapping date containers
    folders.forEach((f) => {
      if (f.id === folderId) return;
      if (isWorkspaceDateContainer(f.name)) {
        dateFolderParentMap.set(f.id, f.parentId || folderId);
      } else {
        folderMap.set(f.id, {
          id: f.id,
          name: f.name,
          isFolder: true,
          children: [],
          parentId: f.parentId || folderId,
          allDescendantAssetIds: [],
          allDescendantFolderIds: [],
        });
      }
    });

    const resolveEffectiveParentId = (pId?: string | null): string => {
      let curr = pId || folderId;
      while (curr && dateFolderParentMap.has(curr)) {
        curr = dateFolderParentMap.get(curr)!;
      }
      return folderMap.has(curr) ? curr : folderId;
    };

    // Link subfolders to parents
    folderMap.forEach((node) => {
      if (node.id !== folderId) {
        const effectiveParentId = resolveEffectiveParentId(node.parentId);
        if (folderMap.has(effectiveParentId) && effectiveParentId !== node.id) {
          folderMap.get(effectiveParentId)!.children.push(node);
        } else if (effectiveParentId !== node.id) {
          root.children.push(node);
        }
      }
    });

    // Add file nodes
    files.forEach((file) => {
      const rawParentId = file.folderId || file.ownerId || folderId;
      const effectiveParentId = resolveEffectiveParentId(rawParentId);

      const fileNode: TreeNode = {
        id: file.id,
        name: file.title,
        isFolder: false,
        type: file.type,
        children: [],
        parentId: effectiveParentId,
        allDescendantAssetIds: [file.id],
        allDescendantFolderIds: [],
      };

      if (folderMap.has(effectiveParentId)) {
        folderMap.get(effectiveParentId)!.children.push(fileNode);
      } else {
        root.children.push(fileNode);
      }
    });

    // Helper to gather all descendant asset and folder IDs recursively
    const computeDescendants = (node: TreeNode): { assetIds: string[]; folderIds: string[] } => {
      let aIds: string[] = [];
      let fIds: string[] = node.isFolder ? [node.id] : [];

      node.children.forEach((child) => {
        if (!child.isFolder) {
          aIds.push(child.id);
        } else {
          const res = computeDescendants(child);
          aIds = aIds.concat(res.assetIds);
          fIds = fIds.concat(res.folderIds);
        }
      });

      node.allDescendantAssetIds = aIds;
      node.allDescendantFolderIds = fIds;
      return { assetIds: aIds, folderIds: fIds };
    };

    computeDescendants(root);
    return root;
  }, [folderId, folderName, folders, files]);

  // Checkbox state helpers
  const getFolderSelectionStatus = (node: TreeNode): 'all' | 'some' | 'none' => {
    if (!node.isFolder) return 'none';

    const descendantSubFolderIds = node.allDescendantFolderIds.filter((id) => id !== node.id);
    const descendantAssetIds = node.allDescendantAssetIds;

    const totalAssets = descendantAssetIds.length;
    const totalFolders = descendantSubFolderIds.length;

    if (totalAssets === 0 && totalFolders === 0) {
      return selectedFolderIds.has(node.id) ? 'all' : 'none';
    }

    let selectedAssetsCount = 0;
    descendantAssetIds.forEach((id) => {
      if (selectedFileIds.has(id)) selectedAssetsCount++;
    });

    let selectedFoldersCount = 0;
    descendantSubFolderIds.forEach((id) => {
      if (selectedFolderIds.has(id)) selectedFoldersCount++;
    });

    const totalItems = totalAssets + totalFolders;
    const selectedItems = selectedAssetsCount + selectedFoldersCount;
    const isThisFolderSelected = selectedFolderIds.has(node.id);

    if (selectedItems === 0 && !isThisFolderSelected) return 'none';
    if (selectedItems === totalItems && isThisFolderSelected) return 'all';
    return 'some';
  };

  const handleToggleNode = (node: TreeNode) => {
    const isRoot = node.id === folderId;

    if (isRoot) {
      const currentStatus = getFolderSelectionStatus(node);
      const shouldSelect = currentStatus !== 'all';

      const nextAssets = new Set(selectedFileIds);
      const nextFolders = new Set(selectedFolderIds);

      if (shouldSelect) {
        files.forEach((f) => nextAssets.add(f.id));
        folders.forEach((f) => nextFolders.add(f.id));
        nextFolders.add(folderId);
        setIsRootChecked(true);
      } else {
        nextAssets.clear();
        nextFolders.clear();
        setIsRootChecked(false);
      }
      setSelectedFileIds(nextAssets);
      setSelectedFolderIds(nextFolders);
      return;
    }

    if (!node.isFolder) {
      // Toggle file
      const nextAssets = new Set(selectedFileIds);
      if (nextAssets.has(node.id)) nextAssets.delete(node.id);
      else nextAssets.add(node.id);
      setSelectedFileIds(nextAssets);
    } else {
      // Toggle folder and all descendants
      const currentStatus = getFolderSelectionStatus(node);
      const shouldSelect = currentStatus !== 'all';

      const nextAssets = new Set(selectedFileIds);
      const nextFolders = new Set(selectedFolderIds);

      if (shouldSelect) {
        nextFolders.add(node.id);
      } else {
        nextFolders.delete(node.id);
      }

      node.allDescendantAssetIds.forEach((id) => {
        if (shouldSelect) nextAssets.add(id);
        else nextAssets.delete(id);
      });

      node.allDescendantFolderIds.forEach((id) => {
        if (shouldSelect) nextFolders.add(id);
        else nextFolders.delete(id);
      });

      setSelectedFileIds(nextAssets);
      setSelectedFolderIds(nextFolders);
    }
  };

  const toggleExpand = (id: string) => {
    const next = new Set(expandedFolderIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedFolderIds(next);
  };

  const isWholeFolderSelected = useMemo(() => {
    if (!rootNode) return false;
    const status = getFolderSelectionStatus(rootNode);
    return status === 'all';
  }, [rootNode, selectedFileIds, selectedFolderIds]);

  const handleExecuteDelete = async (isWhole: boolean) => {
    if (!folderId) return;
    setSubmitting(true);
    try {
      await onConfirmDelete(
        folderId,
        isWhole,
        Array.from(selectedFileIds),
        Array.from(selectedFolderIds)
      );
      onClose();
    } catch (err) {
      console.error('Error deleting folder:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Render tree node recursively
  const renderTreeNode = (node: TreeNode, depth = 0) => {
    const isRoot = node.id === folderId;
    const isExpanded = expandedFolderIds.has(node.id);
    const selectionStatus = node.isFolder ? getFolderSelectionStatus(node) : 'none';
    const isChecked = isRoot ? true : (node.isFolder ? selectionStatus === 'all' : selectedFileIds.has(node.id));
    const isIndeterminate = isRoot ? false : (node.isFolder && selectionStatus === 'some');

    const getIcon = () => {
      if (node.isFolder) {
        return isExpanded ? (
          <FolderOpenOutlinedIcon sx={{ fontSize: 20, color: cv.brandOrchid }} />
        ) : (
          <FolderOutlinedIcon sx={{ fontSize: 20, color: cv.brandOrchid }} />
        );
      }
      const type = (node.type || '').toLowerCase();
      if (type.includes('video')) return <VideocamOutlinedIcon sx={{ fontSize: 18, color: cv.textMuted }} />;
      if (type.includes('image')) return <ImageOutlinedIcon sx={{ fontSize: 18, color: cv.textMuted }} />;
      if (type.includes('audio')) return <AudioFileOutlinedIcon sx={{ fontSize: 18, color: cv.textMuted }} />;
      return <InsertDriveFileOutlinedIcon sx={{ fontSize: 18, color: cv.textMuted }} />;
    };

    return (
      <Box key={node.id} sx={{ pl: depth * 2.5 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            py: 0.75,
            px: 1,
            borderRadius: '8px',
            '&:hover': { backgroundColor: cv.surfaceHover },
          }}
        >
          {node.isFolder && node.children.length > 0 ? (
            <IconButton
              size="small"
              onClick={() => toggleExpand(node.id)}
              sx={{ p: 0.5, mr: 0.5, color: cv.textMuted }}
            >
              {isExpanded ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
            </IconButton>
          ) : (
            <Box sx={{ width: 28 }} />
          )}

          <Checkbox
            size="small"
            checked={isChecked}
            indeterminate={isIndeterminate}
            disabled={isRoot}
            onChange={() => !isRoot && handleToggleNode(node)}
            sx={{
              p: 0.5,
              mr: 1,
              color: cv.borderFocus,
              '&.Mui-checked': { color: cv.brandOrchid },
              '&.MuiCheckbox-indeterminate': { color: cv.brandOrchid },
              '&.Mui-disabled': { color: cv.brandOrchid, opacity: 0.85 },
            }}
          />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flex: 1 }}>
            {getIcon()}
            <Typography
              noWrap
              sx={{
                fontSize: '0.875rem',
                fontWeight: node.isFolder ? 600 : 400,
                color: cv.textPrimary,
              }}
            >
              {node.name}
            </Typography>
          </Box>
        </Box>

        {node.isFolder && node.children.length > 0 && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <Box sx={{ borderLeft: `1px dashed ${cv.border}`, ml: 2, pl: 0.5 }}>
              {node.children.map((child) => renderTreeNode(child, depth + 1))}
            </Box>
          </Collapse>
        )}
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: '16px',
            background: cv.bg,
            color: cv.textPrimary,
            border: `1px solid ${cv.border}`,
            backgroundImage: 'none',
          },
        },
      }}
    >
      {/* Step 1: Choice Dialog */}
      {step === 'confirm1' && (
        <>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
              <DeleteOutlineOutlinedIcon sx={{ color: cv.destructive, fontSize: 24 }} />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Delete folder "{folderName}"?
              </Typography>
            </Box>
            <IconButton onClick={onClose} size="small" sx={{ color: cv.textMuted }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Typography sx={{ color: cv.textSecondary, fontSize: '0.9rem', mb: 3 }}>
              Select how you would like to delete this folder and its contents.
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Option A: Delete Whole Folder */}
              <Box
                onClick={() => setStep('confirm_whole')}
                sx={{
                  p: 2.25,
                  borderRadius: '12px',
                  border: `1px solid ${cv.border}`,
                  backgroundColor: cv.surface,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    borderColor: cv.brandOrchid,
                    backgroundColor: cv.surfaceHover,
                  },
                }}
              >
                <Typography sx={{ fontWeight: 600, fontSize: '0.975rem', mb: 0.5, color: cv.textPrimary }}>
                  Delete whole folder
                </Typography>
                <Typography sx={{ fontSize: '0.8125rem', color: cv.textMuted }}>
                  Request deletion for the entire folder and all nested files and subfolders inside it.
                </Typography>
              </Box>

              {/* Option B: Choose Inner Files & Folders */}
              <Box
                onClick={() => setStep('select_tree')}
                sx={{
                  p: 2.25,
                  borderRadius: '12px',
                  border: `1px solid ${cv.border}`,
                  backgroundColor: cv.surface,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    borderColor: cv.brandOrchid,
                    backgroundColor: cv.surfaceHover,
                  },
                }}
              >
                <Typography sx={{ fontWeight: 600, fontSize: '0.975rem', mb: 0.5, color: cv.textPrimary }}>
                  Choose inner files and folders
                </Typography>
                <Typography sx={{ fontSize: '0.8125rem', color: cv.textMuted }}>
                  Select specific files or subfolders inside this folder to delete.
                </Typography>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={onClose} variant="outlined" sx={{ color: cv.textSecondary, borderColor: cv.border }}>
              Cancel
            </Button>
          </DialogActions>
        </>
      )}

      {/* Step 2: Confirm Entire Folder Deletion */}
      {step === 'confirm_whole' && (
        <>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Confirm Whole Folder Deletion
            </Typography>
            <IconButton onClick={onClose} size="small" sx={{ color: cv.textMuted }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Box
              sx={{
                p: 2,
                borderRadius: '12px',
                border: `1px solid ${cv.warningBorderSoft}`,
                backgroundColor: cv.warningSurface,
                display: 'flex',
                gap: 1.5,
                mb: 2.5,
              }}
            >
              <WarningAmberOutlinedIcon sx={{ color: cv.warning, mt: 0.25, flexShrink: 0 }} />
              <Typography sx={{ fontSize: '0.875rem', color: cv.textPrimary, lineHeight: 1.5 }}>
                You are requesting deletion of the entire folder <strong>"{folderName}"</strong>. Super Admin will review this request in Delete Management.
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
            <Button onClick={() => setStep('confirm1')} variant="outlined" sx={{ color: cv.textSecondary, borderColor: cv.border }}>
              Back
            </Button>
            <Button
              onClick={() => handleExecuteDelete(true)}
              variant="contained"
              disabled={submitting}
              sx={{
                backgroundColor: cv.destructive,
                '&:hover': { backgroundColor: cv.destructiveHover },
              }}
            >
              {submitting ? 'Submitting...' : 'Submit Deletion Request'}
            </Button>
          </DialogActions>
        </>
      )}

      {/* Step 3: Interactive Tree Selection */}
      {step === 'select_tree' && (
        <>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Select items to delete in "{folderName}"
            </Typography>
            <IconButton onClick={onClose} size="small" sx={{ color: cv.textMuted }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress size={32} sx={{ color: cv.brandOrchid }} />
              </Box>
            ) : rootNode ? (
              <Box
                sx={{
                  maxHeight: 360,
                  overflowY: 'auto',
                  border: `1px solid ${cv.border}`,
                  borderRadius: '12px',
                  p: 1.5,
                  backgroundColor: cv.surface,
                }}
              >
                {renderTreeNode(rootNode)}
              </Box>
            ) : (
              <Typography sx={{ color: cv.textMuted, py: 4, textAlign: 'center' }}>
                No items found inside this folder.
              </Typography>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
            <Button onClick={() => setStep('confirm1')} variant="outlined" sx={{ color: cv.textSecondary, borderColor: cv.border }}>
              Back
            </Button>
            <Button
              onClick={() => setStep('confirm_selected')}
              variant="contained"
              disabled={loading || (selectedFileIds.size === 0 && selectedFolderIds.size === 0)}
              sx={{
                backgroundColor: cv.brandOrchid,
                '&:hover': { backgroundColor: cv.brandPurple },
              }}
            >
              Continue
            </Button>
          </DialogActions>
        </>
      )}

      {/* Step 4: Confirm Selected Items Deletion */}
      {step === 'confirm_selected' && (
        <>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Confirm Selected Items Deletion
            </Typography>
            <IconButton onClick={onClose} size="small" sx={{ color: cv.textMuted }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Typography sx={{ fontSize: '0.9rem', color: cv.textSecondary, mb: 2 }}>
              You have selected {selectedFileIds.size} file(s) and {selectedFolderIds.size} folder(s) for deletion.
            </Typography>
            <Box
              sx={{
                p: 2,
                borderRadius: '12px',
                border: `1px solid ${cv.border}`,
                backgroundColor: cv.surface,
                mb: 2,
              }}
            >
              <Typography sx={{ fontSize: '0.8125rem', color: cv.textMuted }}>
                {isWholeFolderSelected
                  ? 'All items inside this folder are selected. This will request whole folder deletion.'
                  : 'Selected items will be submitted for Super Admin review in Delete Management.'}
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
            <Button onClick={() => setStep('select_tree')} variant="outlined" sx={{ color: cv.textSecondary, borderColor: cv.border }}>
              Back
            </Button>
            <Button
              onClick={() => handleExecuteDelete(isWholeFolderSelected)}
              variant="contained"
              disabled={submitting}
              sx={{
                backgroundColor: cv.destructive,
                '&:hover': { backgroundColor: cv.destructiveHover },
              }}
            >
              {submitting ? 'Submitting...' : 'Submit Deletion Request'}
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
