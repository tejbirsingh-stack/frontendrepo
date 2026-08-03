import { useMediaWebSocket, type WebSocketMessage } from '../hooks/useMediaWebSocket';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cv } from '../theme/cssVars';
import { Alert, Box, Button, Chip, CircularProgress, IconButton, Snackbar, Tooltip, Typography, useMediaQuery, useTheme } from '@mui/material';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import StarBorderOutlinedIcon from '@mui/icons-material/StarBorderOutlined';
import StarIcon from '@mui/icons-material/Star';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import VideocamOutlinedIcon from '@mui/icons-material/VideocamOutlined';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import AudioFileOutlinedIcon from '@mui/icons-material/AudioFileOutlined';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import NoahLogo from '../components/NoahLogo';
import TruncatedText from '../components/TruncatedText';
import GlassCard from '../components/GlassCard';
import AnnotationToolbar, { type AnnotationTool } from '../components/media/AnnotationToolbar';
import type { DrawStrokeThickness, DrawTool } from '../components/media/DrawSubToolbar';
import type { ShapeStrokeThickness, ShapeTool } from '../components/media/ShapeSubToolbar';
import { DEFAULT_DRAW_STROKE_THICKNESS } from '../utils/drawStrokeStyle';
import {
  DEFAULT_ANNOTATION_COLOR,
  type AnnotationColor,
} from '../constants/annotationColors';
import { DEFAULT_DRAW_COLOR } from '../constants/drawColors';
import AnnotationHistoryDrawer from '../components/media/AnnotationHistoryDrawer';
import type {
  MediaDetailsSection,
  MediaTechnicalDetails,
} from '../components/media/MediaDetailsPanel';
import AnnotationHelpDialog from '../components/media/AnnotationHelpDialog';
import AnnotationUndoIsland from '../components/media/AnnotationUndoIsland';
import { decodeClientImageToDataUrl } from '../utils/clientImageDecoder';
import {
  mergedMobileIslandSx,
  mobileIslandScrollSx,
} from '../components/media/LabeledToolbarButton';
import ClearAnnotationsModal from '../components/media/ClearAnnotationsModal';
import WorkspaceControlsIsland from '../components/media/WorkspaceControlsIsland';
import PlayerToolsDrawer from '../components/media/PlayerToolsDrawer';
import PeopleCollaboratorsPopover from '../components/media/PeopleCollaboratorsPopover';
import WorkspaceMembersDialog from '../components/settings/WorkspaceMembersDialog';
import type { ShareLink } from '../types/shareLink';
import type { MediaCollaborator } from '../types/mediaCollaborator';
import {
  MOCK_SETTINGS_USER_GROUPS,
  MOCK_SETTINGS_USERS,
  resolveWorkspaceInvite,
  type ProjectVisibility,
  type WorkspaceInvitePayload,
  type WorkspaceMemberAccess,
  type WorkspaceTeamMember,
} from '../data/mockSettingsData';
import {
  fetchShareLinks,
  createShareLinkAsync,
  updateShareLinkAsync,
  revokeShareLinkAsync,
} from '../utils/shareLinkStorage';
import { getMediaFileName } from '../utils/mediaFileName';
import {
  createCollaboratorFromInvite,
  loadMediaCollaborators,
  saveMediaCollaborators,
} from '../utils/mediaCollaboratorStorage';
import VideoAnnotationSurface, {
  type AnnotationSurfaceRecord,
} from '../components/media/VideoAnnotationSurface';
import VideoCommentLayer from '../components/media/VideoCommentLayer';
import { useActiveUser } from '../hooks/useActiveUser';
import VideoPlayerControls from '../components/media/VideoPlayerControls';
import { useDashboard } from '../context/DashboardContext';
import { useAuth } from '../auth/AuthContext';
import { ROLE_IDS } from '../constants/userRoles';

import { SAMPLE_VIDEO_SRC } from '../constants/sampleVideos';
import { DASHBOARD_TOP_BAR_BORDER, DASHBOARD_TOP_BAR_HEIGHT, HEADER_LOGO_WIDTH, SIDEBAR_DESKTOP_BREAKPOINT } from '../constants/layout';
import { TOAST_Z_INDEX } from '../constants/dropdownMenu';
import type { AnnotationHistoryEntry, AnnotationHistoryType } from '../types/annotationHistory';
import type { AnnotationAccessGroup, AnnotationVisibility } from '../types/annotationVisibility';
import { DEFAULT_ANNOTATION_VISIBILITY } from '../types/annotationVisibility';
import type { VideoDrawingStroke } from '../types/videoDrawings';
import type { VideoShape } from '../types/videoShapes';
import type { VideoStamp } from '../types/videoStamps';
import { DEFAULT_STAMP_ID, type StampId } from '../constants/stamps';
import type { CustomStamp } from '../types/customStamps';
import {
  createOrUpdateCustomStamp,
  loadCustomStamp,
  saveCustomStamp,
} from '../utils/customStampStorage';
import type { DraftVideoComment, VideoComment } from '../types/videoComments';
import {
  mergeLinkedAnnotationHistory,
} from '../utils/annotationHistoryStorage';

import {
  getMediaAnnotationsRequest,
  saveMediaAnnotationRequest,
  updateMediaAnnotationRequest,
  deleteMediaAnnotationRequest,
} from '../api/annotations.service';
import {
  getShareAnnotationsApi,
  createShareAnnotationApi,
} from '../api/share.service';
import { fetchOrganizationUsers } from '../api/auth.service';
import { addInAppNotification } from '../data/mockNotifications';

import { getAnnotationGroupsRequest, createAnnotationGroupRequest, deleteAnnotationGroupRequest, updateAnnotationGroupRequest } from '../api/annotations.service';
import { getPlayerBackgroundStyle, getVideoTransform } from '../utils/playerDisplay';
import {
  loadPinnedPlayerTools,
  savePinnedPlayerTools,
} from '../utils/playerToolStorage';
import { useAnnotationUndoRedo } from '../hooks/useAnnotationUndoRedo';
import {
  EMPTY_ANNOTATION_SNAPSHOT,
  type AnnotationSnapshot,
} from '../types/annotationSnapshot';
import {
  buildResolvedOverlayEntryIds,
  getDrawingHistoryEntryId,
  getShapeHistoryEntryId,
  getStampHistoryEntryId,
} from '../utils/annotationOverlayVisibility';
import { shapeSummary } from '../components/media/ShapeGraphic';
import { getStampSummary } from '../constants/stamps';
import type { AnnotationCommentPromptRequest } from '../utils/annotationCommentPrompt';
import { hasAnnotationContent } from '../utils/annotationSnapshot';
import { buildTimelineItems } from '../utils/buildTimelineItems';
import { createDefaultAnnotationEndTime } from '../utils/annotationTimeRange';
import type { TimelineAnnotationType } from '../types/annotationTimeline';
import { formatFileSize } from '../utils/formatFileSize';
import { formatVideoTimestamp, parseMediaDurationLabel } from '../utils/formatVideoTimestamp';
import {
  extractPlaybackQualityMetadata,
  extractVideoStreamMetadata,
  getVideoQualityLabel,
  startFrameRateMeasurement,
} from '../utils/videoTechnicalMetadata';
import {
  formatWorkspaceZoomLabel,
  isWorkspaceZoomDefault,
  stepWorkspaceZoom,
  WORKSPACE_ZOOM_DEFAULT,
  WORKSPACE_ZOOM_MAX,
  WORKSPACE_ZOOM_MIN,
} from '../utils/workspaceZoom';
import type { PlayerBackground, PlayerToolHandlers, PlayerToolId } from '../types/playerTools';
import { shouldBlockAnnotationShortcuts, getRedoShortcutLabel, getUndoShortcutLabel } from '../constants/annotationShortcuts';
import {
  buildDefaultPlayerToolShortcutMap,
  getPlayerToolIdFromEvent,
  runPlayerToolAction,
} from '../utils/playerToolUtils';
import { useResolvedKeyboardShortcuts } from '../hooks/useResolvedKeyboardShortcuts';
import { matchesKeyboardShortcut } from '../utils/matchKeyboardShortcut';
import { getMediaAssetByIdRequest, updateAssetTagsRequest, retryTranscodeRequest, getAssetAccessOverrides, updateAssetAccessOverride, removeAssetAccessOverride, getCompanyInfoRequest } from '../api';
import type { MediaItem, MediaType } from '../data/mockMedia';

function collaboratorsToTeamMembers(collaborators: MediaCollaborator[]): WorkspaceTeamMember[] {
  return collaborators.map((collaborator) => {
    // Map the backend role to the frontend dropdown options
    let access: WorkspaceMemberAccess = 'Full Access';
    if (collaborator.role) {
      const normalizedRole = collaborator.role.toLowerCase();
      if (normalizedRole.includes('viewer')) access = 'Can view';
      else if (normalizedRole.includes('collaborator')) access = 'Can edit';
      else if (normalizedRole.includes('editor')) access = 'Can edit';
    }

    return {
      id: collaborator.id,
      name: collaborator.name,
      initials: collaborator.initials,
      email: collaborator.email,
      avatarUrl: collaborator.avatarUrl,
      access,
      memberType: 'Member',
      isCurrentUser: collaborator.isCurrentUser,
      hasOverride: collaborator.hasOverride,
    };
  });
}

function slugifyShareLinkName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '');
}

const ANNOTATION_OVERLAY_TOOLS: AnnotationTool[] = [
  'comment',
  'draw',
  'shape',
  'stamp',
  'pan',
];

const SURFACE_TOOLS: AnnotationTool[] = ['draw', 'shape', 'stamp', 'pan'];

const mediaTypeLabels = {
  folder: 'Folder',
  video: 'Video',
  image: 'Image',
  audio: 'Audio',
  document: 'File',
} as const;

const mediaTypeHeaderIcons = {
  folder: InsertDriveFileOutlinedIcon,
  video: VideocamOutlinedIcon,
  image: ImageOutlinedIcon,
  audio: AudioFileOutlinedIcon,
  document: InsertDriveFileOutlinedIcon,
} as const;

export interface VideoPlayerPageProps {
  isGuestMode?: boolean;
  shareToken?: string;
  guestPermissions?: {
    view: boolean;
    comment: boolean;
    download: boolean;
    downloadProxy: boolean;
  };
  guestAssetMeta?: {
    id: string;
    title: string;
    fileType: string;
    mimeType: string;
    fileSize: number;
    logoUrl?: string | null;
    organizationName?: string | null;
  };
  guestExpiresAt?: string | null;
}

export default function VideoPlayerPage({
  isGuestMode = false,
  shareToken,
  guestPermissions = { view: true, comment: true, download: true, downloadProxy: true },
  guestAssetMeta,
  guestExpiresAt,
}: VideoPlayerPageProps = {}) {
  let user: any = null;
  try {
    const auth = useAuth();
    user = auth?.user || null;
  } catch {
    user = null;
  }
  const canDownloadOriginal = useMemo(() => {
    if (isGuestMode) return false;
    if (!user) return true;
    const role = user.role;
    const roleId = user.roleId;
    if (role === 'Viewer' || roleId === ROLE_IDS.VIEWER) {
      return false;
    }
    return true;
  }, [isGuestMode, user]);
  const { mediaId } = useParams<{ mediaId: string }>();
  const activeUser = useActiveUser();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDesktopAnnotationToolbar = useMediaQuery(
    theme.breakpoints.up(SIDEBAR_DESKTOP_BREAKPOINT),
  );

  let dashboardData: any = { mediaItems: [], updateMediaTags: () => { }, favorites: new Set<string>(), toggleFavorite: () => { } };
  try {
    const dashboard = useDashboard();
    if (dashboard) dashboardData = dashboard;
  } catch {
    // Guest mode outside DashboardProvider
  }
  const { mediaItems = [], sharedMediaItems = [], updateMediaTags = () => { }, favorites, toggleFavorite = () => { } } = dashboardData;

  const videoRef = useRef<HTMLVideoElement>(null);
  const videoStageRef = useRef<HTMLDivElement>(null);
  const moreToolsButtonRef = useRef<HTMLButtonElement>(null);
  const moreToolsAnchorRef = useRef<HTMLDivElement>(null);
  const mobilePlayerFooterRef = useRef<HTMLElement>(null);
  const linkedCommentDragOriginRef = useRef<{
    linkKey: string;
    comment?: { id: string; xPercent: number; yPercent: number };
    draft?: { xPercent: number; yPercent: number };
  } | null>(null);

  const clampPercent = (value: number) => Math.min(100, Math.max(0, value));

  const guestItem: MediaItem | null = useMemo(() => {
    if (!isGuestMode || !guestAssetMeta) return null;
    const rawType = (guestAssetMeta.fileType || (guestAssetMeta as any).type || '').toLowerCase();
    const mime = (guestAssetMeta.mimeType || '').toLowerCase();

    const type: MediaType =
      rawType === 'image' || rawType.includes('image') || mime.startsWith('image/')
        ? 'image'
        : rawType === 'audio' || rawType.includes('audio') || mime.startsWith('audio/')
          ? 'audio'
          : rawType === 'document' || rawType.includes('pdf') || mime.includes('pdf')
            ? 'document'
            : 'video';

    const tokenStreamUrl = shareToken ? `/api/share/${shareToken}/stream` : '';

    return {
      id: guestAssetMeta.id || 'guest-asset',
      title: guestAssetMeta.title || 'Shared Media',
      type,
      url: tokenStreamUrl,
      videoSrc: tokenStreamUrl,
      thumbnail: tokenStreamUrl,
      duration: '0:00',
      size: formatFileSize(guestAssetMeta.fileSize || 0),
      updatedAt: guestExpiresAt ? `Expires: ${new Date(guestExpiresAt).toLocaleDateString()}` : '',
      tags: [],
    };
  }, [isGuestMode, guestAssetMeta, shareToken, guestExpiresAt]);

  const contextItem = mediaItems.find((media) => media.id === mediaId);
  const [fetchedItem, setFetchedItem] = useState<MediaItem | null>(null);

  const item = useMemo(() => {
    if (isGuestMode) {
      return guestItem || contextItem || fetchedItem || null;
    }
    return contextItem && fetchedItem?.id === contextItem.id
      ? {
        ...contextItem,
        videoSrc: contextItem.videoSrc || fetchedItem.videoSrc,
        thumbnail: contextItem.thumbnail || fetchedItem.thumbnail,
        compressionStatus: fetchedItem.compressionStatus || contextItem.compressionStatus,
        duration: contextItem.duration || fetchedItem.duration,
        customMetadata: fetchedItem.customMetadata || contextItem.customMetadata,
      }
      : contextItem || fetchedItem;
  }, [isGuestMode, guestItem, contextItem, fetchedItem]);

  const isFavorite = useMemo(() => {
    if (!item?.id || !favorites) return false;
    if (typeof (favorites as any).has === 'function') {
      return (favorites as any).has(item.id);
    }
    if (Array.isArray(favorites)) {
      return (favorites as Array<any>).includes(item.id);
    }
    return false;
  }, [favorites, item?.id]);

  const [isFetching, setIsFetching] = useState(isGuestMode ? false : !contextItem);
  const [fetchError, setFetchError] = useState(false);

  const [clientDecodedUrl, setClientDecodedUrl] = useState<string | null>(null);
  const [isDecodingImage, setIsDecodingImage] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);

  const [syncTrigger, setSyncTrigger] = useState(0);

  // Listen for incoming websocket messages from other users & external guests
  const handleWebSocketMessage = useCallback((msg: WebSocketMessage) => {
    if (msg.type === 'NEW_ANNOTATION') {
      // Force a re-fetch of the API annotations so all state arrays (comments, shapes, etc) update correctly!
      setSyncTrigger(prev => prev + 1);
      try {
        const payload = msg.payload as any;
        if (payload) {
          const author = payload.author || (payload.data && payload.data.author);
          const authorEmail = author?.email;
          const authorName = author?.name || (payload.data?.guestName ? `${payload.data.guestName} (Guest)` : 'Guest User');

          const commentText = payload.text || (payload.data && payload.data.text) || '';

          if (commentText) {
            const videoTitle = fetchedItem?.title || contextItem?.title || guestAssetMeta?.title || 'a video';

            // Check if current user is mentioned in the comment
            const userIdentifier = user?.name || user?.email?.split('@')[0] || '';
            const isMentioned = userIdentifier && commentText.toLowerCase().includes(`@${userIdentifier.toLowerCase()}`);

            if (isMentioned) {
              addInAppNotification(
                'Mentioned in comment',
                `${authorName} mentioned you in a comment on "${videoTitle}": "${commentText.substring(0, 40)}${commentText.length > 40 ? '...' : ''}"`,
                user?.email
              );
            } else if (authorEmail !== user?.email) {
              // Notification for media owner and room members
              addInAppNotification(
                `Comment on ${videoTitle}`,
                `${authorName} commented: "${commentText.substring(0, 40)}${commentText.length > 40 ? '...' : ''}"`,
                user?.email
              );
            }
          }
        }
      } catch (err) {
        console.error('Failed to process web socket notification:', err);
      }
    }
  }, [user, fetchedItem, contextItem, guestAssetMeta]);

  // Initialize the real-time connection using our DRY hook (supports both mediaId and guest asset ID)!
  const wsTargetMediaId = guestAssetMeta?.id || mediaId;
  const { broadcastMessage } = useMediaWebSocket(wsTargetMediaId, handleWebSocketMessage);


  useEffect(() => {
    if (mediaId) {
      setIsFetching(true);
      getMediaAssetByIdRequest(mediaId)
        .then((asset) => {
          const techSpecs = (asset.metadata as any)?.technicalSpecs || asset.customMetadata?.technicalSpecs || {};
          setVideoTechnicalDetails(techSpecs);

          const tagList = Array.isArray((asset as any).tags) && (asset as any).tags.length > 0
            ? (asset as any).tags
            : (Array.isArray((asset.metadata as any)?.tags)
              ? (asset.metadata as any).tags
              : (Array.isArray((asset.customMetadata as any)?.tags)
                ? (asset.customMetadata as any).tags
                : []));

          setFetchedItem({
            id: asset.id,
            title: asset.name,
            summary: asset.customMetadata?.summary || (asset.metadata as any)?.customProperties?.summary || undefined,
            type: (asset.type.split('/')[0] as MediaType) || 'document',
            workspaceId: 'default',
            createdAt: asset.uploadDate || new Date().toISOString(),
            sizeBytes: asset.size,
            storageProvider: 'b2',
            uploadedBy: (asset as any).uploadedBy?.name || user?.name || (user?.email ? user.email.split('@')[0] : 'Uploader'),
            tags: tagList,
            location: null,
            thumbnail: asset.thumbnail || undefined,
            videoSrc: asset.url,
            compressionStatus: asset.compressionStatus || 'completed',
            customMetadata: asset.customMetadata,
            duration: (techSpecs.duration as string) || (asset.customMetadata?.duration as string) || undefined,
          });
        })
        .catch((err) => {
          console.error(err);
          setFetchError(true);
        })
        .finally(() => {
          setIsFetching(false);
        });
    } else {
      setIsFetching(false);
    }
  }, [mediaId]);
  const [activeTool, setActiveTool] = useState<AnnotationTool>('select');
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [selectedStampId, setSelectedStampId] = useState<string | null>(null);
  const [openCommentId, setOpenCommentId] = useState<string | null>(null);
  const [internalLogoUrl, setInternalLogoUrl] = useState<string | null>(null);

  const isSharedWithUser = !isGuestMode && sharedMediaItems.some((m: MediaItem) => m.id === mediaId);

  useEffect(() => {
    if (!isGuestMode) {
      getCompanyInfoRequest()
        .then((res) => {
          setInternalLogoUrl(res?.metadata?.logoUrl || null);
        })
        .catch((err) => console.error('Failed to load company logo:', err));
    }
  }, [isGuestMode]);

  const handleAnnotationClick = useCallback((id: string, type: TimelineAnnotationType) => {
    setSelectedShapeId(null);
    setSelectedStampId(null);
    setOpenCommentId(null);

    let historyId: string | null = null;

    if (type === 'shape') {
      setSelectedShapeId(id);
      setActiveTool('shape');
      historyId = getShapeHistoryEntryId(id);
    } else if (type === 'stamp') {
      setSelectedStampId(id);
      setActiveTool('stamp');
      historyId = getStampHistoryEntryId(id);
    } else if (type === 'comment') {
      setOpenCommentId(id);
      setActiveTool('comment');
      historyId = `comment-${id}`;
    } else if (type === 'drawing') {
      setActiveTool('draw');
      historyId = getDrawingHistoryEntryId(id);
    }

    if (historyId) {
      setActiveHistoryEntryId(historyId);
      setHistoryOpen(true);
      setDrawerTab('history');
    }
  }, []);

  useEffect(() => {
    if (item?.type === 'audio') {
      setActiveTool('comment');
    } else if (item?.type === 'image' || item?.type === 'video') {
      setActiveTool('select');
    }
  }, [item?.type]);
  const [activeDrawTool, setActiveDrawTool] = useState<DrawTool>('pencil');
  const [activeDrawStroke, setActiveDrawStroke] = useState<DrawStrokeThickness>(
    DEFAULT_DRAW_STROKE_THICKNESS,
  );
  const [activeDrawColor, setActiveDrawColor] = useState<AnnotationColor>(DEFAULT_DRAW_COLOR);
  const [activeShape, setActiveShape] = useState<ShapeTool>('rectangle');
  const [activeShapeColor, setActiveShapeColor] = useState<AnnotationColor>(DEFAULT_ANNOTATION_COLOR);
  const [activeShapeStroke, setActiveShapeStroke] = useState<ShapeStrokeThickness>(
    DEFAULT_DRAW_STROKE_THICKNESS,
  );
  const [collaborators, setCollaborators] = useState<MediaCollaborator[]>([]);
  const isViewer = useMemo(() => {
    if (isGuestMode) {
      return !guestPermissions?.comment;
    }
    const currentUserCollab = collaborators.find((c) => c.isCurrentUser);
    const isAssetViewer = currentUserCollab?.role === 'Viewer';
    return isAssetViewer || !user?.permissions?.includes('timeline_annotations');
  }, [isGuestMode, guestPermissions?.comment, collaborators, user?.permissions]);
  const [comments, setComments] = useState<VideoComment[]>([]);
  const [drawings, setDrawings] = useState<VideoDrawingStroke[]>([]);
  const [shapes, setShapes] = useState<VideoShape[]>([]);
  const [stamps, setStamps] = useState<VideoStamp[]>([]);
  const [customStamp, setCustomStamp] = useState<CustomStamp | null>(() => loadCustomStamp());
  const [activeStamp, setActiveStamp] = useState<StampId>(DEFAULT_STAMP_ID);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const prevCommentsRef = useRef<VideoComment[]>([]);
  const prevShapesRef = useRef<VideoShape[]>([]);
  const prevDrawingsRef = useRef<VideoDrawingStroke[]>([]);
  const prevStampsRef = useRef<VideoStamp[]>([]);

  const useGranularSync = <T extends { id: string }>(
    type: string,
    currentData: T[],
    prevRef: React.MutableRefObject<T[]>
  ) => {
    useEffect(() => {
      if (!initialLoadComplete || (!mediaId && !shareToken)) return;

      const current = currentData;
      const previous = prevRef.current;

      const added = current.filter(c => !previous.find(p => p.id === c.id));
      const deleted = previous.filter(p => !current.find(c => c.id === p.id));
      const updated = current.filter(c => {
        const prev = previous.find(p => p.id === c.id);
        return prev && JSON.stringify(prev) !== JSON.stringify(c);
      });


      added.forEach(async (c) => {
        const anyC = c as any;
        const vTime = anyC.videoTimestamp !== undefined ? anyC.videoTimestamp : (anyC.timestamp !== undefined ? anyC.timestamp : null);
        try {
          if (isGuestMode && shareToken) {
            const guestName = localStorage.getItem('guest_name') || 'Guest User';
            await createShareAnnotationApi(shareToken, {
              guestName,
              text: anyC.text || (anyC.data && anyC.data.text) || '',
              videoTimestamp: vTime,
              type,
              data: c,
            });
          } else if (mediaId) {
            await saveMediaAnnotationRequest(mediaId, {
              id: c.id,
              type,
              data: c,
              videoTimestamp: vTime,
              parentId: anyC.parentId || null
            });
          }
          broadcastMessage({ type: 'NEW_ANNOTATION', payload: c as any });
          // Generate client-side in-app notifications if text is present
          const commentText = anyC.text || (anyC.data && anyC.data.text) || '';
          if (commentText) {
            const authorName = user?.name || 'Someone';
            const videoTitle = (fetchedItem || contextItem || guestAssetMeta)?.title || 'a video';

            // 1. Scan for mentions in the collaborators list
            collaborators.forEach((collab) => {
              const namesToTry = [
                collab.name,
                collab.name?.split(' ')[0],
                collab.email?.split('@')[0]
              ].filter(Boolean) as string[];

              const isCollabMentioned = namesToTry.some(n => {
                const pattern = new RegExp(`@${n}\\b`, 'i');
                return pattern.test(commentText);
              });

              if (isCollabMentioned) {
                addInAppNotification(
                  'Mentioned in comment',
                  `${authorName} mentioned you in a comment on "${videoTitle}": "${commentText}"`,
                  collab.email
                );
              }
            });

            // 2. Scan if owner/uploader needs comment notification
            const currentItem = fetchedItem || contextItem || guestAssetMeta;
            if (currentItem?.uploadedByUserId && currentItem?.uploadedByUserId !== user?.id) {
              const uploaderCollab = collaborators.find(collab => collab.id === currentItem.uploadedByUserId);
              if (uploaderCollab) {
                addInAppNotification(
                  `Comment on ${videoTitle}`,
                  `${authorName} commented on your video: "${commentText}"`,
                  uploaderCollab.email
                );
              }
            }
          }
        } catch (error) {
          console.error('Failed to save annotation:', error);
        }
      });

      updated.forEach(async (c) => {
        const anyC = c as any;
        const vTime = anyC.videoTimestamp !== undefined ? anyC.videoTimestamp : (anyC.timestamp !== undefined ? anyC.timestamp : null);
        try {
          if (!isGuestMode && mediaId) {
            await updateMediaAnnotationRequest(c.id, {
              data: c,
              videoTimestamp: vTime,
              resolved: anyC.resolved
            });
          }
          broadcastMessage({ type: 'NEW_ANNOTATION', payload: c as any });
        } catch (error) {
          console.error(error);
        }
      });

      deleted.forEach(async (c) => {
        try {
          if (!isGuestMode && mediaId) {
            await deleteMediaAnnotationRequest(c.id);
          }
          broadcastMessage({ type: 'NEW_ANNOTATION', payload: c as any });
        } catch (error) {
          console.error(error);
        }
      });

      prevRef.current = current;
    }, [currentData, mediaId, initialLoadComplete, type, prevRef, user, item, collaborators, isGuestMode, shareToken, guestAssetMeta]);
  };

  useGranularSync('comment', comments, prevCommentsRef);
  useGranularSync('shape', shapes, prevShapesRef);
  useGranularSync('drawing', drawings, prevDrawingsRef);
  useGranularSync('stamp', stamps, prevStampsRef);
  const [draftComment, setDraftComment] = useState<DraftVideoComment | null>(null);
  const [activeHistoryEntryId, setActiveHistoryEntryId] = useState<string | null>(null);
  const [history, setHistory] = useState<AnnotationHistoryEntry[]>([]);
  const [historyOpen, setHistoryOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(`(min-width:${theme.breakpoints.values.lg}px)`).matches;
  });
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareInviteVisibility, setShareInviteVisibility] = useState<ProjectVisibility>('public');
  const [activeShareLinkId, setActiveShareLinkId] = useState<string | null>(null);
  const [focusLinkNameCounter, setFocusLinkNameCounter] = useState(0);
  const [shareTeamMembers, setShareTeamMembers] = useState<WorkspaceTeamMember[]>([]);
  const [drawerTab, setDrawerTab] = useState<'history' | 'details'>('history');
  const [detailsSection, setDetailsSection] = useState<MediaDetailsSection>('file');
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);

  const [annotationGroups, setAnnotationGroups] = useState<AnnotationAccessGroup[]>([]);
  const [toolsDrawerOpen, setToolsDrawerOpen] = useState(false);

  useEffect(() => {
    setToolsDrawerOpen(false);
  }, [isDesktopAnnotationToolbar]);

  useEffect(() => {
    if (item?.type !== 'video') {
      setToolsDrawerOpen(false);
    }
  }, [item?.type]);
  const [clearAnnotationsModalOpen, setClearAnnotationsModalOpen] = useState(false);
  const [keyboardShortcutsOpen, setKeyboardShortcutsOpen] = useState(false);
  const [workspaceZoom, setWorkspaceZoom] = useState(WORKSPACE_ZOOM_DEFAULT);
  const [pinnedPlayerTools, setPinnedPlayerTools] = useState<PlayerToolId[]>(() =>
    loadPinnedPlayerTools(),
  );
  const [playerLoop, setPlayerLoop] = useState(false);
  const [playerFlipHorizontal, setPlayerFlipHorizontal] = useState(false);
  const [playerFlipVertical, setPlayerFlipVertical] = useState(false);
  const [playerRotationSteps, setPlayerRotationSteps] = useState(0);
  const [playerInPoint, setPlayerInPoint] = useState<number | null>(null);
  const [playerOutPoint, setPlayerOutPoint] = useState<number | null>(null);
  const [playerRangeEnabled, setPlayerRangeEnabled] = useState(false);
  const [playerActualMediaSize, setPlayerActualMediaSize] = useState(false);
  const [playerBackground, setPlayerBackground] = useState<PlayerBackground>('black');
  const [playerShowAudioMeter, setPlayerShowAudioMeter] = useState(false);
  const [annotationsVisible, setAnnotationsVisible] = useState(true);
  const [commentThreadOpen, setCommentThreadOpen] = useState(false);
  const [videoTechnicalDetails, setVideoTechnicalDetails] = useState<MediaTechnicalDetails>({});
  const [statusToast, setStatusToast] = useState<{
    open: boolean;
    message: string;
    variant: 'resolved' | 'reopen' | 'error';
  }>({ open: false, message: '', variant: 'resolved' });

  const { getShortcut } = useResolvedKeyboardShortcuts();

  const playerToolShortcuts = useMemo(() => {
    const map = buildDefaultPlayerToolShortcutMap();
    map.forEach((_shortcut, toolId) => {
      const resolved = getShortcut(`player-tool-${toolId}`);
      if (resolved) {
        map.set(toolId, resolved);
      }
    });
    return map;
  }, [getShortcut]);

  const undoShortcut = getShortcut('annotation-undo') ?? getUndoShortcutLabel();
  const redoShortcut = getShortcut('annotation-redo') ?? getRedoShortcutLabel();

  const getVideoTimestamp = useCallback(() => {
    return videoRef.current?.currentTime ?? 0;
  }, []);

  const {
    canUndo,
    canRedo,
    pushSnapshot,
    undo,
    redo,
    resetStacks,
    runRestore,
  } = useAnnotationUndoRedo();

  const getAnnotationSnapshot = useCallback((): AnnotationSnapshot => {
    return {
      comments,
      drawings,
      shapes,
      stamps,
      history,
    };
  }, [comments, drawings, history, shapes, stamps]);

  const applyAnnotationSnapshot = useCallback(
    (snapshot: AnnotationSnapshot) => {
      runRestore(() => {
        setComments(snapshot.comments);
        setDrawings(snapshot.drawings);
        setShapes(snapshot.shapes);
        setStamps(snapshot.stamps);
        setHistory(snapshot.history);
        setDraftComment(null);
      });
    },
    [runRestore],
  );

  const handleAnnotationActionStart = useCallback(() => {
    linkedCommentDragOriginRef.current = null;
    pushSnapshot(getAnnotationSnapshot());
  }, [getAnnotationSnapshot, pushSnapshot]);

  const handleMoveComment = useCallback((commentId: string, xPercent: number, yPercent: number) => {
    setComments((prev) =>
      prev.map((comment) =>
        comment.id === commentId ? { ...comment, xPercent, yPercent } : comment,
      ),
    );
  }, []);

  const handleMoveLinkedComment = useCallback(
    ({ shapeId, strokeId, dx, dy }: { shapeId?: string; strokeId?: string; dx: number; dy: number }) => {
      const linkKey = shapeId ? `shape:${shapeId}` : strokeId ? `stroke:${strokeId}` : '';
      if (!linkKey) return;

      let commentId: string | undefined;

      if (shapeId) {
        const shape = shapes.find((item) => item.id === shapeId);
        commentId =
          shape?.commentId ??
          comments.find((comment) => comment.linkedShapeId === shapeId)?.id;

        if (commentId && shape && !shape.commentId) {
          setShapes((prev) =>
            prev.map((item) => (item.id === shapeId ? { ...item, commentId } : item)),
          );
        }
      }

      if (strokeId) {
        const stroke = drawings.find((item) => item.id === strokeId);
        commentId =
          stroke?.commentId ??
          comments.find((comment) => comment.linkedDrawingId === strokeId)?.id;

        if (commentId && stroke && !stroke.commentId) {
          setDrawings((prev) =>
            prev.map((item) => (item.id === strokeId ? { ...item, commentId } : item)),
          );
        }
      }

      const dragOrigin = linkedCommentDragOriginRef.current;
      if (!dragOrigin || dragOrigin.linkKey !== linkKey) {
        const comment = commentId ? comments.find((item) => item.id === commentId) : undefined;
        linkedCommentDragOriginRef.current = {
          linkKey,
          comment: comment
            ? { id: comment.id, xPercent: comment.xPercent, yPercent: comment.yPercent }
            : undefined,
          draft:
            draftComment &&
              ((shapeId && draftComment.linkedShapeId === shapeId) ||
                (strokeId && draftComment.linkedDrawingId === strokeId))
              ? { xPercent: draftComment.xPercent, yPercent: draftComment.yPercent }
              : undefined,
        };
      }

      const origin = linkedCommentDragOriginRef.current;

      if (commentId && origin?.comment?.id === commentId) {
        setComments((prev) =>
          prev.map((comment) =>
            comment.id === commentId
              ? {
                ...comment,
                xPercent: clampPercent(origin.comment!.xPercent + dx),
                yPercent: clampPercent(origin.comment!.yPercent + dy),
              }
              : comment,
          ),
        );
      }

      if (origin?.draft) {
        setDraftComment((prev) => {
          if (!prev) return prev;
          if (shapeId && prev.linkedShapeId !== shapeId) return prev;
          if (strokeId && prev.linkedDrawingId !== strokeId) return prev;

          return {
            ...prev,
            xPercent: clampPercent(origin.draft!.xPercent + dx),
            yPercent: clampPercent(origin.draft!.yPercent + dy),
          };
        });
      }
    },
    [comments, draftComment, drawings, shapes],
  );

  const handleUndo = useCallback(() => {
    const previous = undo(getAnnotationSnapshot());
    if (previous) {
      applyAnnotationSnapshot(previous);
    }
  }, [applyAnnotationSnapshot, getAnnotationSnapshot, undo]);

  const handleRedo = useCallback(() => {
    const next = redo(getAnnotationSnapshot());
    if (next) {
      applyAnnotationSnapshot(next);
    }
  }, [applyAnnotationSnapshot, getAnnotationSnapshot, redo]);

  const canClearAnnotations = useMemo(
    () => hasAnnotationContent(getAnnotationSnapshot()),
    [getAnnotationSnapshot],
  );

  const showClearIsland = canClearAnnotations;

  const headerMetadataItems = useMemo(() => {
    if (!item) return [];

    const items: string[] = [];

    const qualityLabel = getVideoQualityLabel(
      videoTechnicalDetails.width,
      videoTechnicalDetails.height,
    );
    if (qualityLabel) {
      items.push(qualityLabel);
    }

    items.push(videoTechnicalDetails.frameRate ?? item.frameRate ?? '—');

    const duration = videoTechnicalDetails.duration || item.duration;
    if (duration) {
      items.push(duration);
    }

    items.push(formatFileSize(item.sizeBytes));

    return items;
  }, [item, videoTechnicalDetails]);

  const handleOpenTechnicalDetails = useCallback(() => {
    setHistoryOpen(true);
    setDrawerTab('details');
    setDetailsSection('technical');
  }, []);

  const timelineFallbackDuration = useMemo(
    () => parseMediaDurationLabel(item?.duration),
    [item?.duration],
  );

  const canSeeAnnotation = useCallback(
    (ann: { visibility?: AnnotationVisibility; groupId?: string; author?: any }) => {
      if (ann.visibility === 'private') {
        const authorName = ann.author?.name;
        if (authorName && authorName !== activeUser.name) return false;
      }
      if (ann.visibility === 'group' && ann.groupId) {
        const group = annotationGroups.find((g) => g.id === ann.groupId);
        if (group) {
          const authorName = ann.author?.name;
          const isAuthor = authorName && authorName === activeUser.name;
          const isMember = user?.id && group.memberIds.includes(user.id);
          if (!isAuthor && !isMember) {
            return false;
          }
        }
      }
      return true;
    },
    [activeUser.name, annotationGroups, user],
  );

  const timelineItems = useMemo(
    () =>
      buildTimelineItems({
        comments: comments.filter(canSeeAnnotation),
        drawings: drawings.filter(canSeeAnnotation),
        shapes: shapes.filter(canSeeAnnotation),
        stamps: stamps.filter(canSeeAnnotation),
        history: history.filter(canSeeAnnotation),
        customStamp,
      }),
    [comments, customStamp, drawings, history, shapes, stamps, canSeeAnnotation],
  );

  const handleAnnotationRangeChange = useCallback(
    (id: string, type: TimelineAnnotationType, startTime: number, endTime: number) => {
      handleAnnotationActionStart();
      const rangePatch = {
        videoTimestamp: startTime,
        endTimestamp: endTime,
      };

      switch (type) {
        case 'comment':
          setComments((prev) =>
            prev.map((comment) => (comment.id === id ? { ...comment, ...rangePatch } : comment)),
          );
          break;
        case 'drawing':
          setDrawings((prev) =>
            prev.map((drawing) => (drawing.id === id ? { ...drawing, ...rangePatch } : drawing)),
          );
          setComments((prev) =>
            prev.map((comment) =>
              comment.linkedDrawingId === id
                ? { ...comment, ...rangePatch }
                : comment
            )
          );
          break;
        case 'shape':
          setShapes((prev) =>
            prev.map((shape) => (shape.id === id ? { ...shape, ...rangePatch } : shape)),
          );
          setComments((prev) =>
            prev.map((comment) =>
              comment.linkedShapeId === id
                ? { ...comment, ...rangePatch }
                : comment
            )
          );
          break;
        case 'stamp':
          setStamps((prev) =>
            prev.map((stamp) => (stamp.id === id ? { ...stamp, ...rangePatch } : stamp)),
          );
          // Stamps don't currently have linked comments, but just in case we add it:
          break;
      }

      setHistory((prev) =>
        prev.map((entry) => {
          let matches = false;
          if (type === 'comment' && entry.id === id) matches = true;
          if (type === 'drawing' && entry.id.includes(id)) matches = true;
          if (type === 'shape' && entry.id.includes(id)) matches = true;
          if (type === 'stamp' && entry.id.includes(id)) matches = true;

          if (matches) {
            return { ...entry, videoTimestamp: startTime };
          }
          return entry;
        })
      );
    },
    [handleAnnotationActionStart],
  );

  const canWorkspaceZoomOut = workspaceZoom > WORKSPACE_ZOOM_MIN;
  const canWorkspaceZoomIn = workspaceZoom < WORKSPACE_ZOOM_MAX;
  const canWorkspaceZoomReset = !isWorkspaceZoomDefault(workspaceZoom);
  const workspaceZoomLabel = formatWorkspaceZoomLabel(workspaceZoom);

  const handleWorkspaceZoomOut = useCallback(() => {
    setWorkspaceZoom((current) => stepWorkspaceZoom(current, 'out'));
  }, []);

  const handleWorkspaceZoomIn = useCallback(() => {
    setWorkspaceZoom((current) => stepWorkspaceZoom(current, 'in'));
  }, []);

  const handleWorkspaceZoomReset = useCallback(() => {
    setWorkspaceZoom(WORKSPACE_ZOOM_DEFAULT);
  }, []);

  const handleOpenClearAnnotationsModal = useCallback(() => {
    if (!hasAnnotationContent(getAnnotationSnapshot())) return;
    setClearAnnotationsModalOpen(true);
  }, [getAnnotationSnapshot]);

  const handleConfirmClearAnnotations = useCallback(() => {
    const snapshot = getAnnotationSnapshot();
    pushSnapshot(snapshot);
    applyAnnotationSnapshot(EMPTY_ANNOTATION_SNAPSHOT);
    setClearAnnotationsModalOpen(false);
  }, [applyAnnotationSnapshot, getAnnotationSnapshot, pushSnapshot]);

  useEffect(() => {
    savePinnedPlayerTools(pinnedPlayerTools);
  }, [pinnedPlayerTools]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (shouldBlockAnnotationShortcuts(event.target)) return;

      if (matchesKeyboardShortcut(event, undoShortcut)) {
        event.preventDefault();
        handleUndo();
        return;
      }

      if (matchesKeyboardShortcut(event, redoShortcut)) {
        event.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRedo, handleUndo, redoShortcut, undoShortcut]);

  useEffect(() => {
    const element = videoRef.current;
    if (!element) return;

    element.loop = playerLoop;

    let rafId: number;
    let isVideoPlaying = false;

    const enforceLoop = () => {
      if (
        playerRangeEnabled &&
        playerInPoint != null &&
        playerOutPoint != null &&
        playerOutPoint > playerInPoint &&
        element.currentTime >= playerOutPoint
      ) {
        element.currentTime = playerInPoint;
      }
    };

    const tick = () => {
      enforceLoop();
      if (isVideoPlaying) {
        rafId = requestAnimationFrame(tick);
      }
    };

    const handlePlay = () => {
      isVideoPlaying = true;
      tick();
    };

    const handlePause = () => {
      isVideoPlaying = false;
      cancelAnimationFrame(rafId);
      enforceLoop();
    };

    const handleSeek = () => {
      enforceLoop();
    };

    element.addEventListener('play', handlePlay);
    element.addEventListener('pause', handlePause);
    element.addEventListener('seeked', handleSeek);
    element.addEventListener('timeupdate', handleSeek);

    if (!element.paused && !element.ended) {
      handlePlay();
    } else {
      enforceLoop();
    }

    return () => {
      isVideoPlaying = false;
      cancelAnimationFrame(rafId);
      element.removeEventListener('play', handlePlay);
      element.removeEventListener('pause', handlePause);
      element.removeEventListener('seeked', handleSeek);
      element.removeEventListener('timeupdate', handleSeek);
    };
  }, [playerInPoint, playerOutPoint, playerLoop, playerRangeEnabled]);

  const handleReadTimecode = useCallback(() => {
    const time = getVideoTimestamp();
    setStatusToast({
      open: true,
      message: `Timecode ${formatVideoTimestamp(time)}`,
      variant: 'resolved',
    });
  }, [getVideoTimestamp]);

  const resolvedOverlayEntryIds = useMemo(
    () => buildResolvedOverlayEntryIds(history),
    [history],
  );

  const playerToolsViewState = useMemo(
    () => ({
      loop: playerLoop,
      flipHorizontal: playerFlipHorizontal,
      flipVertical: playerFlipVertical,
      rotationSteps: playerRotationSteps,
      inPoint: playerInPoint,
      outPoint: playerOutPoint,
      rangeEnabled: playerRangeEnabled,
      actualMediaSize: playerActualMediaSize,
      playerBackground,
      showAudioMeter: playerShowAudioMeter,
    }),
    [
      playerActualMediaSize,
      playerBackground,
      playerFlipHorizontal,
      playerFlipVertical,
      playerInPoint,
      playerLoop,
      playerOutPoint,
      playerRangeEnabled,
      playerRotationSteps,
      playerShowAudioMeter,
    ],
  );

  const playerToolHandlers = useMemo<PlayerToolHandlers>(
    () => ({
      onToggleLoop: () => setPlayerLoop((current) => !current),
      onToggleFlip: () => setPlayerFlipHorizontal((current) => !current),
      onToggleFlop: () => setPlayerFlipVertical((current) => !current),
      onRotateLeft: () => setPlayerRotationSteps((current) => (current + 3) % 4),
      onRotateRight: () => setPlayerRotationSteps((current) => (current + 1) % 4),
      onSetInPoint: () => setPlayerInPoint(getVideoTimestamp()),
      onSetOutPoint: () => setPlayerOutPoint(getVideoTimestamp()),
      onReadTimecode: handleReadTimecode,
      onToggleRange: () => setPlayerRangeEnabled((current) => !current),
      onToggleAudioMeter: () => setPlayerShowAudioMeter((current) => !current),
      onToggleActualMediaSize: () => setPlayerActualMediaSize((current) => !current),
      onPlayerBackgroundChange: setPlayerBackground,
    }),
    [getVideoTimestamp, handleReadTimecode],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (shouldBlockAnnotationShortcuts(event.target)) return;

      const toolId = getPlayerToolIdFromEvent(event, playerToolShortcuts);
      if (!toolId) return;

      if (runPlayerToolAction(toolId, playerToolHandlers, playerToolsViewState)) {
        event.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playerToolHandlers, playerToolShortcuts, playerToolsViewState]);

  const appendHistoryEntry = useCallback(
    (
      entry: {
        type: AnnotationHistoryType;
        summary: string;
        detail?: string;
        videoTimestamp: number;
        sourceCommentId?: string;
      },
      entryId?: string,
    ) => {
      setHistory((current) => {
        const id = entryId ?? crypto.randomUUID();
        if (current.some((item) => item.id === id)) return current;

        const nextIndex =
          current.length > 0 ? Math.max(...current.map((item) => item.index)) + 1 : 1;

        return [
          ...current,
          {
            id,
            index: nextIndex,
            type: entry.type,
            author: {
              name: activeUser.name,
              avatarUrl: activeUser.avatarUrl,
              initials: activeUser.initials,
            },
            createdAt: Date.now(),
            videoTimestamp: entry.videoTimestamp,
            summary: entry.summary,
            detail: entry.detail,
            resolved: false,
            unread: false,
            sourceCommentId: entry.sourceCommentId,
            visibility: DEFAULT_ANNOTATION_VISIBILITY,
          },
        ];
      });
    },
    [],
  );

  useEffect(() => {
    const processRawAnnotations = (annotationsList: any[], containerId: string) => {
      const mapAnnotationData = <T extends any>(a: any): T => {
        const rawTs = a.videoTimestamp !== undefined && a.videoTimestamp !== null ? a.videoTimestamp : a.data?.videoTimestamp;
        const numTs = typeof rawTs === 'number' ? rawTs : (rawTs ? Number(rawTs) : 0);
        return {
          ...a.data,
          id: a.data?.id || a.id,
          dbId: a.id,
          videoTimestamp: Number.isNaN(numTs) ? 0 : numTs,
          resolved: a.resolved ?? a.data?.resolved,
          author: a.author ?? a.data?.author ?? {
            name: a.guestName ? (a.guestEmail ? `${a.guestName} (${a.guestEmail})` : a.guestName) : (a.guestEmail || 'Guest User'),
            initials: ((a.guestName || a.guestEmail || 'G')[0] || 'G').toUpperCase(),
          },
          userId: a.userId,
          createdAt: a.createdAt,
          text: a.data?.text || a.text || '',
          replies: a.data?.replies || [],
          pinned: a.pinned ?? a.data?.pinned ?? false,
          erasedAt: a.data?.erasedAt,
          erasedBy: a.data?.erasedBy,
        } as T;
      };

      const commentsData = annotationsList.filter(a => a.type === 'comment').map(a => mapAnnotationData<VideoComment>(a));
      const shapesData = annotationsList.filter(a => a.type === 'shape').map(a => mapAnnotationData<VideoShape>(a));
      const drawingsData = annotationsList.filter(a => a.type === 'drawing').map(a => mapAnnotationData<VideoDrawingStroke>(a));
      const stampsData = annotationsList.filter(a => a.type === 'stamp').map(a => mapAnnotationData<VideoStamp>(a));

      setComments(commentsData);
      setShapes(shapesData);
      setDrawings(drawingsData);
      setStamps(stampsData);

      prevCommentsRef.current = commentsData;
      prevShapesRef.current = shapesData;
      prevDrawingsRef.current = drawingsData;
      prevStampsRef.current = stampsData;

      const readIds = new Set<string>();
      try {
        const stored = localStorage.getItem(`read_annotations_${containerId}`);
        if (stored) JSON.parse(stored).forEach((id: string) => readIds.add(id));
      } catch { }

      const getAuthor = (ann: any) => ann.author || ann.data?.author || {
        name: ann.guestName ? (ann.guestEmail ? `${ann.guestName} (${ann.guestEmail})` : ann.guestName) : (ann.guestEmail || activeUser.name || 'Guest User'),
        avatarUrl: activeUser.avatarUrl,
        initials: ((ann.guestName || ann.guestEmail || activeUser.initials || 'G')[0] || 'G').toUpperCase()
      };
      const checkUnread = (ann: any, entryId: string) => {
        if (!ann.userId || !user?.id) return false;
        return ann.userId !== user.id && !readIds.has(entryId);
      };

      const newHistory: AnnotationHistoryEntry[] = [];
      let index = 1;

      annotationsList.forEach(ann => {
        const createdAt = new Date(ann.createdAt).getTime();

        if (ann.type === 'comment') {
          const c = mapAnnotationData<VideoComment>(ann);
          const entryId = `comment-${c.id}`;
          newHistory.push({
            id: entryId,
            index: index++,
            type: 'comment',
            author: getAuthor(ann),
            createdAt,
            videoTimestamp: c.videoTimestamp ?? 0,
            summary: 'Comment added',
            detail: c.text,
            resolved: ann.resolved || c.resolved || false,
            resolvedAt: c.resolvedAt,
            resolvedBy: c.resolvedBy,
            unread: checkUnread(ann, entryId),
            sourceCommentId: c.id,
            replyCount: c.replies?.length || 0,
            visibility: c.visibility ?? DEFAULT_ANNOTATION_VISIBILITY,
            groupId: c.groupId,
            linkedDrawingId: c.linkedDrawingId,
            linkedShapeId: c.linkedShapeId,
            pinned: c.pinned ?? false,
            erasedAt: c.erasedAt,
            erasedBy: c.erasedBy,
          });
        } else if (ann.type === 'shape') {
          const s = mapAnnotationData<VideoShape>(ann);
          const entryId = getShapeHistoryEntryId(s.id);
          newHistory.push({
            id: entryId,
            index: index++,
            type: 'shape',
            author: getAuthor(ann),
            createdAt,
            videoTimestamp: s.videoTimestamp ?? 0,
            summary: shapeSummary(s.type),
            resolved: ann.resolved || false,
            unread: checkUnread(ann, entryId),
            pinned: s.pinned ?? false,
            erasedAt: s.erasedAt,
            erasedBy: s.erasedBy,
          });
        } else if (ann.type === 'drawing') {
          const d = mapAnnotationData<VideoDrawingStroke>(ann);
          const entryId = getDrawingHistoryEntryId(d.id);
          const summaryStr = d.tool === 'highlighter' ? 'Highlighter stroke added' : d.tool === 'grid' ? 'Grid line added' : d.tool === 'eraser' ? 'Drawing erased' : 'Drawing added';
          newHistory.push({
            id: entryId,
            index: index++,
            type: 'drawing',
            author: getAuthor(ann),
            createdAt,
            videoTimestamp: d.videoTimestamp ?? 0,
            summary: summaryStr,
            resolved: ann.resolved || false,
            unread: checkUnread(ann, entryId),
            pinned: d.pinned ?? false,
            erasedAt: d.erasedAt,
            erasedBy: d.erasedBy,
          });
        } else if (ann.type === 'stamp') {
          const st = mapAnnotationData<VideoStamp>(ann);
          const entryId = getStampHistoryEntryId(st.id);
          newHistory.push({
            id: entryId,
            index: index++,
            type: 'stamp',
            author: getAuthor(ann),
            createdAt,
            videoTimestamp: st.videoTimestamp ?? 0,
            summary: getStampSummary(st.stampId, customStamp, st.customEmoji),
            resolved: ann.resolved || false,
            unread: checkUnread(ann, entryId),
            pinned: st.pinned ?? false,
            erasedAt: st.erasedAt,
            erasedBy: st.erasedBy,
          });
        }
      });

      const mergedHistory = mergeLinkedAnnotationHistory(newHistory, commentsData);
      mergedHistory.sort((a, b) => a.videoTimestamp - b.videoTimestamp);
      mergedHistory.forEach((h, i) => h.index = i + 1);

      setHistory(mergedHistory);
      setInitialLoadComplete(true);
    };

    if (isGuestMode && shareToken) {
      const loadGuestApiAnnotations = async () => {
        try {
          const res = await getShareAnnotationsApi(shareToken);
          const list = Array.isArray(res) ? res : (res && (res as any).data ? (res as any).data : []);
          if (list) {
            processRawAnnotations(list, shareToken);
          } else {
            setInitialLoadComplete(true);
          }
        } catch {
          setInitialLoadComplete(true);
        }
      };
      void loadGuestApiAnnotations();
      return;
    }

    if (!mediaId) return;

    const loadApiAnnotations = async () => {
      try {
        const { annotations } = await getMediaAnnotationsRequest(mediaId);
        if (annotations) {
          processRawAnnotations(annotations, mediaId);
        } else {
          setInitialLoadComplete(true);
        }
      } catch (err) {
        console.error('Failed to load annotations from API', err);
        setInitialLoadComplete(true);
      }
    };

    loadApiAnnotations();
  }, [mediaId, syncTrigger, isGuestMode, shareToken]);

  // Reset tools and UI state only when navigating to a new media asset
  useEffect(() => {
    setDraftComment(null);
    setActiveTool('select');
    resetStacks();
    setWorkspaceZoom(WORKSPACE_ZOOM_DEFAULT);
  }, [mediaId, resetStacks]);



  useEffect(() => {
    saveCustomStamp(customStamp);
  }, [customStamp]);

  useEffect(() => {
    if (!mediaId) return;
    // History is now built from API response directly, bypassing localStorage to support multi-device syncing.
  }, [mediaId, history]);

  useEffect(() => {
    if (!mediaId) {
      setShareLinks([]);
      return;
    }
    fetchShareLinks(mediaId).then((links) => {
      setShareLinks(links || []);
    });
  }, [mediaId]);

  useEffect(() => {
    if (!mediaId) {
      setCollaborators([]);
      return;
    }
    const fetchOrgUsers = async () => {
      try {
        const [users, overrides] = await Promise.all([
          fetchOrganizationUsers(),
          getAssetAccessOverrides(mediaId).catch(() => [])
        ]);

        if (users && users.length > 0) {
          const activeUsers = users.filter((u) => u.status?.toLowerCase() === 'active');
          const mapped: MediaCollaborator[] = activeUsers.map((u) => {
            const displayName = u.name || u.email.split('@')[0] || 'User';
            const initials = displayName
              .split(/\s+/)
              .filter(Boolean)
              .slice(0, 2)
              .map((part) => part[0]?.toUpperCase() ?? '')
              .join('') || u.email[0]?.toUpperCase() || 'U';

            // Check if there is an explicit role override for this asset
            const override = overrides.find((o) => o.userId === u.id);
            let finalRole = u.role || u.roleRelation?.name;

            if (override && override.accessLevel) {
              if (override.accessLevel === 'Can edit') {
                finalRole = 'Editor';
              } else if (override.accessLevel === 'Can view') {
                finalRole = 'Viewer';
              } else if (override.accessLevel === 'Full Access') {
                finalRole = 'Admin';
              }
            }

            return {
              id: u.id,
              name: displayName,
              email: u.email,
              initials,
              isCurrentUser: u.email === user?.email,
              hasOverride: !!override,
              role: finalRole,
            };
          });
          setCollaborators(mapped);
        } else {
          setCollaborators(loadMediaCollaborators(mediaId));
        }
      } catch (err) {
        console.error('Failed to fetch organization users for collaborators:', err);
        setCollaborators(loadMediaCollaborators(mediaId));
      }
    };
    fetchOrgUsers();
  }, [mediaId, user?.email]);

  useEffect(() => {
    if (!mediaId) return;
    saveMediaCollaborators(mediaId, collaborators);
  }, [collaborators, mediaId]);

  useEffect(() => {
    if (!mediaId) {
      setAnnotationGroups([]);
      return;
    }

    getAnnotationGroupsRequest(mediaId).then((res) => {
      if (Array.isArray(res)) {
        setAnnotationGroups(res);
      }
    }).catch(console.error);
  }, [mediaId]);

  useEffect(() => {
    if (!item) return;
    const previousTitle = document.title;
    document.title = `${item.title} | NOAH`;
    return () => {
      document.title = previousTitle;
    };
  }, [item]);

  useEffect(() => {
    if (!item || item.type !== 'video') return;

    const video = videoRef.current;
    if (!video) return;

    const syncMetadata = () => {
      const stream = extractVideoStreamMetadata(video, item);
      const quality = extractPlaybackQualityMetadata(video);

      setVideoTechnicalDetails((current: any) => ({
        ...current,
        ...stream,
        ...quality,
        frameRate: current.frameRate || (current.fps ? `${current.fps} fps` : undefined) || stream.frameRate,
        videoCodec: current.videoCodec || current.codec || stream.videoCodec,
        containerFormat: current.containerFormat || current.container || stream.containerFormat,
        createdAt: item.createdAt,
        storageProvider: current.storageProvider || current.storage || item.storageProvider,
        uploadedBy: item.uploadedBy ?? activeUser.name,
        uploadedAt: item.createdAt,
        originallyCreatedAt: current.originallyCreatedAt || current.originallyCreated || item.originallyCreatedAt,
        exif: current.exif || undefined,
      }));
    };

    const syncPlaybackQuality = () => {
      const quality = extractPlaybackQualityMetadata(video);
      if (!quality.decodedFrames && !quality.droppedFrames) return;

      setVideoTechnicalDetails((current) => {
        if (
          current.decodedFrames === quality.decodedFrames &&
          current.droppedFrames === quality.droppedFrames
        ) {
          return current;
        }
        return {
          ...current,
          ...quality,
        };
      });
    };

    const handleLoadedMetadata = () => {
      syncMetadata();
    };

    const handleResize = () => {
      const stream = extractVideoStreamMetadata(video, item);
      setVideoTechnicalDetails((current) => {
        if (current.displayResolution === stream.displayResolution) return current;
        return {
          ...current,
          displayResolution: stream.displayResolution,
        };
      });
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('resize', handleResize);
    video.addEventListener('timeupdate', syncPlaybackQuality);

    if (video.readyState >= 1) {
      syncMetadata();
    }

    const stopFrameRateMeasurement = startFrameRateMeasurement(video, (frameRate) => {
      setVideoTechnicalDetails((current) => {
        if (current.frameRate === frameRate) return current;
        return {
          ...current,
          frameRate,
        };
      });
    });

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('resize', handleResize);
      video.removeEventListener('timeupdate', syncPlaybackQuality);
      stopFrameRateMeasurement();
    };
  }, [item, mediaId]);

  useEffect(() => {
    if (!item || item.type !== 'video') return;

    const video = videoRef.current;
    if (!video) return;

    const timestampParam = new URLSearchParams(window.location.search).get('t');
    if (!timestampParam) return;

    const seconds = Number(timestampParam);
    if (Number.isNaN(seconds)) return;

    const seekToParam = () => {
      video.currentTime = seconds;
      video.pause();
    };

    if (video.readyState >= 1) {
      seekToParam();
      return;
    }

    video.addEventListener('loadedmetadata', seekToParam, { once: true });
    return () => video.removeEventListener('loadedmetadata', seekToParam);
  }, [item, mediaId]);

  const handleToolChange = useCallback((tool: AnnotationTool) => {
    setActiveTool(tool);
    if (tool !== 'comment') {
      setDraftComment((current) => (current?.linkedAnnotationKind ? current : null));
    }
  }, []);

  const handleAddCustomStamp = useCallback((emoji: string) => {
    const stamp = createOrUpdateCustomStamp(emoji);
    setCustomStamp(stamp);
    setActiveStamp(stamp.id);
  }, []);

  const handlePlaceDraft = useCallback((position: { xPercent: number; yPercent: number }) => {
    setDraftComment({
      ...position,
      text: '',
    });
  }, []);

  const handleDraftTextChange = useCallback((text: string) => {
    setDraftComment((current) => (current ? { ...current, text } : current));
  }, []);

  const handleDraftImageChange = useCallback((imageUrl: string | null) => {
    setDraftComment((current) =>
      current
        ? {
          ...current,
          imageUrl: imageUrl ?? undefined,
        }
        : current,
    );
  }, []);

  const handleSubmitDraft = useCallback(() => {
    if (!draftComment) return;
    if (draftComment.linkedAnnotationKind) {
      if (!draftComment.text.trim()) return;
    } else if (!draftComment.text.trim() && !draftComment.imageUrl) {
      return;
    }

    pushSnapshot(getAnnotationSnapshot());
    const videoTimestamp = draftComment.linkedVideoTimestamp ?? getVideoTimestamp();
    const commentId = crypto.randomUUID();
    const commentText = draftComment.text.trim();

    setComments((prev) => [
      ...prev,
      {
        id: commentId,
        xPercent: draftComment.xPercent,
        yPercent: draftComment.yPercent,
        text: commentText,
        imageUrl: draftComment.imageUrl,
        createdAt: Date.now(),
        videoTimestamp,
        endTimestamp: createDefaultAnnotationEndTime(videoTimestamp),
        author: {
          name: activeUser.name,
          avatarUrl: activeUser.avatarUrl,
          initials: activeUser.initials,
        },
        replies: [],
        linkedDrawingId: draftComment.linkedDrawingId,
        linkedShapeId: draftComment.linkedShapeId,
      },
    ]);

    if (draftComment.linkedDrawingId) {
      setDrawings((prev) =>
        prev.map((stroke) =>
          stroke.id === draftComment.linkedDrawingId ? { ...stroke, commentId } : stroke,
        ),
      );
    }

    if (draftComment.linkedShapeId) {
      setShapes((prev) =>
        prev.map((shape) =>
          shape.id === draftComment.linkedShapeId ? { ...shape, commentId } : shape,
        ),
      );
    }

    if (draftComment.linkedDrawingId || draftComment.linkedShapeId) {
      const linkedEntryId = draftComment.linkedDrawingId
        ? getDrawingHistoryEntryId(draftComment.linkedDrawingId)
        : getShapeHistoryEntryId(draftComment.linkedShapeId!);

      setHistory((current) =>
        current.map((entry) =>
          entry.id === linkedEntryId
            ? {
              ...entry,
              detail: commentText,
              sourceCommentId: commentId,
              linkedDrawingId: draftComment.linkedDrawingId,
              linkedShapeId: draftComment.linkedShapeId,
            }
            : entry,
        ),
      );
    } else {
      appendHistoryEntry(
        {
          type: 'comment',
          summary: 'Comment added',
          detail: commentText || 'Image attached',
          videoTimestamp,
          sourceCommentId: commentId,
        },
        `comment-${commentId}`,
      );
    }

    setDraftComment(null);
  }, [appendHistoryEntry, draftComment, getAnnotationSnapshot, getVideoTimestamp, pushSnapshot]);

  const handleCancelDraft = useCallback(() => {
    if (!draftComment) return;

    if (draftComment.linkedDrawingId) {
      pushSnapshot(getAnnotationSnapshot());
      const drawingEntryId = getDrawingHistoryEntryId(draftComment.linkedDrawingId);
      setDrawings((prev) =>
        prev.filter((stroke) => stroke.id !== draftComment.linkedDrawingId),
      );
      setHistory((current) => current.filter((entry) => entry.id !== drawingEntryId));
    }

    if (draftComment.linkedShapeId) {
      pushSnapshot(getAnnotationSnapshot());
      const shapeEntryId = getShapeHistoryEntryId(draftComment.linkedShapeId);
      setShapes((prev) => prev.filter((shape) => shape.id !== draftComment.linkedShapeId));
      setHistory((current) => current.filter((entry) => entry.id !== shapeEntryId));
    }

    setDraftComment(null);
  }, [draftComment, getAnnotationSnapshot, pushSnapshot]);

  const handleAnnotationNeedsComment = useCallback((request: AnnotationCommentPromptRequest) => {
    setDraftComment({
      xPercent: request.xPercent,
      yPercent: request.yPercent,
      text: '',
      linkedAnnotationKind: request.kind,
      linkedDrawingId: request.kind === 'drawing' ? request.id : undefined,
      linkedShapeId: request.kind === 'shape' ? request.id : undefined,
      linkedVideoTimestamp: request.videoTimestamp,
    });
  }, []);

  const annotationCommentPending = Boolean(draftComment?.linkedAnnotationKind);

  const handleAddReply = useCallback((commentId: string, text: string, imageUrl?: string) => {
    const parent = comments.find((comment) => comment.id === commentId);
    if (parent?.resolved) return;
    if (!text.trim() && !imageUrl) return;

    pushSnapshot(getAnnotationSnapshot());
    const replyId = crypto.randomUUID();

    setComments((prev) =>
      prev.map((comment) =>
        comment.id === commentId
          ? {
            ...comment,
            replies: [
              ...comment.replies,
              {
                id: replyId,
                text: text.trim(),
                imageUrl,
                createdAt: Date.now(),
                author: {
                  name: activeUser.name,
                  avatarUrl: activeUser.avatarUrl,
                  initials: activeUser.initials,
                },
              },
            ],
          }
          : comment,
      ),
    );

    setHistory((current) =>
      current.map((entry) =>
        entry.sourceCommentId === commentId
          ? { ...entry, replyCount: (entry.replyCount ?? 0) + 1 }
          : entry,
      ),
    );
  }, [comments, getAnnotationSnapshot, pushSnapshot]);

  const syncEditedCommentHistory = useCallback(
    (commentId: string, text: string) => {
      setHistory((current) =>
        current.map((entry) => {
          if (entry.sourceCommentId !== commentId && entry.id !== `comment-${commentId}`) {
            return entry;
          }

          return {
            ...entry,
            detail: text,
          };
        }),
      );
    },
    [],
  );

  const handleEditComment = useCallback(
    (commentId: string, text: string, imageUrl?: string) => {
      if (!text.trim() && !imageUrl) return;

      pushSnapshot(getAnnotationSnapshot());
      const trimmedText = text.trim();

      setComments((prev) =>
        prev.map((comment) =>
          comment.id === commentId
            ? {
              ...comment,
              text: trimmedText,
              imageUrl,
            }
            : comment,
        ),
      );

      syncEditedCommentHistory(commentId, trimmedText);
    },
    [getAnnotationSnapshot, pushSnapshot, syncEditedCommentHistory],
  );

  const handleEditReply = useCallback(
    (commentId: string, replyId: string, text: string, imageUrl?: string) => {
      if (!text.trim() && !imageUrl) return;

      pushSnapshot(getAnnotationSnapshot());

      setComments((prev) =>
        prev.map((comment) =>
          comment.id === commentId
            ? {
              ...comment,
              replies: comment.replies.map((reply) =>
                reply.id === replyId
                  ? {
                    ...reply,
                    text: text.trim(),
                    imageUrl,
                  }
                  : reply,
              ),
            }
            : comment,
        ),
      );
    },
    [getAnnotationSnapshot, pushSnapshot],
  );

  const handleAnnotationRecord = useCallback(
    (record: AnnotationSurfaceRecord) => {
      const timestampSecond = Math.floor(record.videoTimestamp);
      const drawingEntryId = `drawing-${timestampSecond}`;
      const actor = {
        name: activeUser.name,
        avatarUrl: activeUser.avatarUrl,
        initials: activeUser.initials,
      };

      if (record.type === 'drawing' && record.markDrawingErased) {
        const targetEntryId = record.strokeId
          ? getDrawingHistoryEntryId(record.strokeId)
          : drawingEntryId;

        setHistory((current) =>
          current.map((entry) => {
            if (entry.id !== targetEntryId) return entry;

            return {
              ...entry,
              erasedAt: Date.now(),
              erasedBy: actor,
            };
          }),
        );

        // Cascade delete any comment attached to this drawing
        if (record.strokeId) {
          setComments((prev) => prev.filter(c => c.linkedDrawingId !== record.strokeId));
        }
        return;
      }

      if (record.type === 'drawing') {
        const strokeEntryId = record.drawingId
          ? getDrawingHistoryEntryId(record.drawingId)
          : drawingEntryId;

        setHistory((current) => {
          const existing = current.find((entry) => entry.id === strokeEntryId);

          if (existing) {
            if (existing.erasedAt) {
              return current.map((entry) =>
                entry.id === strokeEntryId
                  ? {
                    ...entry,
                    author: actor,
                    createdAt: Date.now(),
                    erasedAt: undefined,
                    erasedBy: undefined,
                  }
                  : entry,
              );
            }

            return current;
          }

          const nextIndex =
            current.length > 0 ? Math.max(...current.map((item) => item.index)) + 1 : 1;

          return [
            ...current,
            {
              id: strokeEntryId,
              index: nextIndex,
              type: 'drawing' as const,
              author: actor,
              createdAt: Date.now(),
              videoTimestamp: record.videoTimestamp,
              summary: record.summary,
              detail: record.detail,
              resolved: false,
              unread: false,
            },
          ];
        });
        return;
      }

      if (record.type === 'shape' && record.shapeId) {
        const shapeEntryId = `shape-${record.shapeId}`;

        if (record.markShapeDeleted) {
          setHistory((current) =>
            current.map((entry) => {
              if (entry.id !== shapeEntryId) return entry;

              return {
                ...entry,
                erasedAt: Date.now(),
                erasedBy: actor,
              };
            }),
          );

          // Cascade delete any comment attached to this shape
          setComments((prev) => prev.filter(c => c.linkedShapeId !== record.shapeId));
          return;
        }

        appendHistoryEntry(
          {
            type: 'shape',
            summary: record.summary,
            detail: record.detail,
            videoTimestamp: record.videoTimestamp,
          },
          shapeEntryId,
        );
        return;
      }

      if (record.type === 'stamp' && record.videoStampId) {
        const stampEntryId = `stamp-${record.videoStampId}`;

        if (record.markStampDeleted) {
          setHistory((current) =>
            current.map((entry) => {
              if (entry.id !== stampEntryId) return entry;

              return {
                ...entry,
                erasedAt: Date.now(),
                erasedBy: actor,
              };
            }),
          );
          return;
        }

        appendHistoryEntry(
          {
            type: 'stamp',
            summary: record.summary,
            detail: record.detail,
            videoTimestamp: record.videoTimestamp,
          },
          stampEntryId,
        );
        return;
      }

      appendHistoryEntry({
        type: record.type,
        summary: record.summary,
        detail: record.detail,
        videoTimestamp: record.videoTimestamp,
      });
    },
    [appendHistoryEntry],
  );

  const handleSeekToTimestamp = useCallback((timestamp: number, entryId?: string) => {
    if (videoRef.current) {
      // Add a tiny 50ms offset to guarantee we land inside the annotation's visibility window, 
      // avoiding floating point rounding errors that put the playhead just before the annotation starts.
      videoRef.current.currentTime = timestamp + 0.05;
      videoRef.current.pause();
    }

    if (entryId && mediaId) {
      setHistory(prev => {
        const changed = prev.some(h => h.id === entryId && h.unread);
        if (!changed) return prev;

        const readIds = new Set<string>();
        try {
          const stored = localStorage.getItem(`read_annotations_${mediaId}`);
          if (stored) JSON.parse(stored).forEach((id: string) => readIds.add(id));
        } catch { }

        readIds.add(entryId);
        localStorage.setItem(`read_annotations_${mediaId}`, JSON.stringify(Array.from(readIds)));

        return prev.map(h => h.id === entryId ? { ...h, unread: false } : h);
      });
    }
  }, [mediaId]);

  const handleTagsChange = useCallback(
    async (tags: string[]) => {
      if (!item) return;
      updateMediaTags(item.id, tags);
      if (fetchedItem) {
        setFetchedItem((prev) => (prev ? { ...prev, tags } : prev));
      }
      try {
        await updateAssetTagsRequest(item.id, tags);
      } catch (err) {
        console.error("Failed to update asset tags in backend database:", err);
      }
    },
    [item, updateMediaTags, fetchedItem],
  );

  const applyActiveShareLink = useCallback((link: ShareLink) => {
    setActiveShareLinkId(link.id);
    setShareInviteVisibility(link.visibility);
  }, []);

  const handleOpenShareDialog = useCallback(async () => {
    if (!item || !mediaId) return;

    if (shareLinks.length > 0) {
      const activeLink = shareLinks.find((link) => link.id === activeShareLinkId) ?? shareLinks[0];
      applyActiveShareLink(activeLink);
    }

    setShareTeamMembers(collaboratorsToTeamMembers(collaborators));
    setShareDialogOpen(true);
  }, [
    activeShareLinkId,
    applyActiveShareLink,
    collaborators,
    item,
    mediaId,
    shareLinks,
  ]);

  const handleNewShareLink = useCallback(
    async ({ name, visibility }: { name: string; visibility: ProjectVisibility }) => {
      if (!item || !mediaId) return;

      const defaultName = slugifyShareLinkName(getMediaFileName(item));
      const finalName =
        name.trim() || `${defaultName}${shareLinks.length > 0 ? `-${shareLinks.length + 1}` : ''}`;

      const newLink = await createShareLinkAsync(mediaId, { name: finalName, visibility });
      if (newLink) {
        const nextLinks = await fetchShareLinks(mediaId);
        setShareLinks(nextLinks);
        applyActiveShareLink(newLink);
        setFocusLinkNameCounter((current) => current + 1);
      }
    },
    [applyActiveShareLink, item, mediaId, shareLinks],
  );

  const handleShareLinkNameChange = useCallback(
    async (linkId: string, name: string) => {
      if (!mediaId) return;
      await updateShareLinkAsync(linkId, { name });
      const nextLinks = await fetchShareLinks(mediaId);
      setShareLinks(nextLinks);
    },
    [mediaId],
  );

  const handleShareLinkPermissionsChange = useCallback(
    async (linkId: string, permissions: any) => {
      if (!mediaId) return;
      await updateShareLinkAsync(linkId, { permissions });
      const nextLinks = await fetchShareLinks(mediaId);
      setShareLinks(nextLinks);
    },
    [mediaId],
  );

  const handleShareLinkCopy = useCallback((_link: ShareLink) => {
    setStatusToast({
      open: true,
      message: 'Share link copied to clipboard',
      variant: 'resolved',
    });
  }, []);

  const handleShareLinkSettingsSaved = useCallback(() => {
    setStatusToast({
      open: true,
      message: 'Share link settings saved',
      variant: 'resolved',
    });
  }, []);

  const handleShareLinkSelect = useCallback(
    (link: ShareLink) => {
      applyActiveShareLink(link);
    },
    [applyActiveShareLink],
  );

  const handleShareLinkDelete = useCallback(
    async (link: ShareLink) => {
      if (!mediaId) return;
      const success = await revokeShareLinkAsync(link.id);
      if (success) {
        const next = await fetchShareLinks(mediaId);
        setShareLinks(next);

        if (activeShareLinkId === link.id) {
          const fallback = next[0];
          if (fallback) {
            applyActiveShareLink(fallback);
          } else {
            setActiveShareLinkId(null);
          }
        }

        setStatusToast({
          open: true,
          message: `Share link "${link.name}" deleted`,
          variant: 'reopen',
        });
      }
    },
    [activeShareLinkId, applyActiveShareLink, mediaId],
  );

  const updateCommentResolved = useCallback((commentId: string, nextResolved: boolean) => {
    const timestamp = Date.now();
    const actor = {
      name: activeUser.name,
      avatarUrl: activeUser.avatarUrl,
      initials: activeUser.initials,
    };

    setComments((current) =>
      current.map((comment) => {
        if (comment.id !== commentId) return comment;

        if (nextResolved) {
          return {
            ...comment,
            resolved: true,
            resolvedAt: timestamp,
            resolvedBy: actor,
            reopenedAt: undefined,
            reopenedBy: undefined,
          };
        }

        return {
          ...comment,
          resolved: false,
          resolvedAt: undefined,
          resolvedBy: undefined,
          reopenedAt: timestamp,
          reopenedBy: actor,
        };
      }),
    );

    setHistory((current) =>
      current.map((entry) => {
        if (entry.sourceCommentId !== commentId) return entry;

        if (nextResolved) {
          return {
            ...entry,
            resolved: true,
            resolvedAt: timestamp,
            resolvedBy: actor,
            reopenedAt: undefined,
            reopenedBy: undefined,
          };
        }

        return {
          ...entry,
          resolved: false,
          resolvedAt: undefined,
          resolvedBy: undefined,
          reopenedAt: timestamp,
          reopenedBy: actor,
        };
      }),
    );

    setStatusToast({
      open: true,
      message: nextResolved ? 'Resolved' : 'Reopened',
      variant: nextResolved ? 'resolved' : 'reopen',
    });
  }, []);

  const handleToggleResolved = useCallback(
    (entryId: string) => {
      const entry = history.find((item) => item.id === entryId);
      if (!entry) return;

      if (entry.sourceCommentId) {
        updateCommentResolved(entry.sourceCommentId, !entry.resolved);
        updateMediaAnnotationRequest(entry.sourceCommentId, { resolved: !entry.resolved }).catch(console.error);

        // Also update linked drawing/shape if it exists
        const nextResolved = !entry.resolved;
        if (entry.linkedDrawingId) {
          setDrawings((prev) => prev.map(d => d.id === entry.linkedDrawingId ? { ...d, resolved: nextResolved } : d));
          updateMediaAnnotationRequest(entry.linkedDrawingId, { resolved: nextResolved }).catch(console.error);
        } else if (entry.linkedShapeId) {
          setShapes((prev) => prev.map(s => s.id === entry.linkedShapeId ? { ...s, resolved: nextResolved } : s));
          updateMediaAnnotationRequest(entry.linkedShapeId, { resolved: nextResolved }).catch(console.error);
        }
        return;
      }

      const nextResolved = !entry.resolved;

      setHistory((current) =>
        current.map((item) => {
          if (item.id !== entryId) return item;

          if (item.resolved) {
            return {
              ...item,
              resolved: false,
              resolvedAt: undefined,
              resolvedBy: undefined,
            };
          }

          const resolvedAt = Date.now();
          return {
            ...item,
            resolved: true,
            resolvedAt,
            resolvedBy: {
              name: activeUser.name,
              avatarUrl: activeUser.avatarUrl,
              initials: activeUser.initials,
            },
          };
        }),
      );

      let targetId: string | undefined = undefined;
      if (entry.id.startsWith('shape-')) {
        targetId = entry.id.replace('shape-', '');
        setShapes((prev) => prev.map(s => s.id === targetId ? { ...s, resolved: nextResolved } : s));
      } else if (entry.id.startsWith('drawing-')) {
        targetId = entry.id.replace('drawing-', '');
        setDrawings((prev) => prev.map(d => d.id === targetId ? { ...d, resolved: nextResolved } : d));
      } else if (entry.id.startsWith('stamp-')) {
        targetId = entry.id.replace('stamp-', '');
        setStamps((prev) => prev.map(s => s.id === targetId ? { ...s, resolved: nextResolved } : s));
      }

      if (targetId) {
        updateMediaAnnotationRequest(targetId, { resolved: nextResolved }).catch(console.error);
      }

      if (nextResolved) {
        setStatusToast({ open: true, message: 'Resolved', variant: 'resolved' });
      } else {
        setStatusToast({ open: true, message: 'Reopened', variant: 'reopen' });
      }
    },
    [history, updateCommentResolved],
  );

  const handleTogglePinned = useCallback(
    (entryId: string) => {
      setHistory((current) => {
        const entry = current.find((item) => item.id === entryId);
        if (!entry) return current;

        const nextPinned = !entry.pinned;

        let targetId = entry.sourceCommentId;
        if (!targetId) {
          if (entry.id.startsWith('shape-')) targetId = entry.id.replace('shape-', '');
          else if (entry.id.startsWith('drawing-')) targetId = entry.id.replace('drawing-', '');
          else if (entry.id.startsWith('stamp-')) targetId = entry.id.replace('stamp-', '');
          else if (entry.id.startsWith('comment-')) targetId = entry.id.replace('comment-', '');
        }

        if (targetId) {
          if (entry.type === 'comment' || entry.type === 'reply') {
            setComments((prev) => {
              const updated = prev.map(c => c.id === targetId ? { ...c, pinned: nextPinned } : c);
              const c = updated.find(c => c.id === targetId);
              if (c) updateMediaAnnotationRequest(c.id, { data: c }).catch(console.error);
              return updated;
            });
          } else if (entry.type === 'shape') {
            setShapes((prev) => {
              const updated = prev.map(s => s.id === targetId ? { ...s, pinned: nextPinned } : s);
              const s = updated.find(s => s.id === targetId);
              if (s) updateMediaAnnotationRequest(s.id, { data: s }).catch(console.error);
              return updated;
            });
          } else if (entry.type === 'drawing') {
            setDrawings((prev) => {
              const updated = prev.map(d => d.id === targetId ? { ...d, pinned: nextPinned } : d);
              const d = updated.find(d => d.id === targetId);
              if (d) updateMediaAnnotationRequest(d.id, { data: d }).catch(console.error);
              return updated;
            });
          } else if (entry.type === 'stamp') {
            setStamps((prev) => {
              const updated = prev.map(s => s.id === targetId ? { ...s, pinned: nextPinned } : s);
              const s = updated.find(s => s.id === targetId);
              if (s) updateMediaAnnotationRequest(s.id, { data: s }).catch(console.error);
              return updated;
            });
          }
        }

        return current.map((item) =>
          item.id === entryId ? { ...item, pinned: nextPinned } : item
        );
      });
    },
    [],
  );

  const handleToggleCommentResolved = useCallback(
    (commentId: string) => {
      const comment = comments.find((item) => item.id === commentId);
      if (!comment) return;
      const nextResolved = !comment.resolved;
      updateCommentResolved(commentId, nextResolved);
      updateMediaAnnotationRequest(commentId, { resolved: nextResolved }).catch(console.error);

      if (comment.linkedDrawingId) {
        setDrawings((prev) => prev.map(d => d.id === comment.linkedDrawingId ? { ...d, resolved: nextResolved } : d));
        updateMediaAnnotationRequest(comment.linkedDrawingId, { resolved: nextResolved }).catch(console.error);
      } else if (comment.linkedShapeId) {
        setShapes((prev) => prev.map(s => s.id === comment.linkedShapeId ? { ...s, resolved: nextResolved } : s));
        updateMediaAnnotationRequest(comment.linkedShapeId, { resolved: nextResolved }).catch(console.error);
      }
    },
    [comments, updateCommentResolved],
  );

  const handleMarkUnread = useCallback((entryId: string) => {
    setHistory((current) =>
      current.map((entry) =>
        entry.id === entryId ? { ...entry, unread: true } : entry,
      ),
    );
  }, []);

  const handleCreateAnnotationGroup = useCallback(async (name: string, memberIds: string[]) => {
    if (!mediaId) return;
    try {
      const res = await createAnnotationGroupRequest(mediaId, name, memberIds);
      if (res && res.id) {
        setAnnotationGroups((current) => [...current, res]);
        return res;
      }
    } catch (err) {
      console.error('Failed to create annotation group', err);
    }
    return null;
  }, [mediaId]);

  const handleDeleteAnnotationGroup = useCallback(async (groupId: string) => {
    if (!mediaId) return;
    try {
      await deleteAnnotationGroupRequest(mediaId, groupId);
      setAnnotationGroups((current) => current.filter((g) => g.id !== groupId));
      setHistory((current) =>
        current.map(entry => {
          if (entry.visibility === 'group' && entry.groupId === groupId) {
            return {
              ...entry,
              visibility: 'private' as const,
              groupId: undefined,
            };
          }
          return entry;
        })
      );
    } catch (err) {
      console.error('Failed to delete annotation group', err);
    }
  }, [mediaId]);

  const handleUpdateAnnotationGroup = useCallback(async (groupId: string, name: string, memberIds: string[]) => {
    if (!mediaId) return null;
    try {
      const res = await updateAnnotationGroupRequest(mediaId, groupId, name, memberIds);
      if (res && res.id) {
        setAnnotationGroups((current) =>
          current.map(g => g.id === groupId ? res : g)
        );
        return res;
      }
    } catch (err) {
      console.error('Failed to update annotation group', err);
    }
    return null;
  }, [mediaId]);

  const handleAddCollaboratorForGroup = useCallback(
    (name: string, email: string) => {
      const normalizedEmail = email.trim().toLowerCase();
      const existing = collaborators.find(
        (person) => person.email.toLowerCase() === normalizedEmail,
      );
      if (existing) return existing;

      const collaborator = createCollaboratorFromInvite(name, email);
      setCollaborators((current) => [...current, collaborator]);
      return collaborator;
    },
    [collaborators],
  );

  const handleShareInviteMember = useCallback(
    (payload: WorkspaceInvitePayload) => {
      const email = payload.email?.toLowerCase();
      if (!email) return false;

      const existingMember = shareTeamMembers.find(m => m.email?.toLowerCase() === email);

      if (existingMember) {
        if (existingMember.hasOverride || existingMember.isCurrentUser) {
          return false; // Already a member with direct access
        }

        // Update in state
        setShareTeamMembers(current =>
          current.map(m => m.id === existingMember.id ? { ...m, hasOverride: true, access: payload.access } : m)
        );

        // Update collaborators state to match
        setCollaborators(current =>
          current.map(c => c.id === existingMember.id ? { ...c, hasOverride: true, role: payload.access === 'Can edit' ? 'Editor' : 'Viewer' } : c)
        );

        // Call backend
        if (mediaId) {
          updateAssetAccessOverride(mediaId, existingMember.id, payload.access).catch(err => {
            console.error("Failed to add override", err);
          });
        }

        setStatusToast({
          open: true,
          message: `Invite sent to ${existingMember.name}`,
          variant: 'resolved',
        });
        return true;
      }

      // Fallback for mock groups or totally external people
      const activeMembers = shareTeamMembers.filter(m => m.hasOverride || m.isCurrentUser);
      const newMember = resolveWorkspaceInvite(payload, activeMembers);
      if (!newMember) return false;

      setShareTeamMembers((current) => [...current, { ...newMember, hasOverride: true }]);
      if (newMember.memberType !== 'Group' && newMember.email) {
        setCollaborators((current) => [
          ...current,
          createCollaboratorFromInvite(newMember.name, newMember.email as string),
        ]);
      }
      setStatusToast({
        open: true,
        message:
          newMember.memberType === 'Group'
            ? `${newMember.name} group added`
            : `Invite sent to ${newMember.name}`,
        variant: 'resolved',
      });
      return true;
    },
    [shareTeamMembers, mediaId],
  );

  const handleShareUpdateMemberAccess = useCallback(
    async (memberId: string, access: WorkspaceMemberAccess) => {
      setShareTeamMembers((current) =>
        current.map((member) => (member.id === memberId ? { ...member, access } : member)),
      );

      if (!mediaId) return;

      try {
        await updateAssetAccessOverride(mediaId, memberId, access);
        setStatusToast({
          open: true,
          message: `Access updated for member`,
          variant: 'resolved',
        });
      } catch (err: any) {
        console.error('Failed to update asset access override:', err);
        setStatusToast({
          open: true,
          message: err.message || 'Failed to update access. Only the video owner can do this.',
          variant: 'error',
        });
      }
    },
    [mediaId],
  );

  const handleShareRemoveMember = useCallback(
    async (memberId: string) => {
      setShareTeamMembers((current) => {
        const removed = current.find((member) => member.id === memberId);
        if (removed?.email) {
          setCollaborators((collaborators) =>
            collaborators.filter(
              (collaborator) =>
                collaborator.email.toLowerCase() !== removed.email?.toLowerCase(),
            ),
          );
        }
        return current.filter((member) => member.id !== memberId);
      });

      if (!mediaId) return;

      try {
        await removeAssetAccessOverride(mediaId, memberId);
        setStatusToast({
          open: true,
          message: 'Member removed from project',
          variant: 'reopen',
        });
      } catch (err: any) {
        console.error('Failed to remove asset access override:', err);
        setStatusToast({
          open: true,
          message: err.message || 'Failed to remove access. Only the video owner can do this.',
          variant: 'error',
        });
      }
    },
    [mediaId],
  );

  const handleShareVisibilityChange = useCallback(
    (visibility: ProjectVisibility) => {
      setShareInviteVisibility(visibility);
    },
    [],
  );

  const applyAnnotationVisibility = useCallback(
    (visibility: AnnotationVisibility, groupId?: string) => ({
      visibility,
      groupId: visibility === 'group' ? groupId : undefined,
    }),
    [],
  );

  const handleEntryVisibilityChange = useCallback(
    (entryId: string, visibility: AnnotationVisibility, groupId?: string) => {
      const visibilityPatch = applyAnnotationVisibility(visibility, groupId);

      setHistory((current) =>
        current.map((entry) =>
          entry.id === entryId ? { ...entry, ...visibilityPatch } : entry,
        ),
      );

      const entry = history.find((item) => item.id === entryId);
      if (entry?.sourceCommentId) {
        setComments((current) =>
          current.map((comment) =>
            comment.id === entry.sourceCommentId
              ? { ...comment, ...visibilityPatch }
              : comment,
          ),
        );
      }
    },
    [applyAnnotationVisibility, history],
  );

  const handleCommentVisibilityChange = useCallback(
    (commentId: string, visibility: AnnotationVisibility, groupId?: string) => {
      const visibilityPatch = applyAnnotationVisibility(visibility, groupId);

      setComments((current) =>
        current.map((comment) =>
          comment.id === commentId ? { ...comment, ...visibilityPatch } : comment,
        ),
      );

      setHistory((current) =>
        current.map((entry) =>
          entry.sourceCommentId === commentId ? { ...entry, ...visibilityPatch } : entry,
        ),
      );
    },
    [applyAnnotationVisibility],
  );

  const handleCopyLink = useCallback((entry: AnnotationHistoryEntry) => {
    const url = new URL(window.location.href);
    url.searchParams.set('t', String(Math.floor(entry.videoTimestamp)));
    void navigator.clipboard.writeText(url.toString());
  }, []);

  const handleMarkCommentUnread = useCallback((commentId: string) => {
    handleMarkUnread(`comment-${commentId}`);
  }, [handleMarkUnread]);

  const handleCopyCommentLink = useCallback((comment: VideoComment) => {
    const url = new URL(window.location.href);
    url.searchParams.set('t', String(Math.floor(comment.videoTimestamp)));
    void navigator.clipboard.writeText(url.toString());
  }, []);

  const handleDeleteEntry = useCallback(
    (entryId: string) => {
      const entry = history.find((item) => item.id === entryId);
      if (!entry) return;

      pushSnapshot(getAnnotationSnapshot());

      const erasedBy = { name: activeUser.name, avatarUrl: activeUser.avatarUrl, initials: activeUser.initials };

      if (entry.sourceCommentId) {
        setComments((prev) =>
          prev.map((comment) => comment.id === entry.sourceCommentId ? { ...comment, erasedAt: Date.now(), erasedBy } : comment),
        );
      }

      const linkedDrawingId =
        entry.linkedDrawingId ??
        (entry.id.startsWith('drawing-') ? entry.id.slice('drawing-'.length) : undefined);
      const linkedShapeId =
        entry.linkedShapeId ??
        (entry.id.startsWith('shape-') ? entry.id.slice('shape-'.length) : undefined);
      const linkedStampId =
        entry.id.startsWith('stamp-') ? entry.id.slice('stamp-'.length) : undefined;

      if (linkedDrawingId) {
        setDrawings((prev) => prev.map((stroke) => stroke.id === linkedDrawingId ? { ...stroke, erasedAt: Date.now(), erasedBy } : stroke));
      }

      if (linkedShapeId) {
        setShapes((prev) => prev.map((shape) => shape.id === linkedShapeId ? { ...shape, erasedAt: Date.now(), erasedBy } : shape));
      }

      if (linkedStampId) {
        setStamps((prev) => prev.map((stamp) => stamp.id === linkedStampId ? { ...stamp, erasedAt: Date.now(), erasedBy } : stamp));
      }

      setHistory((current) => current.map((item) => item.id === entryId ? { ...item, erasedAt: Date.now(), erasedBy } : item));
    },
    [getAnnotationSnapshot, history, pushSnapshot, activeUser],
  );

  const handleHardDeleteEntry = useCallback(
    (entryId: string) => {
      const entry = history.find((item) => item.id === entryId);
      if (!entry) return;

      pushSnapshot(getAnnotationSnapshot());

      if (entry.sourceCommentId) {
        setComments((prev) => prev.filter((comment) => comment.id !== entry.sourceCommentId));
      }

      const linkedDrawingId =
        entry.linkedDrawingId ??
        (entry.id.startsWith('drawing-') ? entry.id.slice('drawing-'.length) : undefined);
      const linkedShapeId =
        entry.linkedShapeId ??
        (entry.id.startsWith('shape-') ? entry.id.slice('shape-'.length) : undefined);
      const linkedStampId =
        entry.id.startsWith('stamp-') ? entry.id.slice('stamp-'.length) : undefined;

      if (linkedDrawingId) {
        setDrawings((prev) => prev.filter((stroke) => stroke.id !== linkedDrawingId));
      }

      if (linkedShapeId) {
        setShapes((prev) => prev.filter((shape) => shape.id !== linkedShapeId));
      }

      if (linkedStampId) {
        setStamps((prev) => prev.filter((stamp) => stamp.id !== linkedStampId));
      }

      setHistory((current) => current.filter((item) => item.id !== entryId));
    },
    [getAnnotationSnapshot, history, pushSnapshot],
  );

  const handleRestoreEntry = useCallback(
    (entryId: string) => {
      const entry = history.find((item) => item.id === entryId);
      if (!entry) return;

      pushSnapshot(getAnnotationSnapshot());

      if (entry.sourceCommentId) {
        setComments((prev) =>
          prev.map((comment) => comment.id === entry.sourceCommentId ? { ...comment, erasedAt: undefined, erasedBy: undefined } : comment),
        );
      }

      const linkedDrawingId =
        entry.linkedDrawingId ??
        (entry.id.startsWith('drawing-') ? entry.id.slice('drawing-'.length) : undefined);
      const linkedShapeId =
        entry.linkedShapeId ??
        (entry.id.startsWith('shape-') ? entry.id.slice('shape-'.length) : undefined);
      const linkedStampId =
        entry.id.startsWith('stamp-') ? entry.id.slice('stamp-'.length) : undefined;

      if (linkedDrawingId) {
        setDrawings((prev) => prev.map((stroke) => stroke.id === linkedDrawingId ? { ...stroke, erasedAt: undefined, erasedBy: undefined } : stroke));
      }

      if (linkedShapeId) {
        setShapes((prev) => prev.map((shape) => shape.id === linkedShapeId ? { ...shape, erasedAt: undefined, erasedBy: undefined } : shape));
      }

      if (linkedStampId) {
        setStamps((prev) => prev.map((stamp) => stamp.id === linkedStampId ? { ...stamp, erasedAt: undefined, erasedBy: undefined } : stamp));
      }

      setHistory((current) => current.map((item) => item.id === entryId ? { ...item, erasedAt: undefined, erasedBy: undefined } : item));
    },
    [getAnnotationSnapshot, history, pushSnapshot],
  );

  const handleDeleteComment = useCallback(
    (commentId: string) => {
      handleDeleteEntry(`comment-${commentId}`);
    },
    [handleDeleteEntry],
  );

  const [liveAssetStatus, setLiveAssetStatus] = useState<string | null>(null);
  const [liveProgress, setLiveProgress] = useState<string | null>(null);
  const [videoSrcVersion, setVideoSrcVersion] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetryTranscode = async () => {
    if (!mediaId || isRetrying) return;
    setIsRetrying(true);
    try {
      await retryTranscodeRequest(mediaId);
      setStatusToast({
        open: true,
        message: 'Processing retried successfully. Check back shortly.',
        variant: 'resolved',
      });
      setLiveAssetStatus('queued');
    } catch (err: any) {
      console.error('Failed to retry transcode:', err);
      // ApiError (fetch) uses `details`, Axios uses `response.data`. 
      // Also ignore generic 'Request failed with status 400' if a better error exists.
      const backendError =
        err?.details?.error ||
        err?.details?.message ||
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        (err?.message && !err.message.includes('status 400') ? err.message : null);

      setStatusToast({
        open: true,
        message: backendError || 'Failed to retry processing. Please try again.',
        variant: 'error',
      });
    } finally {
      setIsRetrying(false);
    }
  };

  useEffect(() => {
    setLiveAssetStatus(item?.compressionStatus ?? null);
    setLiveProgress((item?.customMetadata?.transcodingProgress as string) || null);
    setVideoSrcVersion(0);
  }, [item?.id, item?.compressionStatus, item?.customMetadata?.transcodingProgress]);

  useEffect(() => {
    if (!mediaId || !liveAssetStatus) return;
    if (liveAssetStatus === 'completed' || liveAssetStatus === 'failed' || liveAssetStatus === 'ready') return;

    const interval = setInterval(async () => {
      try {
        const asset = await getMediaAssetByIdRequest(mediaId);
        const currentStatus = asset.compressionStatus ?? 'completed';
        setLiveAssetStatus(currentStatus);

        if (asset.customMetadata?.transcodingProgress) {
          setLiveProgress(asset.customMetadata.transcodingProgress as string);
        }

        if (currentStatus === 'completed' || currentStatus === 'ready' || currentStatus === 'failed') {
          setVideoSrcVersion((v) => v + 1);
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Failed to poll media asset status:', err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [mediaId, liveAssetStatus]);

  const clientTargetSrc = item?.type === 'image'
    ? (item.url || item.thumbnail || (item.id ? `/api/media/${encodeURIComponent(item.id)}/stream` : ''))
    : '';

  useEffect(() => {
    setClientDecodedUrl(null);
    setIsDecodingImage(false);

    if (!item || item.type !== 'image' || !clientTargetSrc) return;

    const ext = (item.title || item.name || '').split('.').pop()?.toLowerCase() || '';
    const nonWeb = ['psd', 'psb', 'bmp', 'tiff', 'tif', 'exr', 'openexr', 'dpx', 'cin', 'pcx', 'ai', 'eps'].includes(ext);

    if (!nonWeb) return;

    let isMounted = true;
    setIsDecodingImage(true);

    decodeClientImageToDataUrl(clientTargetSrc, ext)
      .then((decodedDataUrl) => {
        if (isMounted) {
          setIsDecodingImage(false);
          if (decodedDataUrl) {
            setClientDecodedUrl(decodedDataUrl);
          }
        }
      })
      .catch(() => {
        if (isMounted) setIsDecodingImage(false);
      });

    return () => {
      isMounted = false;
    };
  }, [item?.id, item?.title, item?.type, clientTargetSrc]);

  if (isFetching) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100%', backgroundColor: cv.videoStage }}>
        <Typography sx={{ color: cv.textInverse }}>Loading video...</Typography>
      </Box>
    );
  }

  if (fetchError || !item) {
    return <Navigate to="/home" replace />;
  }

  if (item.type !== 'video' && item.type !== 'audio' && item.type !== 'image' && item.type !== 'document') {
    return <Navigate to="/home" replace />;
  }

  const isProcessing =
    liveAssetStatus === 'processing' ||
    liveAssetStatus === 'queued' ||
    liveAssetStatus === 'in_progress';

  const baseSrc = isGuestMode && shareToken
    ? `/api/share/${shareToken}/stream`
    : item.type === 'image'
      ? (item.url || item.thumbnail || (item.id ? `/api/media/${encodeURIComponent(item.id)}/stream` : ''))
      : item.type === 'audio'
        ? (item.videoSrc || item.url || (item.id ? `/api/media/${encodeURIComponent(item.id)}/stream` : ''))
        : (item.videoSrc || item.url || (item.id ? `/api/media/${encodeURIComponent(item.id)}/stream` : SAMPLE_VIDEO_SRC));
  // Audio/original is available immediately; only blank video while proxy is processing.
  const shouldBlockMediaSrc = isProcessing && item.type === 'video';
  const videoSrc = shouldBlockMediaSrc || !baseSrc
    ? ''
    : `${baseSrc}${baseSrc.includes('?') ? '&' : '?'}v=${videoSrcVersion}`;
  const mediaElementSrc = shouldBlockMediaSrc ? undefined : (videoSrc || undefined);
  const surfaceEnabled = SURFACE_TOOLS.includes(activeTool);

  return (
    <Box
      sx={{
        position: 'relative',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: cv.bg,
        overflow: 'hidden',
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: 'fixed',
          inset: 0,
          backgroundImage: `radial-gradient(circle, ${cv.gridDot} 1px, transparent 1px)`,
          backgroundSize: '22px 22px',
          pointerEvents: 'none',
        }}
      />

      <Box
        sx={{
          position: 'absolute',
          top: '-20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '70%',
          height: '45%',
          background: cv.brandGradient,
          filter: 'blur(120px)',
          opacity: 0.12,
          pointerEvents: 'none',
        }}
      />

      <Box
        component="header"
        sx={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: { xs: 1, sm: 2 },
          px: { xs: 2, sm: 3 },
          height: DASHBOARD_TOP_BAR_HEIGHT,
          minHeight: DASHBOARD_TOP_BAR_HEIGHT,
          maxHeight: DASHBOARD_TOP_BAR_HEIGHT,
          boxSizing: 'border-box',
          borderBottom: DASHBOARD_TOP_BAR_BORDER,
          background: 'var(--noah-header-background)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 1, sm: 1.5 },
            minWidth: 0,
            height: '100%',
            zIndex: 1,
          }}
        >
          <Tooltip title="Back to dashboard" arrow placement="bottom">
            <IconButton
              aria-label="Back to dashboard"
              onClick={() => {
                if (window.history.length > 1) {
                  navigate(-1);
                } else {
                  navigate('/home');
                }
              }}
              sx={{
                flexShrink: 0,
                color: cv.textSecondary,
                border: "1px solid var(--noah-border)",
                '&:hover': { color: cv.textPrimary, backgroundColor: cv.surfaceHover },
              }}
            >
              <ArrowBackOutlinedIcon />
            </IconButton>
          </Tooltip>
          <NoahLogo
            to="/home"
            width={{ xs: HEADER_LOGO_WIDTH, [SIDEBAR_DESKTOP_BREAKPOINT]: 108 }}
            animated={false}
            showGlow={false}
            align="left"
            sx={{ mb: 0, flexShrink: 0, display: 'flex', alignItems: 'center' }}
          />
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              alignSelf: 'center',
              gap: 0.5,
              minWidth: 0,
              height: '100%',
              pl: { xs: 0.5, sm: 1.5 },
              ml: { sm: 0.5 },
              borderLeft: { xs: 'none', sm: `1px solid ${cv.border}` },
            }}
          >
            <TruncatedText
              variant="h6"
              component="span"
              text={item.title}
              sx={{
                fontWeight: 600,
                fontSize: { xs: '1.25rem', md: '1.5rem' },
                lineHeight: 1,
                color: cv.textPrimary,
              }}
            />
            {!isGuestMode ? (
              <Tooltip
                title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                placement="bottom"
              >
                <IconButton
                  type="button"
                  size="small"
                  aria-label={
                    isFavorite ? 'Remove from favorites' : 'Add to favorites'
                  }
                  aria-pressed={isFavorite}
                  onClick={() => toggleFavorite(item.id)}
                  sx={{
                    width: 32,
                    height: 32,
                    flexShrink: 0,
                    color: isFavorite ? cv.warning : cv.textMuted,
                    '&:hover': {
                      color: isFavorite ? cv.warning : cv.textPrimary,
                      backgroundColor: cv.surfaceHover,
                    },
                  }}
                >
                  {isFavorite ? (
                    <StarIcon sx={{ fontSize: 18 }} />
                  ) : (
                    <StarBorderOutlinedIcon sx={{ fontSize: 18 }} />
                  )}
                </IconButton>
              </Tooltip>
            ) : null}
          </Box>
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flexShrink: 0,
            height: '100%',
            ml: 'auto',
            zIndex: 1,
          }}
        >
          <Box
            component="span"
            sx={{
              display: { xs: 'none', lg: 'inline-flex' },
              alignItems: 'center',
              gap: 1,
              px: 1.5,
              py: 0.5,
              mr: 0.5,
              borderRadius: '999px',
              border: `1px solid ${cv.border}`,
              backgroundColor: 'transparent',
              lineHeight: 1,
              maxWidth: 'min(42vw, 560px)',
            }}
          >
            {item ? (
              <Box
                component={mediaTypeHeaderIcons[item.type]}
                aria-label={mediaTypeLabels[item.type]}
                sx={{
                  fontSize: 18,
                  color: cv.textSecondary,
                  flexShrink: 0,
                }}
              />
            ) : null}
            {headerMetadataItems.map((label, index) => (
              <Box
                key={`${label}-${index}`}
                sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, minWidth: 0 }}
              >
                <Box
                  component="span"
                  aria-hidden
                  sx={{
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    backgroundColor: cv.textMuted,
                    flexShrink: 0,
                  }}
                />
                <Typography
                  component="span"
                  noWrap
                  sx={{
                    fontSize: { lg: '0.9375rem', xl: '1rem' },
                    fontWeight: 500,
                    color: cv.textMuted,
                    letterSpacing: '0.01em',
                  }}
                >
                  {label}
                </Typography>
              </Box>
            ))}
            <Box
              component="span"
              aria-hidden
              sx={{
                width: 4,
                height: 4,
                borderRadius: '50%',
                backgroundColor: cv.textMuted,
                flexShrink: 0,
              }}
            />
            <Tooltip title="View technical details" placement="bottom">
              <IconButton
                type="button"
                size="small"
                aria-label="View technical details"
                onClick={handleOpenTechnicalDetails}
                sx={{
                  width: 24,
                  height: 24,
                  flexShrink: 0,
                  p: 0,
                  color: cv.textMuted,
                  '&:hover': {
                    color: cv.textPrimary,
                    backgroundColor: cv.surfaceHover,
                  },
                }}
              >
                <InfoOutlinedIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          </Box>

          {isGuestMode ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {(guestPermissions.download || guestPermissions.downloadProxy) && shareToken ? (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<FileDownloadOutlinedIcon />}
                  component="a"
                  href={`/api/share/${shareToken}/stream?download=true`}
                  download
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: '10px',
                    background: cv.brandGradient,
                    color: '#fff',
                    minHeight: 36,
                    px: 2,
                  }}
                >
                  Download
                </Button>
              ) : null}
            </Box>
          ) : (
            <>
              {item?.id && (
                <Tooltip
                  title={
                    canDownloadOriginal
                      ? "Download original file"
                      : "Viewer role does not have permission to download"
                  }
                  arrow
                  placement="bottom"
                >
                  <Box sx={{ display: 'inline-flex' }}>
                    <IconButton
                      component={canDownloadOriginal ? 'a' : 'button'}
                      href={canDownloadOriginal ? `/api/media/${encodeURIComponent(item.id)}/download?raw=true` : undefined}
                      download={canDownloadOriginal ? true : undefined}
                      disabled={!canDownloadOriginal}
                      size="small"
                      aria-label="Download original file"
                      sx={{
                        display: { xs: 'inline-flex', lg: 'none' },
                        width: 36,
                        height: 36,
                        borderRadius: '10px',
                        color: canDownloadOriginal ? cv.textPrimary : cv.textMuted,
                        border: `1px solid ${cv.borderSubtle}`,
                        backgroundColor: cv.surfaceBackground,
                        '&:hover': canDownloadOriginal
                          ? {
                            backgroundColor: cv.surfaceHover,
                            borderColor: cv.borderFocus,
                          }
                          : {},
                        '&.Mui-disabled': {
                          opacity: 0.5,
                          color: cv.textMuted,
                        },
                      }}
                    >
                      <FileDownloadOutlinedIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                    <Button
                      component={canDownloadOriginal ? 'a' : 'button'}
                      href={canDownloadOriginal ? `/api/media/${encodeURIComponent(item.id)}/download?raw=true` : undefined}
                      download={canDownloadOriginal ? true : undefined}
                      disabled={!canDownloadOriginal}
                      size="small"
                      variant="outlined"
                      startIcon={<FileDownloadOutlinedIcon sx={{ fontSize: 16 }} />}
                      sx={{
                        display: { xs: 'none', lg: 'inline-flex' },
                        minHeight: 36,
                        height: 36,
                        py: 0,
                        px: 1.5,
                        borderRadius: '10px',
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '0.8125rem',
                        letterSpacing: '0.01em',
                        color: canDownloadOriginal ? cv.textPrimary : cv.textMuted,
                        borderColor: cv.borderSubtle,
                        backgroundColor: cv.surfaceBackground,
                        '&:hover': canDownloadOriginal
                          ? {
                            backgroundColor: cv.surfaceHover,
                            borderColor: cv.borderFocus,
                          }
                          : {},
                        '&.Mui-disabled': {
                          opacity: 0.5,
                          color: cv.textMuted,
                          borderColor: cv.borderSubtle,
                        },
                      }}
                    >
                      Download Original
                    </Button>
                  </Box>
                </Tooltip>
              )}

              <PeopleCollaboratorsPopover
                collaborators={collaborators}
                onCollaboratorsChange={setCollaborators}
                onInvited={(name) =>
                  setStatusToast({
                    open: true,
                    message: `Invite sent to ${name}`,
                    variant: 'resolved',
                  })
                }
              />

              {!isSharedWithUser && (
                <Tooltip title="Share video" arrow placement="bottom">
                  <Box sx={{ display: 'inline-flex' }}>
                    <IconButton
                      type="button"
                      size="small"
                      aria-haspopup="dialog"
                      aria-expanded={shareDialogOpen}
                      aria-label="Share video"
                      onClick={handleOpenShareDialog}
                      sx={{
                        display: { xs: 'inline-flex', lg: 'none' },
                        width: 36,
                        height: 36,
                        borderRadius: '10px',
                        color: cv.textPrimary,
                        background: cv.brandGradient,
                        boxShadow: cv.brandShadowSoft,
                        '&:hover': {
                          background: cv.brandGradient,
                          filter: 'brightness(1.08)',
                        },
                      }}
                    >
                      <ShareOutlinedIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                    <Button
                      type="button"
                      size="small"
                      variant="contained"
                      aria-haspopup="dialog"
                      aria-expanded={shareDialogOpen}
                      startIcon={<ShareOutlinedIcon sx={{ fontSize: 16 }} />}
                      onClick={handleOpenShareDialog}
                      sx={{
                        display: { xs: 'none', lg: 'inline-flex' },
                        minHeight: 36,
                        height: 36,
                        py: 0,
                        px: 1.5,
                        borderRadius: '10px',
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '0.8125rem',
                        letterSpacing: '0.01em',
                        color: cv.textPrimary,
                        background: cv.brandGradient,
                        boxShadow: cv.brandShadowSoft,
                        '&:hover': {
                          background: cv.brandGradient,
                          filter: 'brightness(1.08)',
                        },
                      }}
                    >
                      Share
                    </Button>
                  </Box>
                </Tooltip>
              )}
            </>
          )}

          {!historyOpen ? (
            <Tooltip title="Show annotation history" arrow placement="bottom">
              <IconButton
                type="button"
                aria-label="Show annotation history"
                onClick={() => setHistoryOpen(true)}
                sx={{
                  position: 'absolute',
                  right: { xs: 16, sm: 24 },
                  top: '100%',
                  mt: 1.25,
                  zIndex: 3,
                  width: 44,
                  height: 44,
                  color: cv.textPrimary,
                  border: '1px solid var(--noah-border)',
                  backgroundColor: 'var(--noah-popover-surface-deep)',
                  boxShadow: cv.popoverShadow,
                  '&:hover': {
                    color: cv.textPrimary,
                    backgroundColor: cv.surfaceHover,
                  },
                }}
              >
                <ForumOutlinedIcon sx={{ fontSize: 22 }} />
              </IconButton>
            </Tooltip>
          ) : null}
        </Box>
      </Box>

      {item ? (
        <WorkspaceMembersDialog
          open={shareDialogOpen}
          resourceId={mediaId || item.id}
          workspaceName={item.title}
          members={shareTeamMembers.filter(m => m.hasOverride || m.isCurrentUser)}
          suggestedUsers={shareTeamMembers}
          organizationUsers={shareTeamMembers}
          suggestedGroups={MOCK_SETTINGS_USER_GROUPS}
          resourceType="project"
          visibility={shareInviteVisibility}
          shareLinks={shareLinks}
          activeShareLinkId={activeShareLinkId}
          focusLinkNameCounter={focusLinkNameCounter}
          onNewShareLink={handleNewShareLink}
          onShareLinkSelect={handleShareLinkSelect}
          onShareLinkDelete={handleShareLinkDelete}
          onShareLinkCopy={handleShareLinkCopy}
          onShareLinkNameChange={handleShareLinkNameChange}
          onShareLinkPermissionsChange={handleShareLinkPermissionsChange}
          onShareLinkSettingsSaved={handleShareLinkSettingsSaved}
          onClose={() => setShareDialogOpen(false)}
          onInvite={handleShareInviteMember}
          onUpdateMemberAccess={handleShareUpdateMemberAccess}
          onRemoveMember={handleShareRemoveMember}
          onRestrictedChange={() => { }}
          onVisibilityChange={(visibility) => {
            handleShareVisibilityChange(visibility);
            if (activeShareLinkId) {
              updateShareLinkAsync(activeShareLinkId, { visibility }).then(() => {
                if (mediaId) {
                  fetchShareLinks(mediaId).then(setShareLinks);
                }
              });
            }
          }}
        />
      ) : null}

      <Box
        component="main"
        id="main-content"
        sx={{
          position: 'relative',
          zIndex: 1,
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: { xs: 'column', lg: 'row' },
          alignItems: 'stretch',
          gap: { xs: 1.5, lg: 2 },
          px: { xs: 2, md: 3 },
          py: { xs: 1.5, md: 2 },
        }}
      >
        <GlassCard
          glow
          sx={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            height: { lg: '100%' },
            display: 'flex',
            flexDirection: 'column',
            borderRadius: { xs: '16px', md: '20px' },
          }}
        >
          <Box
            ref={videoStageRef}
            data-video-stage
            sx={{
              flex: 1,
              minHeight: 0,
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: cv.videoStage,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {(liveAssetStatus === 'in_progress' || liveAssetStatus === 'queued' || liveAssetStatus === 'processing') && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 24,
                  right: 24,
                  zIndex: 50,
                  pointerEvents: 'none'
                }}
              >
                <Chip
                  size="medium"
                  color="primary"
                  label={liveProgress ? `Compressing: ${liveProgress}` : 'Processing Video...'}
                  sx={{
                    backdropFilter: 'blur(8px)',
                    backgroundColor: 'rgba(25, 118, 210, 0.85)',
                    fontWeight: 600,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    px: 1,
                    py: 2
                  }}
                />
              </Box>
            )}
            {isBuffering && item?.type !== 'image' && (
              <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 40, pointerEvents: 'none' }}>
                <CircularProgress size={48} sx={{ color: '#6366F1' }} />
              </Box>
            )}
            <Box
              sx={{
                position: 'relative',
                flex: 1,
                minHeight: 0,
                width: '100%',
                overflow: 'hidden',
                background: getPlayerBackgroundStyle(playerBackground),
              }}
            >
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  transform: `scale(${workspaceZoom})`,
                  transformOrigin: 'center center',
                }}
              >
                {item?.type === 'image' ? (
                  <Box sx={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isDecodingImage && (
                      <Box sx={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, zIndex: 2 }}>
                        <CircularProgress size={36} sx={{ color: '#6366F1' }} />
                        <Typography variant="body2" sx={{ color: '#94A3B8', fontWeight: 500 }}>
                          Loading preview...
                        </Typography>
                      </Box>
                    )}
                    <Box
                      component="img"
                      src={clientDecodedUrl || mediaElementSrc}
                      alt={item?.title}
                      sx={{
                        width: '100%',
                        height: '100%',
                        display: 'block',
                        objectFit: playerActualMediaSize ? 'none' : 'contain',
                        backgroundColor: 'transparent',
                        opacity: isDecodingImage ? 0.3 : 1,
                        transition: 'opacity 0.2s ease',
                      }}
                    />
                  </Box>
                ) : (
                  <Box
                    component="video"
                    ref={videoRef}
                    key={videoSrc || 'no-src'}
                    src={mediaElementSrc}
                    poster={item?.thumbnail}
                    playsInline
                    preload="metadata"
                    onWaiting={() => setIsBuffering(true)}
                    onPlaying={() => setIsBuffering(false)}
                    onCanPlay={() => setIsBuffering(false)}
                    onLoadedData={() => setIsBuffering(false)}
                    sx={{
                      width: '100%',
                      height: '100%',
                      display: item?.type === 'audio' ? 'none' : 'block',
                      objectFit: playerActualMediaSize ? 'none' : 'contain',
                      backgroundColor: 'transparent',
                      transform: getVideoTransform(
                        playerRotationSteps,
                        playerFlipHorizontal,
                        playerFlipVertical,
                      ),
                      transformOrigin: 'center center',
                      pointerEvents:
                        annotationsVisible && ANNOTATION_OVERLAY_TOOLS.includes(activeTool)
                          ? 'none'
                          : 'auto',
                    }}
                  >
                    <track kind="captions" />
                  </Box>
                )}

                {item?.type === 'audio' && (
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'radial-gradient(circle, rgba(30,30,42,1) 0%, rgba(12,12,18,1) 100%)',
                      zIndex: 1,
                    }}
                  >
                    {/* Pulsing Audio Waves/Icon */}
                    <Box
                      sx={{
                        width: 120,
                        height: 120,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                        mb: 3,
                        animation: 'pulse-audio 2.5s infinite ease-in-out',
                        '@keyframes pulse-audio': {
                          '0%': { transform: 'scale(1)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' },
                          '50%': { transform: 'scale(1.06)', boxShadow: '0 8px 32px rgba(25,118,210,0.25)' },
                          '100%': { transform: 'scale(1)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' },
                        }
                      }}
                    >
                      <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#1976d2' }}>
                        <path d="M12 2v20M17 5v14M22 9v6M7 8v8M2 10v4" />
                      </svg>
                    </Box>

                    {/* Audio Details */}
                    <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 600, mb: 1 }}>
                      {item?.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                      Audio Asset • {item?.sizeBytes ? `${(item?.sizeBytes / (1024 * 1024)).toFixed(2)} MB` : 'Unknown Size'}
                    </Typography>
                  </Box>
                )}

                {item?.type === 'document' && (
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'radial-gradient(circle, rgba(30,30,42,1) 0%, rgba(12,12,18,1) 100%)',
                      zIndex: 1,
                    }}
                  >
                    <Box
                      sx={{
                        width: 100,
                        height: 100,
                        borderRadius: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                        mb: 3,
                      }}
                    >
                      <InsertDriveFileOutlinedIcon sx={{ fontSize: 52, color: '#38BDF8' }} />
                    </Box>

                    <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 600, mb: 1 }}>
                      {item?.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mb: 3 }}>
                      Document Asset • {item?.sizeBytes ? `${(item?.sizeBytes / (1024 * 1024)).toFixed(2)} MB` : 'File'}
                    </Typography>
                    <Button
                      variant="contained"
                      component="a"
                      href={`/api/media/${encodeURIComponent(item.id)}/download`}
                      download
                      startIcon={<FileDownloadOutlinedIcon />}
                      sx={{
                        backgroundColor: '#38BDF8',
                        color: '#0F172A',
                        fontWeight: 600,
                        borderRadius: '12px',
                        textTransform: 'none',
                        px: 3,
                        py: 1,
                        '&:hover': { backgroundColor: '#0284C7' },
                      }}
                    >
                      Download File
                    </Button>
                  </Box>
                )}

                {isProcessing ? (
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(0, 0, 0, 0.6)',
                      backdropFilter: 'blur(8px)',
                      zIndex: 10,
                    }}
                  >
                    {liveProgress && liveProgress !== 'processing' ? (
                      <CircularProgress
                        variant="determinate"
                        value={parseInt(liveProgress.replace('%', '')) || 0}
                        size={48}
                        sx={{
                          color: cv.brandBlue,
                          mb: 3,
                          '& .MuiCircularProgress-circle': {
                            transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
                          }
                        }}
                      />
                    ) : (
                      <CircularProgress size={48} sx={{ color: cv.brandBlue, mb: 3 }} />
                    )}
                    <Typography variant="h6" sx={{ color: cv.textInverse, fontWeight: 600 }}>
                      Processing Video...
                    </Typography>
                    {liveProgress ? (
                      <Typography variant="body2" sx={{ color: cv.textMuted, mt: 1, letterSpacing: '0.04em' }}>
                        {liveProgress}
                      </Typography>
                    ) : (
                      <Typography variant="body2" sx={{ color: cv.textMuted, mt: 1, letterSpacing: '0.04em' }}>
                        This may take a few moments
                      </Typography>
                    )}
                  </Box>
                ) : liveAssetStatus === 'failed' ? (
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(0, 0, 0, 0.75)',
                      backdropFilter: 'blur(8px)',
                      zIndex: 10,
                    }}
                  >
                    <ErrorOutlineOutlinedIcon sx={{ fontSize: 48, color: cv.destructiveBorder, mb: 2 }} />
                    <Typography variant="h6" sx={{ color: cv.textInverse, fontWeight: 600 }}>
                      Processing Failed
                    </Typography>
                    <Typography variant="body2" sx={{ color: cv.textMuted, mt: 1, mb: 3, letterSpacing: '0.04em', textAlign: 'center', maxWidth: 320 }}>
                      An error occurred while preparing this asset for playback. You can try processing it again.
                    </Typography>
                    <Button
                      variant="contained"
                      color="error"
                      onClick={handleRetryTranscode}
                      disabled={isRetrying}
                      sx={{
                        borderRadius: '999px',
                        px: 3,
                        py: 1,
                        textTransform: 'none',
                        fontWeight: 600,
                      }}
                    >
                      {isRetrying ? 'Retrying...' : 'Retry Processing'}
                    </Button>
                  </Box>
                ) : null}

                {playerShowAudioMeter ? (
                  <Box
                    aria-hidden
                    sx={{
                      position: 'absolute',
                      left: 16,
                      top: 16,
                      display: 'flex',
                      alignItems: 'flex-end',
                      gap: 0.5,
                      px: 1,
                      py: 0.75,
                      borderRadius: '10px',
                      backgroundColor: 'var(--noah-overlay-scrim)',
                      border: "1px solid var(--noah-border)",
                    }}
                  >
                    {[0.35, 0.6, 0.9, 0.55, 0.75].map((height, index) => (
                      <Box
                        key={index}
                        sx={{
                          width: 4,
                          height: `${height * 28}px`,
                          borderRadius: '999px',
                          backgroundColor: cv.textPrimary,
                          opacity: 0.85,
                        }}
                      />
                    ))}
                  </Box>
                ) : null}

                {(isGuestMode && guestAssetMeta?.logoUrl) || (isSharedWithUser && internalLogoUrl) ? (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 16,
                      left: 16,
                      zIndex: 10,
                      opacity: 0.7,
                      pointerEvents: 'none',
                      userSelect: 'none',
                    }}
                  >
                    <img
                      src={(isGuestMode ? guestAssetMeta?.logoUrl : internalLogoUrl) || ''}
                      alt="Company Watermark"
                      style={{ maxHeight: '48px', maxWidth: '120px', objectFit: 'contain' }}
                    />
                  </Box>
                ) : null}

                <VideoAnnotationSurface
                  activeTool={isViewer ? 'select' : activeTool}
                  enabled={surfaceEnabled && !isViewer}
                  annotationsVisible={annotationsVisible}
                  resolvedOverlayEntryIds={resolvedOverlayEntryIds}
                  videoRef={videoRef}
                  strokes={drawings}
                  onStrokesChange={setDrawings}
                  shapes={shapes}
                  onShapesChange={setShapes}
                  stamps={stamps}
                  onStampsChange={setStamps}
                  activeStamp={activeStamp}
                  customStamp={customStamp}
                  selectedShapeId={selectedShapeId}
                  onSelectedShapeIdChange={setSelectedShapeId}
                  selectedStampId={selectedStampId}
                  onSelectedStampIdChange={setSelectedStampId}
                  drawTool={activeDrawTool}
                  drawStroke={activeDrawStroke}
                  drawColor={activeDrawColor}
                  shapeTool={activeShape}
                  shapeStroke={activeShapeStroke}
                  shapeColor={activeShapeColor}
                  onRecord={handleAnnotationRecord}
                  onAnnotationActionStart={handleAnnotationActionStart}
                  onAnnotationNeedsComment={handleAnnotationNeedsComment}
                  annotationCommentPending={annotationCommentPending}
                  onMoveLinkedComment={handleMoveLinkedComment}
                />

                <VideoCommentLayer
                  active={activeTool === 'comment' && !isViewer}
                  panActive={activeTool === 'pan'}
                  annotationsVisible={annotationsVisible}
                  videoRef={videoRef}
                  comments={comments.map(c => {
                    const entryId = c.linkedShapeId
                      ? `shape-${c.linkedShapeId}`
                      : c.linkedDrawingId
                        ? `drawing-${c.linkedDrawingId}`
                        : `comment-${c.id}`;
                    const index = history.find(e => e.id === entryId)?.index;
                    return { ...c, historyIndex: index };
                  })}
                  draftComment={draftComment}
                  onPlaceDraft={handlePlaceDraft}
                  onDraftTextChange={handleDraftTextChange}
                  onDraftImageChange={handleDraftImageChange}
                  onSubmitDraft={handleSubmitDraft}
                  onCancelDraft={handleCancelDraft}
                  onAddReply={handleAddReply}
                  onToggleCommentResolved={handleToggleCommentResolved}
                  onMarkCommentUnread={handleMarkCommentUnread}
                  onCopyCommentLink={handleCopyCommentLink}
                  onDeleteComment={handleDeleteComment}
                  onEditComment={handleEditComment}
                  onEditReply={handleEditReply}
                  onThreadOpenChange={setCommentThreadOpen}
                  openCommentId={openCommentId}
                  onOpenCommentIdChange={setOpenCommentId}
                  annotationGroups={annotationGroups}
                  collaborators={collaborators}
                  onCommentVisibilityChange={handleCommentVisibilityChange}
                  onCreateAnnotationGroup={handleCreateAnnotationGroup}
                  onUpdateAnnotationGroup={handleUpdateAnnotationGroup}
                  onAddCollaborator={handleAddCollaboratorForGroup}
                  onMoveComment={handleMoveComment}
                  onPanActionStart={handleAnnotationActionStart}
                />
              </Box>
            </Box>

            {item?.type !== 'image' && (
              <VideoPlayerControls
                videoRef={videoRef}
                fullscreenTargetRef={videoStageRef}
                annotationCount={history.length}
                annotationsVisible={annotationsVisible}
                onToggleAnnotationsVisible={() => setAnnotationsVisible((visible) => !visible)}
                timelineItems={timelineItems}
                timelineFallbackDuration={timelineFallbackDuration}
                onAnnotationRangeChange={handleAnnotationRangeChange}
                onAnnotationClick={handleAnnotationClick}
                frameRateLabel={
                  videoTechnicalDetails?.frameRate ||
                  item?.frameRate ||
                  undefined
                }
              />
            )}

            <Box
              component="footer"
              ref={mobilePlayerFooterRef}
              aria-label="Annotation tools"
              sx={{
                position: 'relative',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                px: { xs: 1, md: 2 },
                py: { xs: 0.75, md: 1 },
                borderTop: '1px solid var(--noah-border)',
                backgroundColor: 'var(--noah-footer-tint)',
                minHeight: { xs: 72, md: 72 },
                overflow: 'visible',
                zIndex: 12,
              }}
            >
              {isDesktopAnnotationToolbar ? (
                <Box
                  sx={{
                    display: 'flex',
                    width: '100%',
                    minWidth: 0,
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}
                >
                  {showClearIsland ? (
                    <Box
                      sx={{
                        position: 'absolute',
                        left: 16,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 2,
                      }}
                    >
                      <AnnotationUndoIsland
                        canClear={canClearAnnotations}
                        onClear={handleOpenClearAnnotationsModal}
                        disabled={isViewer}
                      />
                    </Box>
                  ) : null}

                  <Box
                    sx={{
                      width: '100%',
                      minWidth: 0,
                      boxSizing: 'border-box',
                      display: 'flex',
                      justifyContent: 'center',
                      pl: showClearIsland ? '88px' : 2,
                      pr: '148px',
                    }}
                  >
                    <AnnotationToolbar
                      disabled={isViewer}
                      mediaType={item?.type}
                      activeTool={activeTool}
                      onToolChange={handleToolChange}
                      activeDrawTool={activeDrawTool}
                      onDrawToolChange={setActiveDrawTool}
                      activeDrawStroke={activeDrawStroke}
                      onDrawStrokeChange={setActiveDrawStroke}
                      activeDrawColor={activeDrawColor}
                      onDrawColorChange={setActiveDrawColor}
                      activeShape={activeShape}
                      onShapeChange={setActiveShape}
                      activeColor={activeShapeColor}
                      onColorChange={setActiveShapeColor}
                      activeShapeStroke={activeShapeStroke}
                      onShapeStrokeChange={setActiveShapeStroke}
                      activeStamp={activeStamp}
                      customStamp={customStamp}
                      onStampSelect={setActiveStamp}
                      onAddCustomStamp={handleAddCustomStamp}
                      keyboardShortcutsDisabled={Boolean(draftComment) || commentThreadOpen}
                      toolsDrawerOpen={toolsDrawerOpen}
                      onMoreToolsClick={() => setToolsDrawerOpen((open) => !open)}
                      onToolsDrawerClose={() => setToolsDrawerOpen(false)}
                      moreToolsButtonRef={moreToolsButtonRef}
                      moreToolsAnchorRef={moreToolsAnchorRef}
                      pinnedPlayerTools={pinnedPlayerTools}
                      playerToolsViewState={playerToolsViewState}
                      playerToolHandlers={playerToolHandlers}
                      canUndo={canUndo}
                      canRedo={canRedo}
                      onUndo={handleUndo}
                      onRedo={handleRedo}
                    />
                  </Box>

                  <Box
                    sx={{
                      position: 'absolute',
                      right: 16,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      zIndex: 2,
                    }}
                  >
                    <WorkspaceControlsIsland
                      zoomLabel={workspaceZoomLabel}
                      canZoomOut={canWorkspaceZoomOut}
                      canZoomIn={canWorkspaceZoomIn}
                      canResetZoom={canWorkspaceZoomReset}
                      onZoomOut={handleWorkspaceZoomOut}
                      onZoomIn={handleWorkspaceZoomIn}
                      onZoomReset={handleWorkspaceZoomReset}
                      onKeyboardShortcuts={() => setKeyboardShortcutsOpen(true)}
                      hideZoomControls={item?.type === 'audio'}
                    />
                  </Box>
                </Box>
              ) : (
                <Box sx={mobileIslandScrollSx}>
                  <Box sx={mergedMobileIslandSx}>
                    <AnnotationToolbar
                      compact
                      disabled={isViewer}
                      mediaType={item?.type}
                      mobilePlayerFooterRef={mobilePlayerFooterRef}
                      activeTool={activeTool}
                      onToolChange={handleToolChange}
                      activeDrawTool={activeDrawTool}
                      onDrawToolChange={setActiveDrawTool}
                      activeDrawStroke={activeDrawStroke}
                      onDrawStrokeChange={setActiveDrawStroke}
                      activeDrawColor={activeDrawColor}
                      onDrawColorChange={setActiveDrawColor}
                      activeShape={activeShape}
                      onShapeChange={setActiveShape}
                      activeColor={activeShapeColor}
                      onColorChange={setActiveShapeColor}
                      activeShapeStroke={activeShapeStroke}
                      onShapeStrokeChange={setActiveShapeStroke}
                      activeStamp={activeStamp}
                      customStamp={customStamp}
                      onStampSelect={setActiveStamp}
                      onAddCustomStamp={handleAddCustomStamp}
                      keyboardShortcutsDisabled={Boolean(draftComment) || commentThreadOpen}
                      toolsDrawerOpen={toolsDrawerOpen}
                      onMoreToolsClick={() => setToolsDrawerOpen((open) => !open)}
                      onToolsDrawerClose={() => setToolsDrawerOpen(false)}
                      moreToolsButtonRef={moreToolsButtonRef}
                      moreToolsAnchorRef={moreToolsAnchorRef}
                      pinnedPlayerTools={pinnedPlayerTools}
                      playerToolsViewState={playerToolsViewState}
                      playerToolHandlers={playerToolHandlers}
                      canUndo={canUndo}
                      canRedo={canRedo}
                      onUndo={handleUndo}
                      onRedo={handleRedo}
                    />
                    <WorkspaceControlsIsland
                      compact
                      zoomLabel={workspaceZoomLabel}
                      canZoomOut={canWorkspaceZoomOut}
                      canZoomIn={canWorkspaceZoomIn}
                      canResetZoom={canWorkspaceZoomReset}
                      onZoomOut={handleWorkspaceZoomOut}
                      onZoomIn={handleWorkspaceZoomIn}
                      onZoomReset={handleWorkspaceZoomReset}
                      onKeyboardShortcuts={() => setKeyboardShortcutsOpen(true)}
                      hideZoomControls={item?.type === 'audio'}
                      insertBeforeHelp={
                        showClearIsland ? (
                          <AnnotationUndoIsland
                            compact
                            disabled={isViewer}
                            canClear={canClearAnnotations}
                            onClear={handleOpenClearAnnotationsModal}
                          />
                        ) : null
                      }
                    />
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        </GlassCard>

        <AnnotationHistoryDrawer
          open={historyOpen}
          activeHistoryEntryId={activeHistoryEntryId}
          entries={history}
          comments={comments}
          mediaItem={item}
          technicalDetails={videoTechnicalDetails}
          tags={item.tags ?? []}
          onTagsChange={handleTagsChange}
          activeTab={drawerTab}
          onTabChange={setDrawerTab}
          detailsSection={detailsSection}
          onDetailsSectionChange={setDetailsSection}
          onClose={() => setHistoryOpen(false)}
          onEntryClick={(entry) => {
            handleSeekToTimestamp(entry.videoTimestamp, entry.id);
            if (['comment', 'drawing', 'shape', 'stamp'].includes(entry.type)) {
              handleAnnotationClick(entry.id, entry.type as any);
            }
          }}
          onToggleResolved={handleToggleResolved}
          onTogglePinned={handleTogglePinned}
          onMarkUnread={handleMarkUnread}
          onCopyLink={handleCopyLink}
          onDeleteEntry={handleDeleteEntry}
          onHardDeleteEntry={handleHardDeleteEntry}
          onRestoreEntry={handleRestoreEntry}
          onEditComment={handleEditComment}
          annotationGroups={annotationGroups}
          collaborators={collaborators}
          onVisibilityChange={handleEntryVisibilityChange}
          onCreateAnnotationGroup={handleCreateAnnotationGroup}
          onDeleteAnnotationGroup={handleDeleteAnnotationGroup}
          onUpdateAnnotationGroup={handleUpdateAnnotationGroup}
          onAddCollaborator={handleAddCollaboratorForGroup}
        />
      </Box>

      <PlayerToolsDrawer
        open={toolsDrawerOpen}
        anchorRef={moreToolsAnchorRef}
        onClose={() => setToolsDrawerOpen(false)}
        pinnedTools={pinnedPlayerTools}
        onPinnedToolsChange={setPinnedPlayerTools}
        viewState={playerToolsViewState}
        onToggleLoop={() => setPlayerLoop((current) => !current)}
        onToggleFlip={() => setPlayerFlipHorizontal((current) => !current)}
        onToggleFlop={() => setPlayerFlipVertical((current) => !current)}
        onRotateLeft={() =>
          setPlayerRotationSteps((current) => (current + 3) % 4)
        }
        onRotateRight={() =>
          setPlayerRotationSteps((current) => (current + 1) % 4)
        }
        onSetInPoint={() => setPlayerInPoint(getVideoTimestamp())}
        onSetOutPoint={() => setPlayerOutPoint(getVideoTimestamp())}
        onReadTimecode={handleReadTimecode}
        onToggleRange={() => setPlayerRangeEnabled((current) => !current)}
        onToggleAudioMeter={() => setPlayerShowAudioMeter((current) => !current)}
        onToggleActualMediaSize={() => setPlayerActualMediaSize((current) => !current)}
        onPlayerBackgroundChange={setPlayerBackground}
      />

      <ClearAnnotationsModal
        open={clearAnnotationsModalOpen}
        onClose={() => setClearAnnotationsModalOpen(false)}
        onConfirm={handleConfirmClearAnnotations}
      />

      <AnnotationHelpDialog
        open={keyboardShortcutsOpen}
        onClose={() => setKeyboardShortcutsOpen(false)}
      />

      <Snackbar
        open={statusToast.open}
        autoHideDuration={2500}
        onClose={() => setStatusToast((current) => ({ ...current, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ zIndex: TOAST_Z_INDEX, bottom: { xs: 96, md: 108 } }}
      >
        <Alert
          onClose={() => setStatusToast((current) => ({ ...current, open: false }))}
          severity={statusToast.variant === 'resolved' ? 'success' : 'error'}
          variant="filled"
          sx={{
            width: '100%',
            borderRadius: '12px',
            backgroundColor:
              statusToast.variant === 'resolved' ? cv.successDark : cv.destructiveBorder,
            color: cv.textInverse,
            fontWeight: 600,
            '& .MuiAlert-icon': { color: cv.textInverse },
          }}
        >
          {statusToast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
