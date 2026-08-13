import { useMemo, useState } from 'react';
import { cv } from '../../theme/cssVars';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from '@mui/material';
import CreditCardOutlinedIcon from '@mui/icons-material/CreditCardOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import SettingsAdminToolbar from './SettingsAdminToolbar';
import SettingsDataTable, { type SettingsTableColumn } from './SettingsDataTable';
import TruncatedText from '../TruncatedText';
import { useAuth } from '../../auth/AuthContext';
import { getDynamicPlanDetails } from '../../utils/planHelper';
import {
  MOCK_BILLING_DETAILS,
  MOCK_BILLING_INVOICES,
  MOCK_CURRENT_PLAN,
  MOCK_PAYMENT_INVOICE_CONFIG,
  formatBillingAddress,
  formatPaymentMethod,
  type BillingInvoiceRow,
} from '../../data/mockSettingsData';
import { SETTINGS_BASE_PATH } from '../../constants/settingsNav';

const outlineButtonSx = {
  borderColor: cv.border,
  color: cv.textPrimary,
  textTransform: 'none' as const,
  borderRadius: '10px',
  '&:hover': { borderColor: cv.borderFocus, backgroundColor: cv.surfaceHover },
};

const containedButtonSx = {
  textTransform: 'none' as const,
  borderRadius: '10px',
  background: cv.brandGradient,
  boxShadow: 'none',
  '&:hover': { boxShadow: 'none', opacity: 0.92 },
};

const tabSx = {
  minHeight: 40,
  mb: 2.5,
  borderBottom: `1px solid ${cv.divider}`,
  '& .MuiTab-root': {
    minHeight: 40,
    py: 0.5,
    px: 0,
    mr: 3,
    fontSize: '0.9375rem',
    fontWeight: 500,
    color: cv.textSecondary,
    textTransform: 'none',
    minWidth: 'auto',
  },
  '& .Mui-selected': {
    color: `${cv.textPrimary} !important`,
  },
  '& .MuiTabs-indicator': {
    background: cv.brandGradient,
    height: 2,
    borderRadius: '2px',
  },
};

const panelSx = {
  borderRadius: '12px',
  border: `1px solid ${cv.border}`,
  backgroundColor: cv.surfaceMuted,
  overflow: 'hidden',
};

const panelHeaderSx = {
  px: 2,
  py: 1.5,
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  borderBottom: `1px solid ${cv.dividerSubtle}`,
};

const tableTextSx = { fontSize: '0.875rem', color: cv.textPrimary };

function tableText(value: string) {
  return <TruncatedText text={value} sx={tableTextSx} />;
}

function InvoiceStatusChip({ status }: { status: BillingInvoiceRow['status'] }) {
  const styles =
    status === 'Paid'
      ? { color: cv.successText, backgroundColor: cv.successSurface }
      : status === 'Pending'
        ? { color: cv.warning, backgroundColor: cv.warningSurface }
        : { color: cv.errorText, backgroundColor: cv.destructiveHover };

  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        px: 1,
        py: 0.25,
        borderRadius: '999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        ...styles,
      }}
    >
      {status}
    </Box>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 140,
        px: 2,
        py: 1.5,
        borderRadius: '10px',
        border: `1px solid ${cv.border}`,
        backgroundColor: cv.surfaceSubtle,
      }}
    >
      <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted, fontWeight: 500 }}>
        {label}
      </Typography>
      <Typography sx={{ mt: 0.5, fontSize: '1rem', fontWeight: 600, color: cv.textPrimary }}>
        {value}
      </Typography>
    </Box>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted, fontWeight: 500 }}>
        {label}
      </Typography>
      <Typography sx={{ mt: 0.35, fontSize: '0.875rem', color: cv.textPrimary, lineHeight: 1.5 }}>
        {value}
      </Typography>
    </Box>
  );
}

function BillingOverviewTab() {
  const { user } = useAuth();
  const plan = useMemo(() => getDynamicPlanDetails(user), [user]);
  const billing = MOCK_BILLING_DETAILS;
  const paymentConfig = MOCK_PAYMENT_INVOICE_CONFIG;
  const cardSummary = formatPaymentMethod(billing.paymentMethod);
  const companyName =
    paymentConfig.companyName === 'Not set' ? billing.billingContact.company : paymentConfig.companyName;
  const taxId =
    paymentConfig.taxId === 'Not set'
      ? billing.billingContact.taxId ?? paymentConfig.taxId
      : paymentConfig.taxId;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <Box
        sx={{
          ...panelSx,
          p: 2.5,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 2,
          background:
            cv.billingHeroGradient,
        }}
      >
        <Box sx={{ flex: 1, minWidth: 240 }}>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: cv.textMuted, letterSpacing: '0.06em' }}>
            CURRENT SUBSCRIPTION
          </Typography>
          <Typography sx={{ mt: 0.75, fontSize: '1.375rem', fontWeight: 600, color: cv.textPrimary }}>
            {plan.planName}
          </Typography>
          <Box sx={{ mt: 1.25, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted }}>Next charge</Typography>
              <Typography sx={{ mt: 0.25, fontSize: '0.9375rem', fontWeight: 600, color: cv.textPrimary }}>
                {plan.expiryDateFormatted} · {plan.total}
              </Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted }}>Billing cycle</Typography>
              <Typography sx={{ mt: 0.25, fontSize: '0.9375rem', fontWeight: 600, color: cv.textPrimary }}>
                {plan.billingTermLabel}
              </Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted }}>Subscription expiry</Typography>
              <Typography sx={{ mt: 0.25, fontSize: '0.9375rem', fontWeight: 600, color: cv.textPrimary }}>
                {plan.expiryDateFormatted}
              </Typography>
            </Box>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <Button variant="outlined" size="small" sx={outlineButtonSx}>
            {billing.isFreePlanActive ? 'Cancel free trial' : 'Cancel plan'}
          </Button>
          <Button
            component={RouterLink}
            to={`${SETTINGS_BASE_PATH}/accounts/plan`}
            variant="contained"
            size="small"
            sx={containedButtonSx}
          >
            Manage plan
          </Button>
        </Box>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
          gap: 2,
        }}
      >
        <Box sx={panelSx}>
          <Box sx={panelHeaderSx}>
            <CreditCardOutlinedIcon sx={{ fontSize: 18, color: cv.textSecondary }} />
            <Typography sx={{ fontSize: '0.9375rem', fontWeight: 600, color: cv.textPrimary }}>
              Payment method
            </Typography>
          </Box>
          <Box sx={{ px: 2, py: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
              <Box>
                <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: cv.textPrimary }}>
                  {cardSummary}
                </Typography>
                <Typography sx={{ mt: 0.35, fontSize: '0.8125rem', color: cv.textSecondary }}>
                  {billing.paymentMethod.nameOnCard}
                </Typography>
                <Typography sx={{ mt: 0.25, fontSize: '0.8125rem', color: cv.textMuted }}>
                  Expires {String(billing.paymentMethod.expMonth).padStart(2, '0')}/
                  {billing.paymentMethod.expYear}
                </Typography>
              </Box>
              <Button variant="outlined" size="small" sx={outlineButtonSx}>
                {paymentConfig.hasCardOnFile ? 'Edit card' : 'Add card'}
              </Button>
            </Box>

            <Box sx={{ borderTop: `1px solid ${cv.dividerSubtle}`, pt: 2 }}>
              <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: cv.textSecondary, mb: 1.5 }}>
                Subscription breakdown
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: cv.textMuted, borderColor: cv.border, py: 1, px: 0 }}>
                      Item
                    </TableCell>
                    <TableCell align="right" sx={{ color: cv.textMuted, borderColor: cv.border, py: 1, px: 0 }}>
                      Amount
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {plan.lineItems.map((item) => (
                    <TableRow key={item.description}>
                      <TableCell sx={{ color: cv.textPrimary, borderColor: 'transparent', py: 0.75, px: 0 }}>
                        <Typography sx={{ fontSize: '0.8125rem' }}>{item.description}</Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted }}>
                          {item.quantity} · {item.unitPrice}
                        </Typography>
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ color: cv.textPrimary, borderColor: 'transparent', py: 0.75, px: 0 }}
                      >
                        {item.subtotal}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell sx={{ color: cv.textSecondary, borderColor: cv.border, py: 1, px: 0 }}>
                      Sales tax ({plan.salesTaxPercent}%)
                    </TableCell>
                    <TableCell align="right" sx={{ color: cv.textSecondary, borderColor: cv.border, py: 1, px: 0 }}>
                      {plan.salesTaxAmount}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ color: cv.textPrimary, fontWeight: 600, borderColor: 'transparent', py: 1, px: 0 }}>
                      Total
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ color: cv.textPrimary, fontWeight: 600, borderColor: 'transparent', py: 1, px: 0 }}
                    >
                      {plan.total}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={panelSx}>
            <Box sx={panelHeaderSx}>
              <LocationOnOutlinedIcon sx={{ fontSize: 18, color: cv.textSecondary }} />
              <Typography sx={{ fontSize: '0.9375rem', fontWeight: 600, color: cv.textPrimary }}>
                Billing address
              </Typography>
              <Box sx={{ flex: 1 }} />
              <Button variant="outlined" size="small" sx={outlineButtonSx}>
                Edit
              </Button>
            </Box>
            <Box sx={{ px: 2, py: 2 }}>
              <Typography
                sx={{
                  fontSize: '0.875rem',
                  color: cv.textSecondary,
                  lineHeight: 1.6,
                  whiteSpace: 'pre-line',
                }}
              >
                {formatBillingAddress(billing.billingAddress)}
              </Typography>
              <Typography sx={{ mt: 1.25, fontSize: '0.75rem', color: cv.textMuted }}>
                Used for invoices and US state sales tax calculation.
              </Typography>
            </Box>
          </Box>

          <Box sx={panelSx}>
            <Box sx={panelHeaderSx}>
              <ReceiptLongOutlinedIcon sx={{ fontSize: 18, color: cv.textSecondary }} />
              <Typography sx={{ fontSize: '0.9375rem', fontWeight: 600, color: cv.textPrimary }}>
                Invoice configuration
              </Typography>
              <Box sx={{ flex: 1 }} />
              <Button variant="outlined" size="small" sx={outlineButtonSx}>
                Edit
              </Button>
            </Box>
            <Box
              sx={{
                px: 2,
                py: 2,
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 2,
              }}
            >
              <DetailField label="Company name" value={companyName} />
              <DetailField label="Tax ID" value={taxId} />
              <DetailField label="Invoice email" value={paymentConfig.invoiceEmail} />
              <DetailField label="Billing contact" value={billing.billingContact.email} />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

function BillingInvoicesTab() {
  const [search, setSearch] = useState('');

  const invoiceRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return MOCK_BILLING_INVOICES;
    return MOCK_BILLING_INVOICES.filter((row) =>
      [row.invoiceNumber, row.description, row.date, row.amount, row.status].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
  }, [search]);

  const lastPaidInvoice = MOCK_BILLING_INVOICES[0];
  const paidTotal = MOCK_BILLING_INVOICES.filter((row) => row.status === 'Paid' && row.amount !== '$0.00')
    .reduce((sum, row) => sum + parseFloat(row.amount.replace(/[$,]/g, '')), 0);

  const invoiceColumns: SettingsTableColumn<BillingInvoiceRow>[] = [
    { id: 'date', label: 'Date', width: '14%', render: (row) => tableText(row.date) },
    {
      id: 'reference',
      label: 'Reference',
      width: '16%',
      render: (row) => tableText(row.invoiceNumber),
    },
    { id: 'description', label: 'Description', width: '34%', render: (row) => tableText(row.description) },
    {
      id: 'status',
      label: 'Status',
      width: '12%',
      render: (row) => <InvoiceStatusChip status={row.status} />,
    },
    { id: 'amount', label: 'Amount', width: '12%', align: 'right', render: (row) => row.amount },
    {
      id: 'view',
      label: '',
      width: '12%',
      align: 'right',
      render: () => (
        <Button
          size="small"
          endIcon={<OpenInNewOutlinedIcon sx={{ fontSize: 16 }} />}
          sx={{ color: cv.textSecondary, textTransform: 'none' }}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
        <StatTile label="Total invoices" value={String(MOCK_BILLING_INVOICES.length)} />
        <StatTile label="Last payment" value={lastPaidInvoice?.date ?? '—'} />
        <StatTile
          label="Lifetime spend"
          value={paidTotal > 0 ? `$${paidTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '$0.00'}
        />
      </Box>

      <Box sx={panelSx}>
        <Box sx={{ px: 2, pt: 1.5, pb: 0 }}>
          <SettingsAdminToolbar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by date, reference, or amount…"
            onExport={() => undefined}
          />
        </Box>
        <SettingsDataTable
          columns={invoiceColumns}
          rows={invoiceRows}
          getRowId={(row) => row.id}
          emptyMessage="No invoices match your search."
        />
      </Box>
    </Box>
  );
}

export default function BillingSettingsSection() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Box sx={{ width: '100%' }}>
      <Tabs value={activeTab} onChange={(_, value: number) => setActiveTab(value)} sx={tabSx}>
        <Tab label="Overview" />
        <Tab label="Invoices" />
      </Tabs>

      {activeTab === 0 ? <BillingOverviewTab /> : <BillingInvoicesTab />}
    </Box>
  );
}
