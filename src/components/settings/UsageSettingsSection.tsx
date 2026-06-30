import type { ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  LinearProgress,
  Typography,
} from '@mui/material';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined';
import WorkspacesOutlinedIcon from '@mui/icons-material/WorkspacesOutlined';
import { cv } from '../../theme/cssVars';
import { SETTINGS_BASE_PATH } from '../../constants/settingsNav';
import { MOCK_USAGE_SUMMARY } from '../../data/mockSettingsData';
import { SettingsTableContainer } from './SettingsContentLayout';
import StorageConsumptionChart from './StorageConsumptionChart';

const outlineButtonSx = {
  textTransform: 'none' as const,
  borderRadius: '10px',
  borderColor: cv.border,
  color: cv.textPrimary,
  whiteSpace: 'nowrap',
  '&:hover': {
    borderColor: cv.purpleSelectionBorder,
    backgroundColor: cv.purpleSelectionSoft,
  },
};

function UsageStatCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: '14px',
        border: `1px solid ${cv.border}`,
        background: `linear-gradient(145deg, ${cv.elevatedSurface} 0%, ${cv.surfaceMuted} 100%)`,
        minHeight: 100,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.85,
      }}
    >
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          background: cv.brandGradient,
          color: cv.textOnCta,
          boxShadow: cv.brandShadowSoft,
          '& .MuiSvgIcon-root': {
            fontSize: 18,
          },
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: '0.6875rem', color: cv.textMuted, fontWeight: 500 }}>
          {label}
        </Typography>
        <Typography
          sx={{
            fontSize: { xs: '1.125rem', md: '1.25rem' },
            fontWeight: 700,
            color: cv.textPrimary,
            lineHeight: 1.2,
            mt: 0.2,
          }}
        >
          {value}
        </Typography>
        <Typography
          sx={{
            fontSize: '0.6875rem',
            color: cv.textSecondary,
            mt: 0.3,
            lineHeight: 1.35,
          }}
        >
          {detail}
        </Typography>
      </Box>
    </Box>
  );
}

function UsageDetailCard({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <Box
      sx={{
        px: 2,
        py: 1.75,
        borderRadius: '14px',
        border: `1px solid ${cv.border}`,
        backgroundColor: cv.surfaceMuted,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: children ? 'flex-start' : 'center',
          justifyContent: 'space-between',
          gap: 2,
          flexWrap: { xs: 'wrap', md: 'nowrap' },
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: '0.9375rem', fontWeight: 600, color: cv.textPrimary }}>
            {title}
          </Typography>
          <Typography sx={{ mt: 0.35, fontSize: '0.8125rem', color: cv.textSecondary, lineHeight: 1.5 }}>
            {description}
          </Typography>
        </Box>
        {action ? <Box sx={{ flexShrink: 0, alignSelf: children ? 'flex-start' : 'center' }}>{action}</Box> : null}
      </Box>
      {children ? <Box sx={{ mt: 1.25 }}>{children}</Box> : null}
    </Box>
  );
}

export default function UsageSettingsSection() {
  const usage = MOCK_USAGE_SUMMARY;
  const membersPercent = (usage.membersUsed / usage.membersTotal) * 100;

  return (
    <SettingsTableContainer>
      <Box sx={{ mb: 2.5 }}>
        <Typography
          sx={{
            fontSize: '1.125rem',
            fontWeight: 600,
            color: cv.textPrimary,
            letterSpacing: '-0.01em',
          }}
        >
          Usage Summary
        </Typography>
        <Typography sx={{ mt: 0.5, fontSize: '0.875rem', color: cv.textSecondary, maxWidth: 720 }}>
          Seat allotment, storage, projects, and workspaces for this account shell.
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(300px, 600px) minmax(0, 1fr)' },
          gap: 2,
          alignItems: 'start',
        }}
      >
        <Box
          sx={{
            p: { xs: 2, md: 2.25 },
            borderRadius: '16px',
            border: `1px solid ${cv.border}`,
            background: `linear-gradient(160deg, ${cv.panelTint} 0%, ${cv.surfaceMuted} 55%, ${cv.elevatedSurface} 100%)`,
            boxShadow: cv.islandShadow,
            position: { lg: 'sticky' },
            top: { lg: 24 },
            order: { xs: 1, lg: 1 },
          }}
        >
          <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: cv.textPrimary, mb: 0.5 }}>
            Storage consumption
          </Typography>
          <Typography sx={{ fontSize: '0.8125rem', color: cv.textSecondary, mb: 2 }}>
            Core repository streams from Backblaze B2.
          </Typography>

          <StorageConsumptionChart
            compact
            usedLabel={usage.storageUsedLabel}
            capLabel={usage.storageCapLabel}
            usedPercent={usage.storageUsedPercent}
            breakdown={usage.storageBreakdown}
            capBytes={usage.storageCapBytes}
          />
        </Box>

        <Box sx={{ display: 'grid', gap: 1.5, minWidth: 0, order: { xs: 2, lg: 2 } }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(2, minmax(0, 1fr))',
                md: 'repeat(4, minmax(0, 1fr))',
              },
              gap: 1.25,
            }}
          >
            <UsageStatCard
              icon={<GroupOutlinedIcon />}
              label="Members"
              value={`${usage.membersUsed}/${usage.membersTotal}`}
              detail={`${usage.membersActive} active · ${usage.membersPending} pending`}
            />
            <UsageStatCard
              icon={<StorageOutlinedIcon />}
              label="Storage used"
              value={usage.storageUsedLabel}
              detail={`${usage.storageUsedPercent < 1 ? usage.storageUsedPercent.toFixed(1) : Math.round(usage.storageUsedPercent)}% of ${usage.storageCapLabel}`}
            />
            <UsageStatCard
              icon={<FolderOutlinedIcon />}
              label="Projects"
              value={String(usage.projectsCount)}
              detail="Provisioned under this account"
            />
            <UsageStatCard
              icon={<WorkspacesOutlinedIcon />}
              label="Workspaces"
              value={String(usage.workspacesCount)}
              detail="Owned by this company profile"
            />
          </Box>

          <UsageDetailCard
            title="Members allocation"
            description={`${usage.membersUsed} of ${usage.membersTotal} members · ${usage.membersActive} active, ${usage.membersPending} pending`}
            action={
              <Button
                component={RouterLink}
                to={`${SETTINGS_BASE_PATH}/admin/user`}
                variant="outlined"
                size="small"
                sx={outlineButtonSx}
              >
                Manage members
              </Button>
            }
          >
            <LinearProgress
              variant="determinate"
              value={Math.min(100, Math.max(0, membersPercent))}
              aria-label={`${usage.membersUsed} of ${usage.membersTotal} member seats used`}
              sx={{
                height: 8,
                borderRadius: 999,
                backgroundColor: cv.surfaceRaised,
                '& .MuiLinearProgress-bar': {
                  borderRadius: 999,
                  background: cv.brandGradient,
                },
              }}
            />
            <Typography sx={{ mt: 1, fontSize: '0.75rem', color: cv.textMuted, lineHeight: 1.5 }}>
              Admin & Super Admin only. Adding a {usage.seatGuardrailMax + 1}th member triggers a billing
              upgrade roadblock.
            </Typography>
          </UsageDetailCard>

          <UsageDetailCard
            title="Projects count"
            description={`${usage.projectsCount} project${usage.projectsCount === 1 ? '' : 's'} provisioned under this account.`}
            action={
              <Button
                component={RouterLink}
                to={`${SETTINGS_BASE_PATH}/admin/projects`}
                variant="outlined"
                size="small"
                sx={outlineButtonSx}
              >
                Manage projects
              </Button>
            }
          />

          <UsageDetailCard
            title="Workspaces count"
            description={`${usage.workspacesCount} workspace tenant${usage.workspacesCount === 1 ? '' : 's'} owned under this company profile.`}
            action={
              <Button
                component={RouterLink}
                to={`${SETTINGS_BASE_PATH}/admin/workspaces`}
                variant="outlined"
                size="small"
                sx={outlineButtonSx}
              >
                Manage workspaces
              </Button>
            }
          />
        </Box>
      </Box>
    </SettingsTableContainer>
  );
}
