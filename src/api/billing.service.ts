import { apiClient } from './client';

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
   * Fetches all active Stripe subscriptions for the current organization.
   */
  getSubscriptions: async (): Promise<{ success: boolean; subscriptions: any[] }> => {
    return apiClient.get<{ success: boolean; subscriptions: any[] }>('/stripe/subscriptions');
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
};
