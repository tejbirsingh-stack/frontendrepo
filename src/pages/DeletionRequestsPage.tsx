import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Typography,
} from '@mui/material';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import WorkOutlineOutlinedIcon from '@mui/icons-material/WorkOutlineOutlined';
import VideocamOutlinedIcon from '@mui/icons-material/VideocamOutlined';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import AudioFileOutlinedIcon from '@mui/icons-material/AudioFileOutlined';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import RestoreOutlinedIcon from '@mui/icons-material/RestoreOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { apiClient } from '../api/client';
import GlassCard from '../components/GlassCard';
import { useDashboard } from '../context/DashboardContext';
import { ROLE_IDS } from '../constants/userRoles';
import { cv } from '../theme/cssVars';
import { PROJECT_ACCENT_COLOR } from '../utils/folderColorStyle';

type MediaKind = 'folder' | 'project' | 'video' | 'image' | 'audio' | 'document' | 'file';

interface PendingDeletion {
  id: string;
  title: string;
  status?: string;
  deletedAt?: string;
  deletionReason?: string;
  type?: string;
  thumbnail?: string;
  workspaceName?: string;
  workspace?: string;
  isProject?: boolean;
  deletedBy?: {
    name?: string;
    role?: string;
    roleRelation?: { name?: string };
  };
  approvedBy?: {
    name?: string;
  };
  adminApprovedBy?: {
    name?: string;
  };
  reviewedBy?: {
    name?: string;
  };
}

function formatDeletedAt(value?: string): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .format(date)
    .replace(/(\d{4}),?/, '$1,');
}

function resolveMediaKind(item: PendingDeletion): MediaKind {
  if (item.isProject) return 'project';
  const raw = (item.type || '').toLowerCase();
  if (raw.includes('project')) return 'project';
  if (raw.includes('folder')) return 'folder';
  if (raw.includes('video')) return 'video';
  if (raw.includes('image') || raw.includes('photo')) return 'image';
  if (raw.includes('audio')) return 'audio';
  if (raw.includes('document') || raw.includes('file')) return 'document';
  return 'file';
}

function mediaKindLabel(kind: MediaKind): string {
  switch (kind) {
    case 'project':
      return 'Project';
    case 'folder':
      return 'Folder';
    case 'video':
      return 'Video';
    case 'image':
      return 'Image';
    case 'audio':
      return 'Audio';
    case 'document':
      return 'File';
    default:
      return 'File';
  }
}

function MediaThumb({ item }: { item: PendingDeletion }) {
  const kind = resolveMediaKind(item);
  const Icon =
    kind === 'project'
      ? WorkOutlineOutlinedIcon
      : kind === 'folder'
        ? FolderOutlinedIcon
        : kind === 'video'
          ? VideocamOutlinedIcon
          : kind === 'image'
            ? ImageOutlinedIcon
            : kind === 'audio'
              ? AudioFileOutlinedIcon
              : InsertDriveFileOutlinedIcon;

  const iconColor =
    kind === 'project' ? PROJECT_ACCENT_COLOR : kind === 'folder' ? cv.warning : cv.textMuted;

  if (item.thumbnail && (kind === 'image' || kind === 'video')) {
    return (
      <Box
        component="img"
        src={item.thumbnail}
        alt=""
        sx={{
          width: 56,
          height: 56,
          borderRadius: '10px',
          objectFit: 'cover',
          flexShrink: 0,
          backgroundColor: cv.surfaceRaised,
        }}
      />
    );
  }

  return (
    <Box
      sx={{
        width: 56,
        height: 56,
        borderRadius: '10px',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: cv.surfaceRaised,
        border: `1px solid ${cv.border}`,
      }}
    >
      <Icon sx={{ fontSize: 26, color: iconColor }} />
    </Box>
  );
}

function MetaPill({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'purple';
}) {
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        px: 1,
        py: 0.25,
        borderRadius: '999px',
        fontSize: '0.6875rem',
        fontWeight: 600,
        lineHeight: 1.2,
        backgroundColor: tone === 'purple' ? cv.purpleSelectionSoft : cv.surfaceHover,
        color: tone === 'purple' ? cv.brandPurple : cv.textSecondary,
      }}
    >
      {label}
    </Box>
  );
}

function isSuperAdminPending(item: PendingDeletion): boolean {
  const status = (item.status || '').toLowerCase().replace(/[\s_-]+/g, '');
  if (
    status.includes('superadmin') ||
    status.includes('adminapproved') ||
    status.includes('approvedfordeletion') ||
    status.includes('pendingpermanent')
  ) {
    return true;
  }
  return Boolean(item.approvedBy?.name || item.adminApprovedBy?.name || item.reviewedBy?.name);
}

function getAdminName(item: PendingDeletion): string | null {
  return item.approvedBy?.name || item.adminApprovedBy?.name || item.reviewedBy?.name || null;
}

function getWorkspaceName(item: PendingDeletion): string {
  return item.workspaceName || item.workspace || '—';
}

function getDeletedByLabel(item: PendingDeletion): string {
  const name = item.deletedBy?.name || 'Unknown';
  const role = item.deletedBy?.roleRelation?.name || item.deletedBy?.role || 'User';
  return `Deleted by ${name} (${role}) · ${formatDeletedAt(item.deletedAt)}`;
}

export default function DeletionRequestsPage() {
  const navigate = useNavigate();
  const { restoreFromTrashBulk } = useDashboard();
  const { user } = useAuth();
  const [requests, setRequests] = useState<PendingDeletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const isSuperAdmin =
    user?.role === 'Super Admin' || user?.roleId === ROLE_IDS.SUPER_ADMIN;
  const isAdmin =
    isSuperAdmin ||
    user?.role === 'Admin' ||
    user?.roleId === ROLE_IDS.ADMIN;

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<any>('/media/pending-deletions');
      const list = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.items)
            ? res.items
            : [];
      setRequests(list);
    } catch (error) {
      console.error('Error fetching deletion requests:', error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  const { adminPending, superAdminPending } = useMemo(() => {
    const admin: PendingDeletion[] = [];
    const superAdmin: PendingDeletion[] = [];
    for (const item of requests) {
      if (isSuperAdminPending(item)) superAdmin.push(item);
      else admin.push(item);
    }
    return { adminPending: admin, superAdminPending: superAdmin };
  }, [requests]);

  const runAction = async (id: string, action: () => Promise<unknown>) => {
    try {
      setBusyId(id);
      await action();
      await fetchRequests();
    } catch (error) {
      console.error(error);
    } finally {
      setBusyId(null);
    }
  };

  const handleRestore = (id: string) =>
    runAction(id, async () => {
      try {
        await apiClient.post(`/media/${id}/restore`);
      } catch {
        await apiClient.post(`/media/${id}/reject`);
      }
      restoreFromTrashBulk([id]);
    });

  const handleEscalateDelete = (id: string) =>
    runAction(id, () => apiClient.post(`/media/${id}/admin-approve`));

  const handlePermanentDelete = (id: string) =>
    runAction(id, async () => {
      try {
        await apiClient.post(`/media/${id}/permanent-delete`);
      } catch {
        await apiClient.delete(`/media/${id}`);
      }
    });

  const renderItemRow = (
    item: PendingDeletion,
    stage: 'admin' | 'super-admin',
  ) => {
    const kind = resolveMediaKind(item);
    const adminName = getAdminName(item);
    const canAct =
      stage === 'admin' ? isAdmin : isSuperAdmin;
    const isBusy = busyId === item.id;

    return (
      <Box
        key={item.id}
        onClick={() => navigate(`/media/${item.id}`)}
        sx={{
          display: 'flex',
          alignItems: { xs: 'flex-start', md: 'center' },
          flexDirection: { xs: 'column', md: 'row' },
          gap: 2,
          p: 1.75,
          borderRadius: '12px',
          backgroundColor: cv.surface,
          border: `1px solid ${cv.border}`,
          cursor: 'pointer',
          transition: 'background-color 0.15s ease',
          '&:hover': { backgroundColor: cv.surfaceHover },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, flex: 1, minWidth: 0 }}>
          <MediaThumb item={item} />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              sx={{
                fontSize: '0.9375rem',
                fontWeight: 600,
                color: cv.textPrimary,
                mb: 0.35,
              }}
            >
              {item.title || 'Untitled'}
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted, mb: 1 }}>
              {getDeletedByLabel(item)}
            </Typography>
            {item.deletionReason && (
              <Typography sx={{ fontSize: '0.75rem', color: cv.textSecondary, mb: 1, fontStyle: 'italic' }}>
                Reason: {item.deletionReason}
              </Typography>
            )}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, alignItems: 'center' }}>
              <MetaPill label={mediaKindLabel(kind)} />
              <MetaPill label={getWorkspaceName(item)} />
              {adminName ? <MetaPill label={`Admin: ${adminName}`} tone="purple" /> : null}
            </Box>
          </Box>
        </Box>

        {canAct ? (
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
              flexShrink: 0,
              ml: { md: 'auto' },
              width: { xs: '100%', md: 'auto' },
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <Button
              size="small"
              variant="outlined"
              startIcon={<RestoreOutlinedIcon />}
              disabled={isBusy}
              onClick={() => void handleRestore(item.id)}
              sx={{
                textTransform: 'none',
                borderRadius: '10px',
                borderColor: cv.borderStrong,
                color: cv.textPrimary,
                px: 1.5,
                '&:hover': {
                  borderColor: cv.textSecondary,
                  backgroundColor: cv.surfaceRaised,
                },
              }}
            >
              Restore
            </Button>
            {stage === 'admin' ? (
              <Button
                size="small"
                variant="contained"
                startIcon={<DeleteOutlineOutlinedIcon />}
                disabled={isBusy}
                onClick={() => void handleEscalateDelete(item.id)}
                sx={{
                  textTransform: 'none',
                  borderRadius: '10px',
                  backgroundColor: cv.destructive,
                  color: cv.textInverse,
                  px: 1.5,
                  boxShadow: 'none',
                  '&:hover': {
                    backgroundColor: cv.destructiveHover,
                    boxShadow: 'none',
                  },
                }}
              >
                Delete
              </Button>
            ) : (
              <Button
                size="small"
                variant="contained"
                startIcon={<DeleteOutlineOutlinedIcon />}
                disabled={isBusy}
                onClick={() => void handlePermanentDelete(item.id)}
                sx={{
                  textTransform: 'none',
                  borderRadius: '10px',
                  backgroundColor: cv.destructive,
                  color: cv.textInverse,
                  px: 1.5,
                  boxShadow: 'none',
                  '&:hover': {
                    backgroundColor: cv.destructiveHover,
                    boxShadow: 'none',
                  },
                }}
              >
                Delete forever
              </Button>
            )}
          </Box>
        ) : null}
      </Box>
    );
  };

  const renderSection = ({
    title,
    description,
    items,
    emptyLabel,
    stage,
  }: {
    title: string;
    description: string;
    items: PendingDeletion[];
    emptyLabel: string;
    stage: 'admin' | 'super-admin';
  }) => (
    <Box sx={{ mb: 4 }}>
      <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: cv.textPrimary, mb: 0.5 }}>
        {title} ({items.length})
      </Typography>
      <Typography sx={{ fontSize: '0.8125rem', color: cv.textSecondary, mb: 1.75 }}>
        {description}
      </Typography>

      {items.length === 0 ? (
        <Box
          sx={{
            borderRadius: '12px',
            border: `1px dashed ${cv.border}`,
            backgroundColor: cv.surface,
            px: 2,
            py: 5,
            textAlign: 'center',
          }}
        >
          <Typography sx={{ fontSize: '0.875rem', color: cv.textMuted }}>{emptyLabel}</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          {items.map((item) => renderItemRow(item, stage))}
        </Box>
      )}
    </Box>
  );

  return (
    <Box
      component="main"
      sx={{
        flex: 1,
        overflowY: 'auto',
        px: { xs: 2, md: 3 },
        py: { xs: 2, md: 3 },
      }}
    >
      <Box sx={{ mb: 3.5, maxWidth: 820 }}>
        <Typography
          variant="h5"
          sx={{ fontWeight: 600, fontSize: { xs: '1.25rem', sm: '1.5rem' }, mb: 0.75 }}
        >
          Delete Management
        </Typography>
        <Typography sx={{ fontSize: '0.875rem', color: cv.textSecondary, lineHeight: 1.5 }}>
          Review deleted files and folders. Click an item to preview it. Admins restore or approve
          deletion; Super Admins make the final restore or permanent delete decision.
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {renderSection({
            title: 'Pending Admin review',
            description:
              'Items deleted by editors and other roles. Restore them, or delete to escalate to Super Admin.',
            items: adminPending,
            emptyLabel: 'No deletions waiting for Admin review.',
            stage: 'admin',
          })}
          {renderSection({
            title: 'Pending Super Admin review',
            description: 'Items approved for deletion by an Admin. Restore them, or permanently delete.',
            items: superAdminPending,
            emptyLabel: 'No deletions waiting for Super Admin review.',
            stage: 'super-admin',
          })}
        </>
      )}
    </Box>
  );
}
