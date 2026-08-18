import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  Stack,
  Divider,
} from '@mui/material';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import DownloadIcon from '@mui/icons-material/Download';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { cv } from '../../theme/cssVars';

const dialogPaperSx = {
  borderRadius: '20px',
  border: `1px solid ${cv.border}`,
  background: cv.dialogSurface,
  backgroundImage: 'none',
  backdropFilter: 'blur(40px) saturate(180%)',
  boxShadow: cv.dialogShadow,
  maxWidth: 440,
};

export interface CheckoutDetails {
  planName: string;
  billingCycle: 'annual' | 'monthly';
  amountPaidCents: number;
  currency: string;
  invoicePdf?: string | null;
  invoiceUrl?: string | null;
  sessionId?: string;
}

interface PaymentSuccessModalProps {
  open: boolean;
  onClose: () => void;
  details: CheckoutDetails | null;
  onManageBilling?: () => void;
}

export default function PaymentSuccessModal({
  open,
  onClose,
  details,
  onManageBilling,
}: Readonly<PaymentSuccessModalProps>) {
  if (!details) return null;

  const formattedAmount = (details.amountPaidCents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: details.currency.toUpperCase() || 'USD',
  });

  const invoiceLink = details.invoicePdf || details.invoiceUrl;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      aria-labelledby="payment-success-title"
      aria-describedby="payment-success-description"
      slotProps={{
        paper: { sx: dialogPaperSx },
        backdrop: {
          sx: { backgroundColor: cv.backdropScrim, backdropFilter: 'blur(4px)' },
        },
      }}
    >
      <DialogContent sx={{ textAlign: 'center', py: 3, px: 3 }}>
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            backgroundColor: cv.successSurface,
            border: `1px solid ${cv.success}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 2.5,
            color: cv.success,
          }}
        >
          <CheckCircleOutlinedIcon sx={{ fontSize: 36 }} />
        </Box>

        <Typography
          id="payment-success-title"
          variant="h5"
          sx={{ fontWeight: 700, mb: 1, color: cv.textPrimary, letterSpacing: '-0.02em' }}
        >
          Payment Successful!
        </Typography>
        <Typography
          id="payment-success-description"
          variant="body2"
          sx={{ color: cv.textSecondary, lineHeight: 1.55, mb: 3 }}
        >
          Thank you for upgrading your organization plan. Your subscription is now active.
        </Typography>

        <Box
          sx={{
            backgroundColor: cv.surface,
            borderRadius: '12px',
            border: `1px solid ${cv.border}`,
            p: 2,
            mb: 3,
            textAlign: 'left',
          }}
        >
          <Stack spacing={1.5}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ color: cv.textMuted }}>
                Plan
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: cv.textPrimary }}>
                {details.planName} Tier
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ color: cv.textMuted }}>
                Billing Cycle
              </Typography>
              <Typography variant="body2" sx={{ color: cv.textPrimary, textTransform: 'capitalize' }}>
                {details.billingCycle}
              </Typography>
            </Box>

            <Divider sx={{ borderColor: cv.dividerSubtle, my: 0.5 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ color: cv.textMuted, fontWeight: 500 }}>
                Amount Paid
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: cv.successText }}>
                {formattedAmount}
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Stack spacing={1.5}>
          <Button
            variant="contained"
            fullWidth
            startIcon={<DownloadIcon />}
            onClick={() => {
              if (invoiceLink) {
                window.open(invoiceLink, '_blank', 'noopener,noreferrer');
              } else if (onManageBilling) {
                onManageBilling();
              }
            }}
            sx={{
              background: cv.brandGradient,
              color: cv.textOnCta,
              fontWeight: 600,
              py: 1.25,
              borderRadius: '10px',
              textTransform: 'none',
              boxShadow: cv.brandShadowSoft,
              '&:hover': {
                background: cv.brandGradientHover,
                boxShadow: cv.brandShadowStrong,
              },
            }}
          >
            Download Invoice PDF
          </Button>

          {onManageBilling && (
            <Button
              variant="outlined"
              fullWidth
              startIcon={<OpenInNewIcon />}
              onClick={onManageBilling}
              sx={{
                borderColor: cv.border,
                color: cv.textSecondary,
                fontWeight: 500,
                py: 1.1,
                borderRadius: '10px',
                textTransform: 'none',
                '&:hover': {
                  borderColor: cv.borderFocus,
                  backgroundColor: cv.surfaceHover,
                  color: cv.textPrimary,
                },
              }}
            >
              Manage Billing & Invoices
            </Button>
          )}

          <Button
            variant="text"
            fullWidth
            onClick={onClose}
            sx={{
              color: cv.textMuted,
              fontWeight: 500,
              pt: 1,
              textTransform: 'none',
              borderRadius: '10px',
              '&:hover': { color: cv.textPrimary, backgroundColor: cv.surfaceHover },
            }}
          >
            Close
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
