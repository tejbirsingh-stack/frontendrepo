import { useState } from 'react';
import { cv } from '../../theme/cssVars';
import { Box, Button, IconButton, Typography } from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';
import type { ShareLink } from '../../types/shareLink';
import { copyProjectShareLink } from '../../utils/projectShareLink';

interface ShareLinksSectionProps {
  shareLinks: ShareLink[];
  activeShareLinkId?: string | null;
  editingShareLinkId?: string | null;
  onNewShareLink?: () => void;
  onShareLinkSelect?: (link: ShareLink) => void;
  onShareLinkEdit?: (link: ShareLink) => void;
  onShareLinkDelete?: (link: ShareLink) => void;
  onShareLinkCopy?: (link: ShareLink) => void;
  scrollable?: boolean;
  disabled?: boolean;
}

export default function ShareLinksSection({
  shareLinks,
  activeShareLinkId,
  editingShareLinkId,
  onNewShareLink,
  onShareLinkSelect,
  onShareLinkEdit,
  onShareLinkDelete,
  onShareLinkCopy,
  scrollable = false,
  disabled = false,
}: ShareLinksSectionProps) {
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const hasExistingLinks = shareLinks.length > 0;

  const handleCopyLink = async (link: ShareLink) => {
    const success = await copyProjectShareLink(link.url);
    if (success) {
      setCopiedLinkId(link.id);
      onShareLinkCopy?.(link);
      window.setTimeout(() => setCopiedLinkId((current) => (current === link.id ? null : current)), 2000);
    }
  };

  const actionButtonSx = {
    width: 32,
    height: 32,
    mt: 0.35,
    flexShrink: 0,
    opacity: 0.7,
    color: cv.textMuted,
    '&:hover': {
      opacity: 1,
      color: cv.textPrimary,
      backgroundColor: cv.surfaceHover,
    },
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
      <Button
        type="button"
        fullWidth
        variant="contained"
        startIcon={<AddOutlinedIcon />}
        onClick={onNewShareLink}
        disabled={disabled}
        sx={{
          borderRadius: '10px',
          py: 1.1,
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.9375rem',
          background: cv.brandGradient,
          boxShadow: cv.brandShadowStrong,
          '&:hover': {
            background: cv.brandGradient,
            filter: 'brightness(1.08)',
          },
        }}
      >
        New Share Link
      </Button>

      {hasExistingLinks ? (
        <Box>
          <Typography
            sx={{
              mb: 0.75,
              fontSize: '0.8125rem',
              fontWeight: 500,
              color: cv.textSecondary,
            }}
          >
            Share links
          </Typography>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 0.35,
              opacity: disabled ? 0.45 : 1,
              pointerEvents: disabled ? 'none' : undefined,
              ...(scrollable
                ? {
                    maxHeight: { md: 300 },
                    overflowY: 'auto',
                    pr: 0.5,
                    '&::-webkit-scrollbar': { width: 6 },
                    '&::-webkit-scrollbar-thumb': {
                      backgroundColor: cv.surfaceActive,
                      borderRadius: 999,
                    },
                  }
                : {}),
            }}
          >
            {shareLinks.map((link) => {
              const isActive = link.id === activeShareLinkId;
              const isEditing = link.id === editingShareLinkId;
              return (
                <Box
                  key={link.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 0.5,
                    width: '100%',
                    px: 0.5,
                    py: 0.25,
                    borderRadius: '8px',
                    backgroundColor:
                      isEditing || isActive ? cv.purpleSelectionSoft : 'transparent',
                    border:
                      isEditing || isActive
                        ? `1px solid ${cv.purpleSelectionStrong}`
                        : '1px solid transparent',
                    '&:hover': {
                      backgroundColor:
                        isEditing || isActive ? cv.purpleSurfaceHover : cv.surfaceHover,
                    },
                    '&:hover .share-link-action': {
                      opacity: 1,
                    },
                  }}
                >
                  <Box
                    component="button"
                    type="button"
                    onClick={() => onShareLinkSelect?.(link)}
                    aria-pressed={isActive}
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 1,
                      flex: 1,
                      minWidth: 0,
                      px: 0.5,
                      py: 0.65,
                      border: 'none',
                      borderRadius: '8px',
                      background: 'transparent',
                      color: cv.textPrimary,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <LinkOutlinedIcon
                      sx={{ fontSize: 18, color: cv.textMuted, mt: 0.15, flexShrink: 0 }}
                    />
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography
                        sx={{
                          fontSize: '0.875rem',
                          fontWeight: isActive ? 600 : 500,
                          color: cv.textPrimary,
                          lineHeight: 1.3,
                          wordBreak: 'break-word',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                        }}
                      >
                        {link.name}
                        {link.visibility === 'private' ? (
                          <LockOutlinedIcon
                            sx={{ fontSize: 14, color: cv.textMuted, flexShrink: 0 }}
                            aria-label="Private link"
                          />
                        ) : (
                          <PublicOutlinedIcon
                            sx={{ fontSize: 14, color: cv.textMuted, flexShrink: 0 }}
                            aria-label="Public link"
                          />
                        )}
                      </Typography>
                      <Typography
                        sx={{
                          mt: 0.25,
                          fontSize: '0.75rem',
                          color: cv.textMuted,
                          lineHeight: 1.3,
                          wordBreak: 'break-all',
                        }}
                      >
                        {link.url}
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton
                    type="button"
                    className="share-link-action"
                    aria-label={`Edit share link ${link.name}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onShareLinkEdit?.(link);
                    }}
                    sx={{
                      ...actionButtonSx,
                      ...(isEditing ? { opacity: 1, color: cv.brandPurple } : {}),
                    }}
                  >
                    <EditOutlinedIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                  <IconButton
                    type="button"
                    className="share-link-action"
                    aria-label={`Copy share link ${link.name}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      void handleCopyLink(link);
                    }}
                    sx={{
                      ...actionButtonSx,
                      ...(copiedLinkId === link.id
                        ? { opacity: 1, color: cv.brandPurple }
                        : {}),
                    }}
                  >
                    <ContentCopyOutlinedIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                  <IconButton
                    type="button"
                    className="share-link-action"
                    aria-label={`Delete share link ${link.name}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onShareLinkDelete?.(link);
                    }}
                    sx={{
                      ...actionButtonSx,
                      '&:hover': {
                        opacity: 1,
                        color: cv.destructive,
                        backgroundColor: cv.destructiveHover,
                      },
                    }}
                  >
                    <DeleteOutlineOutlinedIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Box>
              );
            })}
          </Box>
        </Box>
      ) : null}
    </Box>
  );
}
