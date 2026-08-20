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
import DeleteForeverOutlinedIcon from '@mui/icons-material/DeleteForeverOutlined';
import { cv } from '../../theme/cssVars';
import { apiClient } from '../../api/client';

export interface SuperAdminFolderDeleteFlowModalProps {
  open: boolean;
  folderId: string | null;
  folderName?: string;
  onClose: () => void;
  onConfirmPermanentDelete: (
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

type SuperAdminDeleteStep = 'choice' | 'confirm_entire' | 'select_tree' | 'confirm_selected';

export default function SuperAdminFolderDeleteFlowModal({
  open,
  folderId,
  folderName = 'Folder',
  onClose,
  onConfirmPermanentDelete,
}: SuperAdminFolderDeleteFlowModalProps) {
  const [step, setStep] = useState<SuperAdminDeleteStep>('select_tree');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);

  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  const [selectedFolderIds, setSelectedFolderIds] = useState<Set<string>>(new Set());
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(new Set());

  // Load folder tree when modal opens
  useEffect(() => {
    if (!open || !folderId) {
      setStep('select_tree');
      setLoading(false);
      setSubmitting(false);
      setFiles([]);
      setFolders([]);
      setSelectedFileIds(new Set());
      setSelectedFolderIds(new Set());
      setExpandedFolderIds(new Set());
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

        setSelectedFileIds(new Set(formattedFiles.map((f) => f.id)));
        setSelectedFolderIds(new Set([folderId, ...formattedFolders.map((f) => f.id)]));
        setExpandedFolderIds(new Set([folderId]));
      } catch (err) {
        console.error('Error fetching folder tree for Super Admin:', err);
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

  // Construct tree hierarchy
  const rootNode = useMemo<TreeNode | null>(() => {
    if (!folderId) return null;

    const folderMap = new Map<string, TreeNode>();
    const dateFolderParentMap = new Map<string, string>();

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
      } else {
        nextAssets.clear();
        nextFolders.clear();
      }
      setSelectedFileIds(nextAssets);
      setSelectedFolderIds(nextFolders);
      return;
    }

    if (!node.isFolder) {
      const nextAssets = new Set(selectedFileIds);
      if (nextAssets.has(node.id)) nextAssets.delete(node.id);
      else nextAssets.add(node.id);
      setSelectedFileIds(nextAssets);
    } else {
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
    return getFolderSelectionStatus(rootNode) === 'all';
  }, [rootNode, selectedFileIds, selectedFolderIds]);

  const handleExecutePermanentDelete = async (isWhole: boolean) => {
    if (!folderId) return;
    setSubmitting(true);
    try {
      await onConfirmPermanentDelete(
        folderId,
        isWhole,
        Array.from(selectedFileIds),
        Array.from(selectedFolderIds)
      );
      onClose();
    } catch (err) {
      console.error('Error executing permanent folder delete:', err);
    } finally {
      setSubmitting(false);
    }
  };

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
              '&.Mui-checked': { color: cv.destructive },
              '&.MuiCheckbox-indeterminate': { color: cv.destructive },
              '&.Mui-disabled': { color: cv.destructive, opacity: 0.85 },
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
      {/* Choice Step */}
      {step === 'choice' && (
        <>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
              <DeleteForeverOutlinedIcon sx={{ color: cv.destructive, fontSize: 26 }} />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Permanently delete folder "{folderName}"?
              </Typography>
            </Box>
            <IconButton onClick={onClose} size="small" sx={{ color: cv.textMuted }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Typography sx={{ color: cv.textSecondary, fontSize: '0.9rem', mb: 3 }}>
              Super Admin Action: Choose how you want to permanently purge this folder and its files from the database and B2 storage.
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box
                onClick={() => setStep('confirm_entire')}
                sx={{
                  p: 2.25,
                  borderRadius: '12px',
                  border: `1px solid ${cv.border}`,
                  backgroundColor: cv.surface,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    borderColor: cv.destructive,
                    backgroundColor: cv.surfaceHover,
                  },
                }}
              >
                <Typography sx={{ fontWeight: 600, fontSize: '0.975rem', mb: 0.5, color: cv.textPrimary }}>
                  Delete whole folder permanently
                </Typography>
                <Typography sx={{ fontSize: '0.8125rem', color: cv.textMuted }}>
                  Permanently remove the entire folder and all its nested files/subfolders from Database & Cloud Storage.
                </Typography>
              </Box>

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
                    borderColor: cv.destructive,
                    backgroundColor: cv.surfaceHover,
                  },
                }}
              >
                <Typography sx={{ fontWeight: 600, fontSize: '0.975rem', mb: 0.5, color: cv.textPrimary }}>
                  Choose inner files and folders
                </Typography>
                <Typography sx={{ fontSize: '0.8125rem', color: cv.textMuted }}>
                  Select specific files or subfolders inside to permanently delete.
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

      {/* Confirm Entire Folder Permanent Delete */}
      {step === 'confirm_entire' && (
        <>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: cv.destructive }}>
              Confirm Permanent Whole Folder Delete
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
                border: `1px solid ${cv.destructiveBorder}`,
                backgroundColor: cv.destructiveSurface,
                display: 'flex',
                gap: 1.5,
                mb: 2.5,
              }}
            >
              <WarningAmberOutlinedIcon sx={{ color: cv.destructive, mt: 0.25, flexShrink: 0 }} />
              <Typography sx={{ fontSize: '0.875rem', color: cv.textPrimary, lineHeight: 1.5 }}>
                WARNING: This will <strong>permanently purge</strong> the folder <strong>"{folderName}"</strong> and all its files from Database and Cloud Storage. This action cannot be undone.
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
            <Button onClick={() => setStep('choice')} variant="outlined" sx={{ color: cv.textSecondary, borderColor: cv.border }}>
              Back
            </Button>
            <Button
              onClick={() => handleExecutePermanentDelete(true)}
              variant="contained"
              disabled={submitting}
              sx={{
                backgroundColor: cv.destructive,
                '&:hover': { backgroundColor: cv.destructiveHover },
              }}
            >
              {submitting ? 'Deleting...' : 'Permanently Delete Whole Folder'}
            </Button>
          </DialogActions>
        </>
      )}

      {/* Select Tree Step */}
      {step === 'select_tree' && (
        <>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Select items to permanently delete in "{folderName}"
            </Typography>
            <IconButton onClick={onClose} size="small" sx={{ color: cv.textMuted }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress size={32} sx={{ color: cv.destructive }} />
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
            <Button onClick={() => setStep('choice')} variant="outlined" sx={{ color: cv.textSecondary, borderColor: cv.border }}>
              Back
            </Button>
            <Button
              onClick={() => setStep('confirm_selected')}
              variant="contained"
              disabled={loading || (selectedFileIds.size === 0 && selectedFolderIds.size === 0)}
              sx={{
                backgroundColor: cv.destructive,
                '&:hover': { backgroundColor: cv.destructiveHover },
              }}
            >
              Continue
            </Button>
          </DialogActions>
        </>
      )}

      {/* Confirm Selected Permanent Delete */}
      {step === 'confirm_selected' && (
        <>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: cv.destructive }}>
              Confirm Selected Permanent Deletion
            </Typography>
            <IconButton onClick={onClose} size="small" sx={{ color: cv.textMuted }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Typography sx={{ fontSize: '0.9rem', color: cv.textSecondary, mb: 2 }}>
              You are about to permanently delete {selectedFileIds.size} file(s) and {selectedFolderIds.size} folder(s).
            </Typography>
            <Box
              sx={{
                p: 2,
                borderRadius: '12px',
                border: `1px solid ${cv.destructiveBorder}`,
                backgroundColor: cv.destructiveSurface,
                mb: 2,
              }}
            >
              <Typography sx={{ fontSize: '0.8125rem', color: cv.textPrimary }}>
                {isWholeFolderSelected
                  ? 'All items in this folder are selected. This will permanently delete the entire folder.'
                  : 'Selected items will be permanently purged from Database and Cloud Storage.'}
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
            <Button onClick={() => setStep('select_tree')} variant="outlined" sx={{ color: cv.textSecondary, borderColor: cv.border }}>
              Back
            </Button>
            <Button
              onClick={() => handleExecutePermanentDelete(isWholeFolderSelected)}
              variant="contained"
              disabled={submitting}
              sx={{
                backgroundColor: cv.destructive,
                '&:hover': { backgroundColor: cv.destructiveHover },
              }}
            >
              {submitting ? 'Deleting...' : 'Permanently Delete Selected'}
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
