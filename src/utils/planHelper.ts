import type { AuthSessionUser } from '../auth/types';

export interface DynamicPlanDetails {
  planName: string;
  planId: string;
  billingCycle: 'monthly' | 'annual';
  billingTermLabel: string;
  freeTrialExpiry: string;
  expiryDateFormatted: string;
  subtotal: string;
  salesTaxPercent: number;
  salesTaxAmount: string;
  total: string;
  lineItems: Array<{
    description: string;
    quantity: string;
    unitPrice: string;
    subtotal: string;
  }>;
}

export function getDynamicPlanDetails(user: AuthSessionUser | null | undefined): DynamicPlanDetails {
  const org = user?.organization;
  const rawPlanId = (org?.planType || user?.planType || 'free').toLowerCase();
  const metadata = (org?.metadata as Record<string, any>) || {};
  const rawBillingCycle = (metadata?.billingCycle || 'annual').toLowerCase();
  const isMonthly = rawBillingCycle === 'monthly';

  // For Free plan, expiry date is strictly 3 days from creation/signup date (e.g., Aug 10 -> Aug 13)
  let expiryDate: Date;
  if (rawPlanId === 'free') {
    const creationDateStr = metadata?.planSelectedAt || org?.createdAt || user?.createdAt || new Date().toISOString();
    const creationDate = new Date(creationDateStr);
    expiryDate = new Date(isNaN(creationDate.getTime()) ? Date.now() : creationDate.getTime());
    expiryDate.setDate(expiryDate.getDate() + 3);
  } else if (metadata?.expiresAt) {
    expiryDate = new Date(metadata.expiresAt);
  } else {
    const planSelectedAt = metadata?.planSelectedAt || org?.createdAt || new Date().toISOString();
    const startDate = new Date(planSelectedAt);
    expiryDate = new Date(startDate);
    if (isNaN(expiryDate.getTime())) {
      expiryDate.setTime(Date.now());
    }
    if (isMonthly) {
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    } else {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    }
  }

  const formattedExpiry = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(expiryDate);

  const billingTermLabel =
    rawPlanId === 'free'
      ? '3 Days'
      : isMonthly
      ? 'Monthly'
      : 'Annual (Billed Yearly)';

  // Catalog prices & limits definition
  const planCatalog: Record<
    string,
    {
      name: string;
      monthlyPrice: number;
      annualMonthlyEquivalent: number;
      annualTotal: number;
      membersCount: number;
    }
  > = {
    free: {
      name: 'Free Plan',
      monthlyPrice: 0,
      annualMonthlyEquivalent: 0,
      annualTotal: 0,
      membersCount: org?.maxUsers || 5,
    },
    basic: {
      name: 'Basic Plan',
      monthlyPrice: 10,
      annualMonthlyEquivalent: 9,
      annualTotal: 108,
      membersCount: org?.maxUsers || 5,
    },
    premium: {
      name: 'Premium Plan',
      monthlyPrice: 25,
      annualMonthlyEquivalent: 23,
      annualTotal: 270,
      membersCount: org?.maxUsers || 10,
    },
    enterprise: {
      name: 'Enterprise Plan',
      monthlyPrice: 50,
      annualMonthlyEquivalent: 45,
      annualTotal: 540,
      membersCount: org?.maxUsers || 15,
    },
  };

  const planInfo = planCatalog[rawPlanId] || planCatalog.free;

  // Subtotal calculation
  let subtotalAmount = 0;
  let unitPriceText = '';
  if (rawPlanId === 'free') {
    subtotalAmount = 0;
    unitPriceText = '$0.00 /mo.';
  } else if (isMonthly) {
    subtotalAmount = planInfo.monthlyPrice;
    unitPriceText = `$${planInfo.monthlyPrice.toFixed(2)} /mo.`;
  } else {
    subtotalAmount = planInfo.annualTotal;
    unitPriceText = `$${planInfo.annualMonthlyEquivalent.toFixed(2)} /mo. ($${planInfo.annualTotal.toFixed(2)}/yr)`;
  }

  // Read pricing directly from DB metadata if present, else fallback
  const subtotalCents = metadata?.subtotalCents ?? Math.round(subtotalAmount * 100);
  const taxCents = metadata?.taxCents ?? Math.round(subtotalCents * 0.06);
  const totalCents = metadata?.totalCents ?? (subtotalCents + taxCents);

  const subtotalFormatted = `$${(subtotalCents / 100).toFixed(2)}`;
  const taxFormatted = `$${(taxCents / 100).toFixed(2)}`;
  const totalFormatted = `$${(totalCents / 100).toFixed(2)}`;

  return {
    planName: planInfo.name,
    planId: rawPlanId,
    billingCycle: isMonthly ? 'monthly' : 'annual',
    billingTermLabel,
    freeTrialExpiry: formattedExpiry,
    expiryDateFormatted: formattedExpiry,
    subtotal: subtotalFormatted,
    salesTaxPercent: 6,
    salesTaxAmount: taxFormatted,
    total: totalFormatted,
    lineItems: [
      {
        description: `${planInfo.name} membership`,
        quantity: `${planInfo.membersCount} Member${planInfo.membersCount > 1 ? 's' : ''} Included`,
        unitPrice: unitPriceText,
        subtotal: subtotalFormatted,
      },
    ],
  };
}
