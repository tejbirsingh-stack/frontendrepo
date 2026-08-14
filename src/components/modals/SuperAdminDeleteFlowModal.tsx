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
import DeleteForeverOutlinedIcon from '@mui/icons-material/DeleteForeverOutlined';
import { cv } from '../../theme/cssVars';
import { PROJECT_ACCENT_COLOR } from '../../utils/folderColorStyle';
import { apiClient } from '../../api/client';

export interface SuperAdminDeleteFlowModalProps {
  open: boolean;
  projectId: string | null;
  projectName?: string;
  onClose: () => void;
  onConfirmPermanentDelete: (
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

type SuperAdminDeleteStep = 'choice' | 'confirm_entire' | 'select_tree' | 'confirm_selected';

export default function SuperAdminDeleteFlowModal({
  open,
  projectId,
  projectName = 'Project',
  onClose,
  onConfirmPermanentDelete,
}: SuperAdminDeleteFlowModalProps) {
  const [step, setStep] = useState<SuperAdminDeleteStep>('choice');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);

  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  const [selectedFolderIds, setSelectedFolderIds] = useState<Set<string>>(new Set());
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(new Set());

  // Reset modal state when opening
  useEffect(() => {
    if (open) {
      setStep('choice');
      setLoading(false);
      setSubmitting(false);
      setFiles([]);
      setFolders([]);
      setSelectedFileIds(new Set());
      setSelectedFolderIds(new Set());
      setExpandedFolderIds(new Set());
    }
  }, [open]);

  // Load project tree when entering step 'select_tree'
  useEffect(() => {
    if (step !== 'select_tree' || !projectId) return;

    const fetchProjectTree = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get<any>(`/workspaces/project/find-all-data/${projectId}`, {
          params: { isDeleteFlow: 'true' },
        });
        const resBody = (res as any).data || res;
        const actualData = resBody.data || resBody;

        const rawFoldersUnfiltered: FolderItem[] = Array.isArray(actualData?.folders) ? actualData.folders : [];
        const rawFolders = rawFoldersUnfiltered.filter((f) => !isWorkspaceDateContainer(f.name));
        const rawMedia: FileItem[] = (Array.isArray(actualData?.media) ? actualData.media : [])
          .filter((a: any) => a.type !== 'folder');

        // Exclude root workspace date containers
        const validFolderIds = new Set(rawFolders.map((f) => f.id));

        const formattedFolders: FolderItem[] = rawFolders.map((f) => ({
          id: f.id,
          name: f.name || 'Untitled folder',
          parentId: f.parentId && validFolderIds.has(f.parentId) ? f.parentId : null,
        }));

        const formattedFiles: FileItem[] = rawMedia.map((a) => {
          const directParentId = a.folderId || (a.ownerType === 'FOLDER' ? a.ownerId : null);
          return {
            id: a.id,
            title: a.title || 'Untitled file',
            type: a.type || 'file',
            folderId: directParentId && validFolderIds.has(directParentId) ? directParentId : undefined,
          };
        });

        setFolders(formattedFolders);
        setFiles(formattedFiles);

        // Select all items by default
        const allFileSet = new Set(formattedFiles.map((f) => f.id));
        const allFolderSet = new Set(formattedFolders.map((f) => f.id));

        setSelectedFileIds(allFileSet);
        setSelectedFolderIds(allFolderSet);

        // Keep folders collapsed by default
        setExpandedFolderIds(new Set());
      } catch (err) {
        console.error('Failed to load project tree for Super Admin delete:', err);
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
        parentId: f.parentId || null,
        allDescendantAssetIds: [],
        allDescendantFolderIds: [f.id],
      });
    });

    const rootNodes: TreeNode[] = [];

    folders.forEach((f) => {
      const node = folderMap.get(f.id)!;
      if (f.parentId && folderMap.has(f.parentId)) {
        folderMap.get(f.parentId)!.children.push(node);
      } else {
        rootNodes.push(node);
      }
    });

    files.forEach((file) => {
      const fileNode: TreeNode = {
        id: file.id,
        name: file.title,
        isFolder: false,
        type: file.type,
        children: [],
        parentId: file.folderId || null,
        allDescendantAssetIds: [file.id],
        allDescendantFolderIds: [],
      };

      if (file.folderId && folderMap.has(file.folderId)) {
        folderMap.get(file.folderId)!.children.push(fileNode);
      } else {
        rootNodes.push(fileNode);
      }
    });

    // Recursively populate descendant IDs for folder nodes
    const calculateDescendants = (node: TreeNode): { assets: string[]; folders: string[] } => {
      let descendantAssets = node.isFolder ? [] : [node.id];
      let descendantFolders = node.isFolder ? [node.id] : [];

      node.children.forEach((child) => {
        const childDesc = calculateDescendants(child);
        descendantAssets = [...descendantAssets, ...childDesc.assets];
        descendantFolders = [...descendantFolders, ...childDesc.folders];
      });

      node.allDescendantAssetIds = Array.from(new Set(descendantAssets));
      node.allDescendantFolderIds = Array.from(new Set(descendantFolders));

      return { assets: node.allDescendantAssetIds, folders: node.allDescendantFolderIds };
    };

    rootNodes.forEach((r) => calculateDescendants(r));

    return rootNodes;
  }, [files, folders]);

  // Toggle folder expansion
  const toggleFolderExpand = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolderIds((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  // Toggle node selection
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
  };

  // Handle Scenario 1 Submit (Delete Entire Project)
  const handleConfirmEntireSubmit = async () => {
    if (!projectId) return;
    setSubmitting(true);
    try {
      await onConfirmPermanentDelete(projectId, true, [], []);
      onClose();
    } catch (err) {
      console.error('Delete entire project failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Scenario 2 Final Submit (Delete Selected Project/Files)
  const handleConfirmSelectedSubmit = async () => {
    if (!projectId) return;
    setSubmitting(true);
    try {
      const isWhole = treeData.length === 0;
      await onConfirmPermanentDelete(
        projectId,
        isWhole,
        Array.from(selectedFileIds),
        Array.from(selectedFolderIds),
      );
      onClose();
    } catch (err) {
      console.error('Delete selected items failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const totalSelectedCount = selectedFileIds.size + selectedFolderIds.size;

  const renderFileIcon = (type?: string) => {
    if (type === 'video') return <VideocamOutlinedIcon sx={{ fontSize: 18, color: '#38bdf8' }} />;
    if (type === 'image') return <ImageOutlinedIcon sx={{ fontSize: 18, color: '#4ade80' }} />;
    if (type === 'audio') return <AudioFileOutlinedIcon sx={{ fontSize: 18, color: '#c084fc' }} />;
    return <InsertDriveFileOutlinedIcon sx={{ fontSize: 18, color: cv.textMuted }} />;
  };

  const renderTreeNode = (node: TreeNode, depth = 0) => {
    const isFolder = node.isFolder;
    const isExpanded = expandedFolderIds.has(node.id);

    let isChecked = false;
    let isIndeterminate = false;

    if (isFolder) {
      const selectedAssetsCount = node.allDescendantAssetIds.filter((id) => selectedFileIds.has(id)).length;
      const selectedFoldersCount = node.allDescendantFolderIds.filter((id) => selectedFolderIds.has(id)).length;

      const totalDescendants = node.allDescendantAssetIds.length + node.allDescendantFolderIds.length;
      const totalSelected = selectedAssetsCount + selectedFoldersCount;

      isChecked = selectedFolderIds.has(node.id) || (totalDescendants > 0 && totalSelected === totalDescendants);
      isIndeterminate = totalSelected > 0 && totalSelected < totalDescendants;
    } else {
      isChecked = selectedFileIds.has(node.id);
    }

    return (
      <Box key={node.id} sx={{ pl: depth * 2 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            py: 0.75,
            px: 1,
            borderRadius: '6px',
            '&:hover': { bgcolor: cv.surfaceHover || 'rgba(255,255,255,0.04)' },
          }}
        >
          {isFolder ? (
            <IconButton size="small" onClick={(e) => toggleFolderExpand(node.id, e)} sx={{ p: 0.25, mr: 0.5, color: cv.textMuted }}>
              {isExpanded ? <ExpandMoreIcon sx={{ fontSize: 18 }} /> : <ChevronRightIcon sx={{ fontSize: 18 }} />}
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

          {isFolder ? (
            isExpanded ? (
              <FolderOpenOutlinedIcon sx={{ fontSize: 19, color: '#f59e0b', mr: 1 }} />
            ) : (
              <FolderOutlinedIcon sx={{ fontSize: 19, color: '#f59e0b', mr: 1 }} />
            )
          ) : (
            <Box sx={{ mr: 1, display: 'flex' }}>{renderFileIcon(node.type)}</Box>
          )}

          <Typography variant="body2" sx={{ color: cv.textPrimary, fontWeight: isFolder ? 500 : 400, flex: 1, wordBreak: 'break-word' }}>
            {node.name}
          </Typography>
        </Box>

        {isFolder && node.children.length > 0 && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            {node.children.map((child) => renderTreeNode(child, depth + 1))}
          </Collapse>
        )}
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      maxWidth={step === 'select_tree' ? 'sm' : 'xs'}
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
      {/* Step 1: Initial Choice Popup */}
      {step === 'choice' && (
        <>
          <DialogTitle sx={{ fontWeight: 600, fontSize: '1.125rem', pt: 2, pb: 1, color: cv.textPrimary }}>
            What would you like to permanently delete?
          </DialogTitle>
          <DialogContent sx={{ py: 1 }}>
            <Typography variant="body2" sx={{ color: cv.textSecondary, mb: 1 }}>
              Project: <strong style={{ color: cv.textPrimary }}>{projectName}</strong>
            </Typography>
            <Typography variant="body2" sx={{ color: cv.textMuted, fontSize: '0.85rem' }}>
              Choose whether to delete the entire project or select specific project files and folders.
            </Typography>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2, pt: 1, gap: 1, flexDirection: 'column', alignItems: 'stretch' }}>
            <Button
              variant="contained"
              onClick={() => setStep('confirm_entire')}
              sx={{
                borderRadius: '8px',
                bgcolor: cv.destructive || '#ff6b6b',
                color: cv.textOnCta || '#ffffff',
                textTransform: 'none',
                py: 1,
                fontWeight: 600,
                '&:hover': { bgcolor: cv.destructiveHover || '#fa5252' },
              }}
            >
              Delete Entire Project
            </Button>

            <Button
              variant="outlined"
              onClick={() => setStep('select_tree')}
              sx={{
                borderRadius: '8px',
                borderColor: cv.borderStrong || 'rgba(255,255,255,0.15)',
                bgcolor: cv.surfaceMuted || 'rgba(255,255,255,0.06)',
                color: cv.textPrimary,
                textTransform: 'none',
                py: 1,
                fontWeight: 500,
                '&:hover': { borderColor: cv.textSecondary, bgcolor: cv.surfaceHover },
              }}
            >
              Select Project Files
            </Button>

            <Button
              variant="text"
              onClick={onClose}
              sx={{ color: cv.textMuted, textTransform: 'none', py: 0.5 }}
            >
              Cancel
            </Button>
          </DialogActions>
        </>
      )}

      {/* Step 2A (Scenario 1): Warning Popup for Delete Entire Project */}
      {step === 'confirm_entire' && (
        <>
          <DialogTitle sx={{ fontWeight: 600, fontSize: '1.125rem', pt: 2, pb: 1, display: 'flex', alignItems: 'center', gap: 1, color: cv.textPrimary }}>
            <WarningAmberOutlinedIcon sx={{ color: cv.destructive || '#ff6b6b' }} />
            Permanently Delete Entire Project?
          </DialogTitle>

          <DialogContent sx={{ py: 1 }}>
            <Typography variant="body2" sx={{ color: cv.textSecondary, lineHeight: 1.6 }}>
              Are you sure you want to permanently delete this entire project (&apos;{projectName}&apos;) and all its files? This action cannot be undone.
            </Typography>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2, pt: 1, gap: 1 }}>
            <Button
              variant="outlined"
              onClick={() => setStep('choice')}
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
              onClick={() => void handleConfirmEntireSubmit()}
              sx={{
                borderRadius: '8px',
                bgcolor: cv.destructive || '#ff6b6b',
                color: cv.textOnCta || '#ffffff',
                textTransform: 'none',
                px: 3,
                fontWeight: 600,
                '&:hover': { bgcolor: cv.destructiveHover || '#fa5252' },
              }}
            >
              {submitting ? 'Deleting…' : 'Yes, Permanently Delete'}
            </Button>
          </DialogActions>
        </>
      )}

      {/* Step 2B (Scenario 2): Select Project Files Tree Modal */}
      {step === 'select_tree' && (
        <>
          <DialogTitle sx={{ fontWeight: 600, fontSize: '1.125rem', pt: 2, pb: 1 }}>
            Select Project Files to Delete
          </DialogTitle>

          <DialogContent sx={{ py: 1 }}>
            <Typography variant="body2" sx={{ color: cv.textSecondary, mb: 1.5 }}>
              Select which files and folders inside &apos;{projectName}&apos; should be permanently deleted.
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
                  No files or folders found inside this project. Click &apos;Delete&apos; to permanently delete this empty project.
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  border: `1px solid ${cv.borderPrimary || cv.border}`,
                  borderRadius: '12px',
                  overflow: 'hidden',
                  maxHeight: 340,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Project Header Row - Selected by Default & Disabled (Required) */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 1.25,
                    px: 1.5,
                    bgcolor: cv.surfaceRaised || 'rgba(255,255,255,0.04)',
                    borderBottom: `1px solid ${cv.borderPrimary || cv.border}`,
                  }}
                >
                  <Checkbox
                    size="small"
                    checked={true}
                    disabled={true}
                    sx={{ p: 0.5, mr: 1, color: cv.primary }}
                  />
                  <WorkOutlineOutlinedIcon sx={{ fontSize: 20, color: PROJECT_ACCENT_COLOR, mr: 1 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: cv.textPrimary, flex: 1 }}>
                    {projectName} (Project - Selected)
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
              {totalSelectedCount === 0 ? 'No files selected' : `${totalSelectedCount} file(s)/folder(s) selected`}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                onClick={() => setStep('choice')}
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
                Back
              </Button>
              <Button
                variant="contained"
                disabled={submitting}
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

      {/* Step 3 (Scenario 2 Confirmation): Warning Popup for Selected Items */}
      {step === 'confirm_selected' && (
        <>
          <DialogTitle sx={{ fontWeight: 600, fontSize: '1.125rem', pt: 2, pb: 1, display: 'flex', alignItems: 'center', gap: 1, color: cv.textPrimary }}>
            <WarningAmberOutlinedIcon sx={{ color: cv.destructive || '#ff6b6b' }} />
            Permanently Delete Selected Items?
          </DialogTitle>

          <DialogContent sx={{ py: 1 }}>
            <Typography variant="body2" sx={{ color: cv.textSecondary, lineHeight: 1.6 }}>
              Are you sure you want to permanently delete the selected project/files? This action cannot be undone.
            </Typography>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2, pt: 1, gap: 1 }}>
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
              onClick={() => void handleConfirmSelectedSubmit()}
              sx={{
                borderRadius: '8px',
                bgcolor: cv.destructive || '#ff6b6b',
                color: cv.textOnCta || '#ffffff',
                textTransform: 'none',
                px: 3,
                fontWeight: 600,
                '&:hover': { bgcolor: cv.destructiveHover || '#fa5252' },
              }}
            >
              {submitting ? 'Deleting…' : 'Yes, Permanently Delete'}
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
