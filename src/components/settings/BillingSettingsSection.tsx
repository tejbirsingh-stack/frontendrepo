import React, { useEffect, useMemo, useState } from 'react';
import { cv } from '../../theme/cssVars';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  IconButton,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from '@mui/material';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import CreditCardOutlinedIcon from '@mui/icons-material/CreditCardOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
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
import { billingService } from '../../api/billing.service';
import { AddCardModal } from './AddCardModal';
import toast from 'react-hot-toast';

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
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const defaultPlan = useMemo(() => getDynamicPlanDetails(user), [user]);
  const billing = MOCK_BILLING_DETAILS;
  const paymentConfig = MOCK_PAYMENT_INVOICE_CONFIG;
  const cardSummary = formatPaymentMethod(billing.paymentMethod);
  const companyName =
    paymentConfig.companyName === 'Not set' ? billing.billingContact.company : paymentConfig.companyName;
  const taxId =
    paymentConfig.taxId === 'Not set'
      ? billing.billingContact.taxId ?? paymentConfig.taxId
      : paymentConfig.taxId;

  const [loadingPortal, setLoadingPortal] = useState(false);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(true);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedSubToCancel, setSelectedSubToCancel] = useState<any | null>(null);
  const [canceling, setCanceling] = useState(false);

  const [savedCards, setSavedCards] = useState<any[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const [addCardModalOpen, setAddCardModalOpen] = useState(false);
  const [deleteCardTarget, setDeleteCardTarget] = useState<any | null>(null);
  const [deletingCard, setDeletingCard] = useState(false);

  const fetchPaymentMethods = async () => {
    try {
      setLoadingCards(true);
      const res = await billingService.getPaymentMethods();
      if (res?.success && Array.isArray(res.cards)) {
        setSavedCards(res.cards);
      }
    } catch (err) {
      console.error('Failed to fetch payment methods', err);
    } finally {
      setLoadingCards(false);
    }
  };

  const handleSetDefaultCard = async (cardId: string) => {
    try {
      toast.loading('Setting default card...', { id: 'card-action' });
      await billingService.setDefaultCard(cardId);
      toast.success('Default payment method updated!', { id: 'card-action' });
      await fetchPaymentMethods();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update default card', { id: 'card-action' });
    }
  };

  const confirmDeleteCard = async () => {
    if (!deleteCardTarget) return;
    try {
      setDeletingCard(true);
      toast.loading('Removing payment card...', { id: 'card-action' });
      await billingService.deleteCard(deleteCardTarget.id);
      toast.success('Payment card removed successfully!', { id: 'card-action' });
      setDeleteCardTarget(null);
      await fetchPaymentMethods();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to remove card', { id: 'card-action' });
    } finally {
      setDeletingCard(false);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      setLoadingSubs(true);
      const res = await billingService.getSubscriptions();
      if (res?.success && Array.isArray(res.subscriptions)) {
        setSubscriptions(res.subscriptions);
      }
    } catch (err) {
      console.error('Failed to fetch subscriptions', err);
    } finally {
      setLoadingSubs(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
    fetchPaymentMethods();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    const success = params.get('success');
    if (success === 'true' && sessionId) {
      toast.loading('Confirming your payment...', { id: 'stripe-sync' });
      billingService
        .syncSession(sessionId)
        .then(async (res) => {
          await refreshUser();
          await fetchSubscriptions();
          toast.success(res?.message || 'Subscription successfully updated!', { id: 'stripe-sync' });
        })
        .catch((err) => {
          console.error('[Stripe Sync Error]', err);
          toast.error(err?.message || 'Failed to sync subscription status', { id: 'stripe-sync' });
        })
        .finally(() => {
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        });
    }
  }, [refreshUser]);

  const handleOpenCancelModal = (sub?: any) => {
    setSelectedSubToCancel(sub || null);
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    try {
      setCanceling(true);
      const subId = selectedSubToCancel?.id;
      const res = await billingService.cancelSubscription(subId);
      toast.success(res?.message || 'Subscription cancellation scheduled.');
      setCancelModalOpen(false);
      await refreshUser();
      await fetchSubscriptions();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to cancel subscription');
    } finally {
      setCanceling(false);
    }
  };

  const [resuming, setResuming] = useState(false);

  const handleResumeSubscription = async (sub?: any) => {
    try {
      setResuming(true);
      const subId = sub?.id;
      const res = await billingService.resumeSubscription(subId);
      toast.success(res?.message || 'Subscription resumed successfully!');
      await refreshUser();
      await fetchSubscriptions();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to resume subscription');
    } finally {
      setResuming(false);
    }
  };

  const handlePortal = async () => {
    try {
      setLoadingPortal(true);
      const res = await billingService.createPortalSession();
      if (res?.url) {
        window.open(res.url, '_blank', 'noopener,noreferrer');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to open billing portal');
    } finally {
      setLoadingPortal(false);
    }
  };

  // Determine single primary active subscription item for the hero panel
  const activeSubItem = useMemo(() => {
    if (subscriptions.length > 0) {
      // Pick the primary active subscription (newest)
      const active = subscriptions[0];
      const amountFormatted = `$${(active.amountCents / 100).toFixed(2)}`;
      const expiryFormatted = new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date(active.currentPeriodEnd));
      return {
        id: active.id,
        planName: active.planName,
        total: amountFormatted,
        billingTermLabel: active.interval === 'year' ? 'Annual' : 'Monthly',
        expiryDateFormatted: expiryFormatted,
        cancelAtPeriodEnd: active.cancelAtPeriodEnd,
        rawSub: active,
      };
    }
    return {
      id: undefined,
      planName: defaultPlan.planName,
      total: defaultPlan.total,
      billingTermLabel: defaultPlan.billingTermLabel,
      expiryDateFormatted: defaultPlan.expiryDateFormatted,
      cancelAtPeriodEnd: false,
      rawSub: null,
    };
  }, [subscriptions, defaultPlan]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* Single Primary Subscription Hero Panel */}
      <Box
        sx={{
          ...panelSx,
          p: 2.5,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 2,
          background: cv.billingHeroGradient,
        }}
      >
        <Box sx={{ flex: 1, minWidth: 240 }}>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: cv.textMuted, letterSpacing: '0.06em' }}>
            CURRENT SUBSCRIPTION
          </Typography>
          <Typography sx={{ mt: 0.75, fontSize: '1.375rem', fontWeight: 600, color: cv.textPrimary }}>
            {activeSubItem.planName}
          </Typography>
          <Box sx={{ mt: 1.25, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted }}>Next charge</Typography>
              <Typography sx={{ mt: 0.25, fontSize: '0.9375rem', fontWeight: 600, color: cv.textPrimary }}>
                {activeSubItem.expiryDateFormatted} · {activeSubItem.total}
              </Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted }}>Billing cycle</Typography>
              <Typography sx={{ mt: 0.25, fontSize: '0.9375rem', fontWeight: 600, color: cv.textPrimary }}>
                {activeSubItem.billingTermLabel}
              </Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: '0.75rem', color: cv.textMuted }}>Subscription expiry</Typography>
              <Typography sx={{ mt: 0.25, fontSize: '0.9375rem', fontWeight: 600, color: cv.textPrimary }}>
                {activeSubItem.expiryDateFormatted}
              </Typography>
            </Box>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          {activeSubItem.cancelAtPeriodEnd ? (
            <Button
              variant="outlined"
              size="small"
              sx={{
                ...outlineButtonSx,
                borderColor: 'rgba(34,197,94,0.5)',
                color: '#22c55e',
                '&:hover': {
                  borderColor: '#22c55e',
                  background: 'rgba(34,197,94,0.1)',
                },
              }}
              disabled={resuming}
              onClick={() => handleResumeSubscription(activeSubItem.rawSub)}
            >
              {resuming ? 'Resuming...' : "Don't cancel subscription"}
            </Button>
          ) : (
            <Button
              variant="outlined"
              size="small"
              sx={outlineButtonSx}
              onClick={() => handleOpenCancelModal(activeSubItem.rawSub)}
            >
              Cancel plan
            </Button>
          )}
          <Button
            variant="contained"
            size="small"
            sx={containedButtonSx}
            onClick={() => navigate('/home/settings/accounts/plan')}
          >
            Manage plan
          </Button>
        </Box>
      </Box>

      {/* Confirmation Modal for Subscription Cancellation */}
      <Dialog
        open={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        PaperProps={{
          sx: {
            backgroundColor: '#13111e',
            backgroundImage: 'none',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '16px',
            maxWidth: 440,
            width: '100%',
            p: 1,
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
          },
        }}
      >
        <DialogContent sx={{ p: 3, textAlign: 'center' }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
            }}
          >
            <WarningAmberOutlinedIcon sx={{ fontSize: 28, color: '#ef4444' }} />
          </Box>
          <Typography sx={{ fontSize: '1.25rem', fontWeight: 600, color: '#ffffff', mb: 1 }}>
            Cancel Subscription?
          </Typography>
          <Typography sx={{ fontSize: '0.875rem', color: cv.textSecondary, mb: 3, lineHeight: 1.6 }}>
            Are you sure you want to cancel your{' '}
            <strong>{selectedSubToCancel?.planName || defaultPlan.planName}</strong>? Your team will retain full access to all features until{' '}
            <strong>
              {selectedSubToCancel
                ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(
                    new Date(selectedSubToCancel.currentPeriodEnd),
                  )
                : defaultPlan.expiryDateFormatted}
            </strong>
            . No further charges will occur.
          </Typography>

          <Stack direction="row" spacing={1.5} justifyContent="center">
            <Button
              variant="outlined"
              onClick={() => setCancelModalOpen(false)}
              sx={{
                flex: 1,
                borderRadius: '10px',
                borderColor: cv.border,
                color: cv.textPrimary,
                textTransform: 'none',
                py: 1,
                '&:hover': { borderColor: cv.borderFocus, backgroundColor: cv.surfaceHover },
              }}
            >
              Keep plan
            </Button>
            <Button
              variant="contained"
              onClick={handleConfirmCancel}
              disabled={canceling}
              sx={{
                flex: 1,
                borderRadius: '10px',
                backgroundColor: '#ef4444',
                color: '#ffffff',
                textTransform: 'none',
                fontWeight: 600,
                py: 1,
                '&:hover': { backgroundColor: '#dc2626' },
              }}
            >
              {canceling ? <CircularProgress size={20} color="inherit" /> : 'Confirm Cancel'}
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>

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
            <Box sx={{ flex: 1 }} />
            <Button
              variant="outlined"
              size="small"
              sx={outlineButtonSx}
              onClick={() => setAddCardModalOpen(true)}
            >
              Add card
            </Button>
          </Box>
          <Box sx={{ px: 2, py: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {savedCards.length > 0 ? (
                savedCards.map((card) => (
                  <Box
                    key={card.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: 2,
                      p: 1.5,
                      borderRadius: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography sx={{ fontSize: '0.9375rem', fontWeight: 600, color: cv.textPrimary, textTransform: 'capitalize' }}>
                          {card.brand} ending in {card.last4}
                        </Typography>
                        {card.isDefault && (
                          <Box
                            sx={{
                              px: 1,
                              py: 0.2,
                              borderRadius: '4px',
                              backgroundColor: 'rgba(34, 197, 94, 0.15)',
                              border: '1px solid rgba(34, 197, 94, 0.3)',
                              color: '#22c55e',
                              fontSize: '0.6875rem',
                              fontWeight: 600,
                            }}
                          >
                            Default
                          </Box>
                        )}
                      </Box>
                      {card.nameOnCard && (
                        <Typography sx={{ mt: 0.35, fontSize: '0.8125rem', color: cv.textSecondary }}>
                          {card.nameOnCard}
                        </Typography>
                      )}
                      <Typography sx={{ mt: 0.25, fontSize: '0.8125rem', color: cv.textMuted }}>
                        Expires {String(card.expMonth).padStart(2, '0')}/{card.expYear}
                      </Typography>
                    </Box>

                    <Stack direction="row" spacing={1} alignItems="center">
                      {!card.isDefault && (
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleSetDefaultCard(card.id)}
                          sx={{
                            fontSize: '0.75rem',
                            py: 0.3,
                            px: 1.2,
                            borderRadius: '8px',
                            borderColor: cv.border,
                            color: cv.textSecondary,
                            textTransform: 'none',
                            '&:hover': { borderColor: cv.borderFocus, backgroundColor: cv.surfaceHover },
                          }}
                        >
                          Make default
                        </Button>
                      )}
                      <IconButton
                        size="small"
                        onClick={() => setDeleteCardTarget(card)}
                        sx={{
                          color: cv.textMuted,
                          '&:hover': { color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)' },
                        }}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Box>
                ))
              ) : loadingCards ? (
                <Box sx={{ display: 'flex', alignItems: 'center', py: 2 }}>
                  <CircularProgress size={20} color="inherit" sx={{ color: cv.textMuted }} />
                </Box>
              ) : (
                <Box sx={{ py: 1 }}>
                  <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: cv.textSecondary }}>
                    No payment cards saved yet.
                  </Typography>
                  <Typography sx={{ mt: 0.5, fontSize: '0.8125rem', color: cv.textMuted }}>
                    Click "Add card" above to securely save a card for future subscription renewals.
                  </Typography>
                </Box>
              )}
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
                  {defaultPlan.lineItems.map((item) => (
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
                      Sales tax ({defaultPlan.salesTaxPercent}%)
                    </TableCell>
                    <TableCell align="right" sx={{ color: cv.textSecondary, borderColor: cv.border, py: 1, px: 0 }}>
                      {defaultPlan.salesTaxAmount}
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
                      {defaultPlan.total}
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

      <AddCardModal
        open={addCardModalOpen}
        onClose={() => setAddCardModalOpen(false)}
        onSuccess={() => {
          fetchPaymentMethods();
          refreshUser();
        }}
      />

      <Dialog
        open={Boolean(deleteCardTarget)}
        onClose={() => !deletingCard && setDeleteCardTarget(null)}
        PaperProps={{
          sx: {
            backgroundColor: '#13111e',
            backgroundImage: 'none',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '16px',
            maxWidth: 420,
            width: '100%',
            p: 1,
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
          },
        }}
      >
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444',
              }}
            >
              <DeleteOutlineIcon fontSize="small" />
            </Box>
            <Box>
              <Typography sx={{ fontSize: '1.125rem', fontWeight: 600, color: '#ffffff' }}>
                Remove Payment Card
              </Typography>
              <Typography sx={{ fontSize: '0.8125rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                This action cannot be undone.
              </Typography>
            </Box>
          </Box>

          {deleteCardTarget && (
            <Typography sx={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.8)', my: 2, lineHeight: 1.5 }}>
              Are you sure you want to remove your <strong style={{ color: '#ffffff', textTransform: 'capitalize' }}>{deleteCardTarget.brand}</strong> card ending in <strong style={{ color: '#ffffff' }}>{deleteCardTarget.last4}</strong>?
            </Typography>
          )}

          <Stack direction="row" spacing={1.5} sx={{ mt: 2.5 }}>
            <Button
              variant="outlined"
              onClick={() => setDeleteCardTarget(null)}
              disabled={deletingCard}
              sx={{
                flex: 1,
                borderRadius: '10px',
                borderColor: 'rgba(255, 255, 255, 0.16)',
                color: '#ffffff',
                textTransform: 'none',
                py: 1,
                '&:hover': { borderColor: 'rgba(255, 255, 255, 0.3)' },
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={confirmDeleteCard}
              disabled={deletingCard}
              sx={{
                flex: 1,
                borderRadius: '10px',
                backgroundColor: '#ef4444',
                color: '#ffffff',
                fontWeight: 600,
                textTransform: 'none',
                py: 1,
                '&:hover': { backgroundColor: '#dc2626' },
              }}
            >
              {deletingCard ? <CircularProgress size={20} color="inherit" /> : 'Remove Card'}
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>
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
