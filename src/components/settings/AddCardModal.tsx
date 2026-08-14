import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  Typography,
  Box,
  Button,
  TextField,
  CircularProgress,
  Stack,
} from '@mui/material';
import CreditCardOutlinedIcon from '@mui/icons-material/CreditCardOutlined';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { toast } from 'react-hot-toast';
import { billingService } from '../../api/billing.service';

const cardElementOptions = {
  style: {
    base: {
      fontSize: '15px',
      color: '#ffffff',
      fontFamily: 'Inter, system-ui, sans-serif',
      '::placeholder': {
        color: 'rgba(255, 255, 255, 0.4)',
      },
      iconColor: '#a855f7',
    },
    invalid: {
      color: '#ef4444',
      iconColor: '#ef4444',
    },
  },
};

interface AddCardFormProps {
  clientSecret: string;
  onSuccess: () => void;
  onClose: () => void;
}

const AddCardForm: React.FC<AddCardFormProps> = ({ clientSecret, onSuccess, onClose }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [nameOnCard, setNameOnCard] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    try {
      setLoading(true);
      const { setupIntent, error } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: nameOnCard || undefined,
          },
        },
      });

      if (error) {
        toast.error(error.message || 'Failed to confirm card details');
        setLoading(false);
        return;
      }

      if (setupIntent && setupIntent.status === 'succeeded') {
        const pmId = typeof setupIntent.payment_method === 'string'
          ? setupIntent.payment_method
          : setupIntent.payment_method?.id;

        if (pmId) {
          await billingService.setDefaultCard(pmId);
        }

        toast.success('Payment method saved and set as default!');
        onSuccess();
        onClose();
      } else {
        toast.error('Card verification was not completed.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Error saving card');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <TextField
        label="Name on Card"
        placeholder="e.g. Jane Doe"
        value={nameOnCard}
        onChange={(e) => setNameOnCard(e.target.value)}
        fullWidth
        size="small"
        required
        variant="outlined"
        InputLabelProps={{ style: { color: 'rgba(255, 255, 255, 0.6)' } }}
        InputProps={{
          style: { color: '#ffffff', backgroundColor: 'rgba(255, 255, 255, 0.04)', borderRadius: '10px' },
        }}
      />

      <Box>
        <Typography sx={{ fontSize: '0.8125rem', color: 'rgba(255, 255, 255, 0.6)', mb: 1 }}>
          Card Details
        </Typography>
        <Box
          sx={{
            p: 2,
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            transition: 'border-color 0.2s ease',
            '&:focus-within': {
              borderColor: '#a855f7',
            },
          }}
        >
          <CardElement options={cardElementOptions} />
        </Box>
      </Box>

      <Stack direction="row" spacing={1.5} sx={{ mt: 1 }}>
        <Button
          variant="outlined"
          onClick={onClose}
          disabled={loading}
          sx={{
            flex: 1,
            borderRadius: '10px',
            borderColor: 'rgba(255, 255, 255, 0.16)',
            color: '#ffffff',
            textTransform: 'none',
            py: 1.2,
            '&:hover': { borderColor: 'rgba(255, 255, 255, 0.3)' },
          }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={!stripe || loading}
          sx={{
            flex: 1,
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
            color: '#ffffff',
            fontWeight: 600,
            textTransform: 'none',
            py: 1.2,
            '&:hover': { background: 'linear-gradient(135deg, #9333ea 0%, #6d28d9 100%)' },
          }}
        >
          {loading ? <CircularProgress size={20} color="inherit" /> : 'Save Payment Card'}
        </Button>
      </Stack>
    </Box>
  );
};

interface AddCardModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddCardModal: React.FC<AddCardModalProps> = ({ open, onClose, onSuccess }) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripePromise, setStripePromise] = useState<any>(null);
  const [loadingSecret, setLoadingSecret] = useState(false);

  useEffect(() => {
    if (open) {
      const fetchSecret = async () => {
        try {
          setLoadingSecret(true);
          const res = await billingService.createSetupIntent();
          if (res?.clientSecret) {
            setClientSecret(res.clientSecret);
            if (res.publishableKey) {
              setStripePromise(loadStripe(res.publishableKey));
            }
          } else {
            toast.error('Could not initialize card setup');
          }
        } catch (err: any) {
          toast.error(err?.message || 'Failed to initialize payment form');
        } finally {
          setLoadingSecret(false);
        }
      };
      fetchSecret();
    } else {
      setClientSecret(null);
      setStripePromise(null);
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          backgroundColor: '#13111e',
          backgroundImage: 'none',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '16px',
          maxWidth: 460,
          width: '100%',
          p: 1,
          backdropFilter: 'blur(20px)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
        },
      }}
    >
      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: '12px',
              background: 'rgba(168, 85, 247, 0.12)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#a855f7',
            }}
          >
            <CreditCardIcon fontSize="small" />
          </Box>
          <Box>
            <Typography sx={{ fontSize: '1.25rem', fontWeight: 600, color: '#ffffff' }}>
              Add Payment Card
            </Typography>
            <Typography sx={{ fontSize: '0.8125rem', color: 'rgba(255, 255, 255, 0.6)' }}>
              Your card will be saved securely for subscription renewals.
            </Typography>
          </Box>
        </Box>

        {loadingSecret || !clientSecret ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress color="secondary" />
          </Box>
        ) : (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <AddCardForm clientSecret={clientSecret} onSuccess={onSuccess} onClose={onClose} />
          </Elements>
        )}
      </DialogContent>
    </Dialog>
  );
};
