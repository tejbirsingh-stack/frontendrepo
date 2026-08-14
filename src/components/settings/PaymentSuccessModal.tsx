import React from 'react';
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
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import { cv } from '../../theme/cssVars';
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
}: PaymentSuccessModalProps) {
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
      maxWidth="xs"
      fullWidth
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(8px)',
          },
        },
      }}
      PaperProps={{
        style: { backgroundColor: '#13111e', backgroundImage: 'none' },
        sx: {
          backgroundColor: '#13111e !important',
          backgroundImage: 'none !important',
          border: '1px solid rgba(34, 197, 94, 0.4)',
          borderRadius: '24px',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.9), 0 0 40px rgba(34, 197, 94, 0.3)',
          p: 1,
          color: '#ffffff',
        },
      }}
    >
      <DialogContent sx={{ textAlign: 'center', py: 4, px: 3 }}>
        {/* Animated Check Icon */}
        <Box
          sx={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.4))',
            border: '2px solid #22c55e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 2.5,
            boxShadow: '0 0 24px rgba(34, 197, 94, 0.4)',
          }}
        >
          <CheckCircleOutlinedIcon sx={{ fontSize: 44, color: '#22c55e' }} />
        </Box>

        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: '#ffffff' }}>
          Payment Successful!
        </Typography>
        <Typography variant="body2" sx={{ color: cv.textMuted, mb: 3 }}>
          Thank you for upgrading your organization plan. Your subscription is now active.
        </Typography>

        {/* Receipt Details Box */}
        <Box
          sx={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            p: 2.5,
            mb: 3,
            textAlign: 'left',
          }}
        >
          <Stack spacing={1.5}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ color: cv.textMuted }}>
                Plan
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#ffffff' }}>
                {details.planName} Tier
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ color: cv.textMuted }}>
                Billing Cycle
              </Typography>
              <Typography variant="body2" sx={{ color: '#ffffff', textTransform: 'capitalize' }}>
                {details.billingCycle}
              </Typography>
            </Box>

            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)', my: 0.5 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ color: cv.textMuted, fontWeight: 500 }}>
                Amount Paid
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#22c55e' }}>
                {formattedAmount}
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* Action Buttons */}
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
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              color: '#ffffff',
              fontWeight: 600,
              py: 1.2,
              borderRadius: '12px',
              textTransform: 'none',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #4f46e5, #4338ca)',
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
                borderColor: 'rgba(255, 255, 255, 0.15)',
                color: cv.textPrimary,
                fontWeight: 500,
                py: 1.1,
                borderRadius: '12px',
                textTransform: 'none',
                '&:hover': {
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  background: 'rgba(255, 255, 255, 0.04)',
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
              '&:hover': { color: '#ffffff' },
            }}
          >
            Close
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
