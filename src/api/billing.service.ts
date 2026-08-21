import { apiClient } from './client';
import { getAccessToken } from '../auth/authTokenBridge';
import { env } from '../config/env';
import toast from 'react-hot-toast';

export const billingService = {
  /**
   * Creates a Stripe Checkout session and returns the checkout URL.
   * @param priceId The Stripe Price ID
   */
  createCheckoutSession: async (priceId: string, useSavedCard: boolean = true): Promise<{ url?: string; directUpgrade?: boolean; message?: string }> => {
    return apiClient.post<{ url?: string; directUpgrade?: boolean; message?: string }>('/stripe/checkout', { priceId, useSavedCard });
  },

  /**
   * Creates a Stripe Customer Portal session and returns the URL.
   */
  createPortalSession: async (): Promise<{ url: string }> => {
    return apiClient.post<{ url: string }>('/stripe/portal');
  },

  /**
   * Syncs a completed Stripe Checkout session with the database plan.
   */
  syncSession: async (sessionId: string): Promise<any> => {
    return apiClient.post<any>('/stripe/sync-session', { sessionId });
  },
  /**
   * Fetches all active Stripe subscriptions and scheduled downgrades.
   */
  getSubscriptions: async (): Promise<{
    success: boolean;
    subscriptions: any[];
    scheduledDowngrade?: {
      planId: string;
      planName: string;
      billingCycle: string;
      effectiveDate: string;
    } | null;
  }> => {
    return apiClient.get<{ success: boolean; subscriptions: any[]; scheduledDowngrade?: any }>('/stripe/subscriptions');
  },

  /**
   * Cancels a scheduled plan downgrade, restoring active current plan status.
   */
  cancelScheduledDowngrade: async (): Promise<{ success: boolean; message: string }> => {
    return apiClient.post<{ success: boolean; message: string }>('/stripe/cancel-scheduled-downgrade');
  },

  /**
   * Cancels a specific active subscription at period end.
   */
  cancelSubscription: async (subscriptionId?: string): Promise<{ success: boolean; message: string }> => {
    return apiClient.post<{ success: boolean; message: string }>('/stripe/cancel-subscription', { subscriptionId });
  },

  /**
   * Resumes a canceled subscription (un-cancel at period end).
   */
  resumeSubscription: async (subscriptionId?: string): Promise<{ success: boolean; message: string }> => {
    return apiClient.post<{ success: boolean; message: string }>('/stripe/resume-subscription', { subscriptionId });
  },

  /**
   * Creates a SetupIntent clientSecret for adding a card in-app.
   */
  createSetupIntent: async (): Promise<{ success: boolean; clientSecret: string }> => {
    return apiClient.post<{ success: boolean; clientSecret: string }>('/stripe/setup-intent');
  },

  /**
   * Fetches saved credit cards attached to the organization.
   */
  getPaymentMethods: async (): Promise<{ success: boolean; cards: any[]; defaultPaymentMethodId: string | null }> => {
    return apiClient.get<{ success: boolean; cards: any[]; defaultPaymentMethodId: string | null }>('/stripe/payment-methods');
  },

  /**
   * Sets default credit card for organization.
   */
  setDefaultCard: async (paymentMethodId: string): Promise<{ success: boolean; message: string }> => {
    return apiClient.post<{ success: boolean; message: string }>('/stripe/set-default-card', { paymentMethodId });
  },

  /**
   * Removes a saved credit card.
   */
  deleteCard: async (paymentMethodId: string): Promise<{ success: boolean; message: string }> => {
    return apiClient.post<{ success: boolean; message: string }>('/stripe/delete-card', { paymentMethodId });
  },

  /**
   * Fetches billing address and invoice config for the organization.
   */
  getBillingDetails: async (): Promise<{ success: boolean; billingAddress: any; invoiceConfig: any }> => {
    return apiClient.get<{ success: boolean; billingAddress: any; invoiceConfig: any }>('/stripe/billing-details');
  },

  /**
   * Updates organization billing address.
   */
  updateBillingAddress: async (data: {
    companyName?: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  }): Promise<{ success: boolean; message: string; billingAddress: any }> => {
    return apiClient.post<{ success: boolean; message: string; billingAddress: any }>('/stripe/billing-address', data);
  },

  /**
   * Updates organization invoice configuration.
   */
  updateInvoiceConfig: async (data: {
    companyName?: string;
    taxId?: string;
    invoiceEmail?: string;
    billingContact?: string;
  }): Promise<{ success: boolean; message: string; invoiceConfig: any }> => {
    return apiClient.post<{ success: boolean; message: string; invoiceConfig: any }>('/stripe/invoice-config', data);
  },

  /**
   * Fetches historical invoices for the organization.
   */
  getInvoices: async (): Promise<{
    success: boolean;
    invoices: Array<{
      id: string;
      invoiceNumber: string;
      date: string;
      createdTimestamp: number;
      description: string;
      status: string;
      amount: string;
      amountCents: number;
      invoicePdf: string | null;
      invoiceUrl: string | null;
    }>;
    stats: {
      totalInvoices: number;
      lastPaymentDate: string;
      lifetimeSpend: string;
    };
  }> => {
    return apiClient.get<{ success: boolean; invoices: any[]; stats: any }>('/stripe/invoices');
  },

  /**
   * Downloads or opens custom generated PDF invoice
   */
  downloadCustomInvoicePdf: async (invoicePdfUrl?: string | null, invoiceId?: string, sessionId?: string): Promise<void> => {
    try {
      const token = getAccessToken();
      const baseUrl = (env.apiBaseUrl || '/api').replace(/\/$/, '');

      let path = '/stripe/download-invoice-pdf';
      if (invoiceId) {
        path = `/stripe/invoices/${invoiceId}/download-pdf`;
      } else if (invoicePdfUrl && invoicePdfUrl.includes('/invoices/') && invoicePdfUrl.includes('/download-pdf')) {
        path = invoicePdfUrl.replace(/^\/api/, '');
      } else if (sessionId) {
        path = `/stripe/download-invoice-pdf?sessionId=${encodeURIComponent(sessionId)}`;
      }

      const fullUrl = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
      const headers: Record<string, string> = { Accept: 'application/pdf' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(fullUrl, {
        method: 'GET',
        headers,
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error(`Failed to generate custom invoice PDF (HTTP ${res.status})`);
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `Invoice-${invoiceId || 'document'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 2000);
    } catch (err: any) {
      console.error('[BillingService] Custom PDF download error:', err);
      toast.error(err?.message || 'Failed to download custom invoice PDF');
    }
  },
};
