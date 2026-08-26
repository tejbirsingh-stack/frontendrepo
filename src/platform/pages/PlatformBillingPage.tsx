import { useState } from 'react';
import { Box, Tab, Tabs } from '@mui/material';
import { PageHeader } from '../components/PlatformUi';
import { cv } from '../../theme/cssVars';
import { PlatformBillingSubscriptionsSection } from '../components/PlatformBillingSubscriptionsSection';
import { PlatformBillingTransactionsSection } from '../components/PlatformBillingTransactionsSection';

export default function PlatformBillingPage() {
  const [tabIndex, setTabIndex] = useState(0);
  const [transactionsOrgId, setTransactionsOrgId] = useState('');

  const handleRowClick = (orgId: string) => {
    setTransactionsOrgId(orgId);
    setTabIndex(1);
  };

  return (
    <Box>
      <PageHeader title="Payment & billing" subtitle="Platform view of subscriptions across orgs" />

      <Tabs
        value={tabIndex}
        onChange={(_e, v) => {
          // If user manually clicks the tab (not via row click), clear the pre-selected org
          if (v !== tabIndex) setTransactionsOrgId('');
          setTabIndex(v);
        }}
        sx={{
          minHeight: 42,
          mb: 2.5,
          borderBottom: `1px solid ${cv.divider}`,
          '& .MuiTab-root': {
            minHeight: 42,
            textTransform: 'none',
            fontWeight: 500,
            color: cv.textSecondary,
            '&.Mui-selected': { color: cv.brandOrchid },
          },
          '& .MuiTabs-indicator': { backgroundColor: cv.brandOrchid },
        }}
      >
        <Tab label="Subscriptions" />
        <Tab label="Transactions & Logs" />
      </Tabs>

      {tabIndex === 0 && <PlatformBillingSubscriptionsSection onRowClick={handleRowClick} />}
      {tabIndex === 1 && <PlatformBillingTransactionsSection defaultOrgId={transactionsOrgId} />}
    </Box>
  );
}
