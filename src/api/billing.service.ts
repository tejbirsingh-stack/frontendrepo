import { apiClient } from './client';

export const billingService = {
  /**
   * Creates a Stripe Checkout session and returns the checkout URL.
   * @param priceId The Stripe Price ID
   */
  createCheckoutSession: async (priceId: string): Promise<{ url: string }> => {
    return apiClient('/stripe/checkout', {
      method: 'POST',
      body: JSON.stringify({ priceId }),
    });
  },

  /**
   * Creates a Stripe Customer Portal session and returns the URL.
   */
  createPortalSession: async (): Promise<{ url: string }> => {
    return apiClient('/stripe/portal', {
      method: 'POST',
    });
  },
};
