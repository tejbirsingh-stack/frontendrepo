import { useEffect, useMemo, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import WorkspacesOutlinedIcon from '@mui/icons-material/WorkspacesOutlined';
import FolderCopyOutlinedIcon from '@mui/icons-material/FolderCopyOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import LanguageOutlinedIcon from '@mui/icons-material/LanguageOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import { fetchDashboardSummary } from '../api/platformApi';
import {
  CHART_PALETTE,
  ChartLegend,
  DonutChart,
  GrowthCompareChart,
  HorizontalBarChart,
  RadialGauge,
} from '../components/PlatformCharts';
import {
  EmptyState,
  PageHeader,
  Panel,
  QuickLinkCard,
  StatCard,
  StatusChip,
  formatBytes,
  formatMoneyCents,
  formatPercent,
} from '../components/PlatformUi';
import { cv } from '../../theme/cssVars';

type RoleRow = { roleId: string | null; roleName: string; count: number };
type PlanRow = { planType: string; count: number };
type OrgRow = Record<string, unknown>;

const iconSize = { fontSize: 20 } as const;

export default function PlatformDashboardPage() {
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchDashboardSummary()
      .then((res) => setSummary(res.summary))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const planMix = (summary?.planMix as PlanRow[]) || [];
  const usersByRole = (summary?.usersByRole as RoleRow[]) || [];
  const recentOrgs = (summary?.recentOrgs as OrgRow[]) || [];
  const attentionOrgs = (summary?.attentionOrgs as OrgRow[]) || [];
  const growth = (summary?.growth as Record<string, number>) || {};
  const commercial = (summary?.commercial as Record<string, number>) || {};
  const storagePct = Number(summary?.storageUtilizationPercent || 0);

  const planChartData = useMemo(
    () =>
      planMix.map((row) => ({
        name: row.planType.charAt(0).toUpperCase() + row.planType.slice(1),
        value: row.count,
      })),
    [planMix],
  );

  const roleChartData = useMemo(
    () =>
      usersByRole.slice(0, 8).map((row) => ({
        name: row.roleName,
        value: row.count,
      })),
    [usersByRole],
  );

  const planTotal = planChartData.reduce((sum, row) => sum + Number(row.value || 0), 0);

  return (
    <Box>
      <PageHeader
        title="Global Admin"
        subtitle="Platform command center — organizations, people, workspaces, billing, and operations"
        actions={
          <>
            <Button
              component={RouterLink}
              to="/platform/organizations"
              variant="contained"
              sx={{ textTransform: 'none', borderRadius: '6px', px: 2 }}
            >
              Manage organizations
            </Button>
            <Button
              component={RouterLink}
              to="/platform/users"
              variant="outlined"
              sx={{ textTransform: 'none', borderRadius: '6px', px: 2 }}
            >
              View users
            </Button>
          </>
        }
      />

      {error ? (
        <Typography sx={{ color: cv.destructive, mb: 2 }} role="alert">
          {error}
        </Typography>
      ) : null}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' },
          gap: 2,
          mb: 3,
        }}
      >
        <StatCard
          label="Organizations"
          value={loading ? '—' : String(summary?.totalOrgs ?? 0)}
          hint={`${summary?.activeOrgs ?? 0} active · ${summary?.suspendedOrgs ?? 0} suspended`}
          tone="brand"
          icon={<BusinessOutlinedIcon sx={iconSize} />}
          tooltip="Total tenant organizations across the platform, including active and suspended."
        />
        <StatCard
          label="Users"
          value={loading ? '—' : String(summary?.totalUsers ?? 0)}
          hint={`${summary?.activeUsers ?? 0} active · ${summary?.suspendedUsers ?? 0} suspended`}
          icon={<PeopleAltOutlinedIcon sx={iconSize} />}
          tooltip="All platform user accounts across every organization."
        />
        <StatCard
          label="Workspaces"
          value={loading ? '—' : String(summary?.totalWorkspaces ?? 0)}
          hint={`${summary?.totalProjects ?? 0} projects · ${summary?.totalAssets ?? 0} assets`}
          icon={<WorkspacesOutlinedIcon sx={iconSize} />}
          tooltip="Tenant workspaces with nested projects and media assets."
        />
        <StatCard
          label="Estimated MRR"
          value={loading ? '—' : formatMoneyCents(commercial.estimatedMrrCents)}
          hint={`${commercial.catalogPlanCount ?? 0} public plans`}
          tone="success"
          icon={<PaymentsOutlinedIcon sx={iconSize} />}
          tooltip="Estimated monthly recurring revenue from active paid subscriptions."
        />
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1.35fr 1fr 1fr' },
          gap: 2,
          mb: 3,
        }}
      >
        <Panel
          title="Platform health"
          subtitle="Storage utilization and 30-day growth"
          tooltip="Hover the gauge and bars for exact values. Storage above 85% is flagged as hot."
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '160px 1fr' },
              gap: 2,
              alignItems: 'center',
            }}
          >
            <RadialGauge
              percent={storagePct}
              label="Storage"
              detail={`${formatBytes(summary?.storageUsedBytes as string)} of ${formatBytes(summary?.storageQuotaBytes as string)}`}
              height={168}
            />
            <Box>
              <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted, mb: 0.5, fontWeight: 600 }}>
                Growth (last 30 days)
              </Typography>
              <GrowthCompareChart
                orgs={Number(growth.newOrganizations30d ?? 0)}
                users={Number(growth.newUsers30d ?? 0)}
                height={148}
              />
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 1,
                  mt: 1,
                }}
              >
                {[
                  {
                    label: 'New orgs',
                    value: String(growth.newOrganizations30d ?? 0),
                    tip: 'Organizations created in the last 30 days',
                  },
                  {
                    label: 'New users',
                    value: String(growth.newUsers30d ?? 0),
                    tip: 'Users created in the last 30 days',
                  },
                ].map((tile) => (
                  <Box
                    key={tile.label}
                    title={tile.tip}
                    sx={{
                      p: 1.25,
                      borderRadius: '6px',
                      border: `1px solid ${cv.border}`,
                      background: cv.surfaceMuted,
                      cursor: 'help',
                    }}
                  >
                    <Typography sx={{ fontSize: '0.65rem', color: cv.textMuted, fontWeight: 600 }}>
                      {tile.label}
                    </Typography>
                    <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, mt: 0.35 }}>
                      {tile.value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </Panel>

        <Panel
          title="Plan mix"
          subtitle="Organizations by plan"
          tooltip="Distribution of organizations across catalog plan types."
          action={
            <Button
              component={RouterLink}
              to="/platform/plans"
              size="small"
              sx={{ textTransform: 'none' }}
            >
              Plans
            </Button>
          }
        >
          <DonutChart
            data={planChartData}
            emptyMessage="No plan data yet"
            height={200}
            centerLabel="orgs"
            centerValue={planTotal || '0'}
          />
          <ChartLegend
            items={planChartData.map((row, i) => ({
              label: String(row.name),
              value: row.value,
              color: CHART_PALETTE[i % CHART_PALETTE.length],
            }))}
          />
        </Panel>

        <Panel
          title="Needs attention"
          subtitle="Suspended orgs and storage hotspots"
          tooltip="Organizations that are suspended or approaching storage limits."
        >
          {attentionOrgs.length === 0 ? (
            <EmptyState message="No orgs currently need attention" />
          ) : (
            attentionOrgs.map((org) => {
              const pct = formatPercent(
                org.storageUsedBytes as string,
                org.storageQuotaBytes as string,
              );
              return (
                <Box
                  key={String(org.id)}
                  component={RouterLink}
                  to={`/platform/organizations/${org.id}`}
                  title={`${String(org.name)} — ${pct}% storage used`}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 1,
                    py: 1.1,
                    textDecoration: 'none',
                    color: cv.textPrimary,
                    borderBottom: `1px solid ${cv.border}`,
                    '&:last-child': { borderBottom: 'none' },
                    '&:hover': { color: cv.brandOrchid },
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
                      {String(org.name)}
                    </Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: cv.textMuted }}>
                      {pct}% storage · {String(org.planType)}
                    </Typography>
                  </Box>
                  <StatusChip status={String(org.status || 'active')} />
                </Box>
              );
            })
          )}
        </Panel>
      </Box>

      <Box sx={{ mb: 1.5 }}>
        <Typography sx={{ fontWeight: 600, mb: 0.5, letterSpacing: '-0.01em' }}>
          Admin surfaces
        </Typography>
        <Typography sx={{ fontSize: '0.8125rem', color: cv.textMuted, mb: 1.5 }}>
          Everything Super Admin and Admin manage at org level — operated here across all tenants
        </Typography>
      </Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' },
          gap: 2,
          mb: 3,
        }}
      >
        <QuickLinkCard
          to="/platform/users"
          title="Users & roles"
          description="People directory, role mix, suspend or restore accounts"
          meta={`${summary?.totalUsers ?? 0} users`}
          icon={<PeopleAltOutlinedIcon sx={{ fontSize: 18 }} />}
        />
        <QuickLinkCard
          to="/platform/workspaces"
          title="Workspaces & projects"
          description="Tenant workspaces, folders, and project footprint"
          meta={`${summary?.totalWorkspaces ?? 0} workspaces`}
          icon={<WorkspacesOutlinedIcon sx={{ fontSize: 18 }} />}
        />
        <QuickLinkCard
          to="/platform/default-content"
          title="Default content"
          description="Starter files provisioned into every new user's workspace"
          meta="Onboarding library"
          icon={<FolderCopyOutlinedIcon sx={{ fontSize: 18 }} />}
        />
        <QuickLinkCard
          to="/platform/plans"
          title="Plans"
          description="Plan catalog, pricing, and package overrides"
          meta={`${commercial.catalogPlanCount ?? 0} plans`}
          icon={<LocalOfferOutlinedIcon sx={{ fontSize: 18 }} />}
        />
        <QuickLinkCard
          to="/platform/billing"
          title="Billing"
          description="Subscriptions, MRR, and payment status across orgs"
          meta={formatMoneyCents(commercial.estimatedMrrCents)}
          icon={<ReceiptLongOutlinedIcon sx={{ fontSize: 18 }} />}
        />
        <QuickLinkCard
          to="/platform/usage"
          title="Usage & quotas"
          description="Seats, storage, and asset consumption by organization"
          meta={formatBytes(summary?.storageUsedBytes as string)}
          icon={<BarChartOutlinedIcon sx={{ fontSize: 18 }} />}
        />
        <QuickLinkCard
          to="/platform/activity"
          title="Audit activity"
          description="Platform-wide audit trail across organizations"
          meta="Live trail"
          icon={<HistoryOutlinedIcon sx={{ fontSize: 18 }} />}
        />
        <QuickLinkCard
          to="/platform/reporting"
          title="Reporting"
          description="Growth, conversion, and storage sold vs used"
          meta="Filters & CSV"
          icon={<AssessmentOutlinedIcon sx={{ fontSize: 18 }} />}
        />
        <QuickLinkCard
          to="/platform/landing"
          title="Landing & branding"
          description="Public marketing landing page content CMS"
          meta="Website"
          icon={<LanguageOutlinedIcon sx={{ fontSize: 18 }} />}
        />
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1.1fr 1fr' },
          gap: 2,
        }}
      >
        <Panel
          title="Users by role"
          subtitle="Super Admin, Admin, and below"
          tooltip="Hover bars to see exact user counts per role."
        >
          <HorizontalBarChart
            data={roleChartData}
            emptyMessage="No role data yet"
            height={240}
          />
        </Panel>

        <Panel
          title="Recent organizations"
          tooltip="Newest organizations on the platform"
          action={
            <Button
              component={RouterLink}
              to="/platform/organizations"
              size="small"
              sx={{ textTransform: 'none' }}
            >
              All
            </Button>
          }
        >
          {recentOrgs.length === 0 ? (
            <EmptyState message="No organizations yet" />
          ) : (
            recentOrgs.map((org) => {
              const count = org._count as { users?: number; workspaces?: number } | undefined;
              const plan = org.currentPlan as { name?: string } | null;
              return (
                <Box
                  key={String(org.id)}
                  component={RouterLink}
                  to={`/platform/organizations/${org.id}`}
                  title={`Open ${String(org.name)}`}
                  sx={{
                    display: 'block',
                    py: 1,
                    px: 1,
                    mx: -1,
                    borderRadius: '6px',
                    textDecoration: 'none',
                    color: cv.textPrimary,
                    borderBottom: `1px solid ${cv.border}`,
                    transition: 'background 0.15s ease',
                    '&:last-child': { borderBottom: 'none' },
                    '&:hover': {
                      background: cv.purpleSurface,
                      color: cv.brandOrchid,
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
                      {String(org.name)}
                    </Typography>
                    <StatusChip status={String(org.status || 'active')} />
                  </Box>
                  <Typography sx={{ fontSize: '0.7rem', color: cv.textMuted, mt: 0.35 }}>
                    {plan?.name || String(org.planType)} · {count?.users ?? 0} users ·{' '}
                    {count?.workspaces ?? 0} workspaces
                  </Typography>
                </Box>
              );
            })
          )}
        </Panel>
      </Box>
    </Box>
  );
}
