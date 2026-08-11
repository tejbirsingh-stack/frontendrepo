import { useEffect, useState } from 'react';
import { Box, Button, Typography, keyframes } from '@mui/material';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import LiquidBackground from '../LiquidBackground';
import WaveBackground from '../WaveBackground';
import NoahLogo, { AUTH_LOGO_PARENT_SX, AUTH_LOGO_SX } from '../NoahLogo';
import { cv } from '../../theme/cssVars';
import { fetchPublicCatalogPlans } from '../../platform/api/platformApi';

type BillingCycle = 'annual' | 'monthly';
type PlanId = string;

interface PlanDefinition {
  id: PlanId;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice?: number;
  cta: string;
  featured?: boolean;
  features: string[];
}

const ANNUAL_DISCOUNT = 0.1;
const DEFAULT_PLAN: PlanId = 'free';

const FALLBACK_PLANS: PlanDefinition[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'For individuals exploring Noah with core library tools.',
    monthlyPrice: 0,
    cta: 'Continue with Free',
    features: [
      '1 Project & 1 Workspace',
      '0 Storage',
      '5 Members',
      'Basic media library & folders',
      'Share links with view access',
      'Mobile & desktop access',
      'Community support',
    ],
  },
  {
    id: 'basic',
    name: 'Basic',
    description: 'For individuals and small teams getting started.',
    monthlyPrice: 10,
    cta: 'Get started',
    features: [
      '2 Projects & 2 Workspaces',
      '10 GB Storage',
      '5 Members',
      'Media library essentials',
      'Share links & file comments',
      'Activity feed & project overview',
      'Mobile & desktop access',
      'Email support',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'For growing teams that need smarter workflows.',
    monthlyPrice: 25,
    cta: 'Start with Premium',
    featured: true,
    features: [
      '3 Projects & 3 Workspaces',
      '15 GB Storage',
      '10 Members',
      'Review & annotate video/audio',
      'Advanced filters & reporting',
      'Custom labels, priorities & checklists',
      'Project insights & team analytics',
      'Billing & usage tracking',
      'Priority support',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations with advanced needs.',
    monthlyPrice: 50,
    cta: 'Contact Sales',
    features: [
      '4 Projects & 4 Workspaces',
      '20 GB Storage',
      '15 Members',
      'Dedicated account manager',
      'Custom integrations & automation',
      'SSO & role-based access control',
      'KPI dashboards & reporting tools',
      'Onboarding support',
    ],
  },
];

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
`;

function priceForCycle(plan: PlanDefinition, cycle: BillingCycle): number {
  if (plan.monthlyPrice === 0) return 0;
  if (cycle === 'annual') {
    if (plan.yearlyPrice != null && plan.yearlyPrice > 0) {
      return Math.round(plan.yearlyPrice / 12);
    }
    return Math.round(plan.monthlyPrice * (1 - ANNUAL_DISCOUNT));
  }
  return plan.monthlyPrice;
}

interface ChoosePlanScreenProps {
  /** Called when a plan CTA is clicked. No navigation — parent decides next step. */
  onSelectPlan?: (planId: PlanId, billingCycle: BillingCycle) => void;
  currentPlanId?: string;
}

export default function ChoosePlanScreen({ onSelectPlan, currentPlanId }: ChoosePlanScreenProps) {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('annual');
  const [selectedPlan, setSelectedPlan] = useState<PlanId>(() => (currentPlanId || DEFAULT_PLAN).toLowerCase());
  const [plans, setPlans] = useState<PlanDefinition[]>(FALLBACK_PLANS);
  const isSettingsFlow = Boolean(currentPlanId && currentPlanId.trim() !== '');

  useEffect(() => {
    if (currentPlanId) {
      setSelectedPlan(currentPlanId.toLowerCase());
    }
  }, [currentPlanId]);

  useEffect(() => {
    fetchPublicCatalogPlans()
      .then((res) => {
        if (!res.plans?.length) return;
        setPlans(
          res.plans.map((p) => ({
            id: p.name ? p.name.toLowerCase() : p.id.toLowerCase(),
            name: p.name,
            description: p.description || '',
            monthlyPrice: (p.monthlyPriceCents || 0) / 100,
            yearlyPrice: ((p.yearlyPriceCents ?? p.annualPriceCents) || 0) / 100,
            cta: p.ctaLabel || `Start with ${p.name}`,
            featured: Boolean(p.isFeatured),
            features: Array.isArray(p.features) ? p.features : [],
          })),
        );
        if (!currentPlanId) {
          setSelectedPlan('free');
        }
      })
      .catch(() => {
        /* keep fallback catalog */
      });
  }, [currentPlanId]);

  const handleSelect = (planId: PlanId) => {
    const pId = String(planId).toLowerCase().trim();
    if (isSettingsFlow && (pId === 'free' || pId === 'f2fe83c1-d36a-4cd3-b173-7f394a77c6bd')) {
      return;
    }
    setSelectedPlan(planId);
    onSelectPlan?.(planId, billingCycle);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        position: 'relative',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        px: { xs: 2.5, sm: 3, md: 4 },
        py: { xs: 4, md: 5 },
      }}
    >
      <LiquidBackground />
      <WaveBackground />

      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: 1280,
          mx: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          animation: `${fadeUp} 0.55s ease`,
        }}
      >
        <Box sx={{ ...AUTH_LOGO_PARENT_SX, mb: { xs: 3, md: 3.5 } }}>
          <NoahLogo
            align="center"
            animated={false}
            showGlow={false}
            sx={AUTH_LOGO_SX}
          />
        </Box>

        <Typography
          component="h1"
          sx={{
            color: cv.textPrimary,
            fontWeight: 700,
            fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.5rem' },
            letterSpacing: '-0.02em',
            textAlign: 'center',
            mb: 1,
          }}
        >
          Choose Your Plan
        </Typography>
        <Typography
          sx={{
            color: cv.textSecondary,
            fontSize: { xs: '0.9375rem', sm: '1.0625rem' },
            textAlign: 'center',
            maxWidth: 480,
            mb: { xs: 3, md: 3.5 },
            lineHeight: 1.5,
          }}
        >
          Affordable and adaptable pricing to suit your goals.
        </Typography>

        {/* Billing cycle toggle */}
        <Box
          role="group"
          aria-label="Billing cycle"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            p: 0.5,
            borderRadius: '999px',
            backgroundColor: cv.surface,
            border: `1px solid ${cv.border}`,
            mb: { xs: 3.5, md: 4.5 },
            gap: 0.25,
          }}
        >
          <Button
            type="button"
            onClick={() => setBillingCycle('annual')}
            aria-pressed={billingCycle === 'annual'}
            sx={{
              position: 'relative',
              textTransform: 'none',
              borderRadius: '999px',
              px: { xs: 2, sm: 2.5 },
              py: 1,
              minHeight: 40,
              fontWeight: 600,
              fontSize: '0.875rem',
              color: billingCycle === 'annual' ? cv.textOnCta : cv.textSecondary,
              background: billingCycle === 'annual' ? cv.brandGradient : 'transparent',
              boxShadow: billingCycle === 'annual' ? cv.loginBrandShadow : 'none',
              '&:hover': {
                background:
                  billingCycle === 'annual' ? cv.brandGradientHover : cv.surfaceHover,
                color: billingCycle === 'annual' ? cv.textOnCta : cv.textPrimary,
              },
            }}
          >
            Bill annually
            <Box
              component="span"
              sx={{
                ml: 1,
                px: 0.75,
                py: 0.15,
                borderRadius: '6px',
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.02em',
                color: billingCycle === 'annual' ? cv.brandPurpleDark : cv.brandOrchid,
                backgroundColor:
                  billingCycle === 'annual' ? cv.purpleSelectionSoft : cv.purpleSurface,
                border: `1px solid ${cv.purpleChipBorder}`,
              }}
            >
              10% OFF
            </Box>
          </Button>
          <Button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            aria-pressed={billingCycle === 'monthly'}
            sx={{
              textTransform: 'none',
              borderRadius: '999px',
              px: { xs: 2, sm: 2.5 },
              py: 1,
              minHeight: 40,
              fontWeight: 600,
              fontSize: '0.875rem',
              color: billingCycle === 'monthly' ? cv.textOnCta : cv.textSecondary,
              background: billingCycle === 'monthly' ? cv.brandGradient : 'transparent',
              boxShadow: billingCycle === 'monthly' ? cv.loginBrandShadow : 'none',
              '&:hover': {
                background:
                  billingCycle === 'monthly' ? cv.brandGradientHover : cv.surfaceHover,
                color: billingCycle === 'monthly' ? cv.textOnCta : cv.textPrimary,
              },
            }}
          >
            Bill monthly
          </Button>
        </Box>

        {/* Plan cards */}
        <Box
          sx={{
            width: '100%',
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              lg: 'repeat(4, 1fr)',
            },
            gap: { xs: 2, md: 2 },
            alignItems: 'stretch',
          }}
        >
          {plans.map((plan) => {
            const planKey = (plan.name || plan.id).toLowerCase();
            const normCurrentPlan = (currentPlanId || '').toLowerCase().trim();
            const isFree = plan.monthlyPrice === 0 || planKey === 'free';

            let isSelected = false;
            let isFreeDisabled = false;
            let isButtonDisabled = false;

            if (isSettingsFlow) {
              if (normCurrentPlan === planKey) {
                isSelected = true;
                isButtonDisabled = true;
              } else if (isFree) {
                isFreeDisabled = normCurrentPlan !== 'free';
                isButtonDisabled = true;
              }
            } else {
              isSelected = selectedPlan.toLowerCase() === planKey;
              isButtonDisabled = false;
            }

            const price = priceForCycle(plan, billingCycle);
            const isFeatured = Boolean(plan.featured);
            const showAnnualNote = !isFree && billingCycle === 'annual';

            return (
              <Box
                key={plan.id}
                sx={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: '20px',
                  background: cv.glassBackground,
                  backdropFilter: 'blur(40px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                  border: isSelected || isFeatured
                    ? `1.5px solid ${cv.brandOrchid}`
                    : `1px solid ${cv.border}`,
                  boxShadow: isSelected
                    ? `0 0 40px ${cv.purpleGlow24}, ${cv.cardShadow}`
                    : isFeatured
                      ? `0 0 32px ${cv.purpleGlow24}, ${cv.cardShadow}`
                      : cv.cardShadow,
                  overflow: 'hidden',
                  opacity: isFreeDisabled ? 0.6 : 1,
                  mt: { lg: isFeatured || isSelected ? 0 : 1.5 },
                  mb: { lg: isFeatured || isSelected ? 0 : 1.5 },
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease',
                }}
              >
                {isFeatured ? (
                  <Box
                    sx={{
                      py: 0.85,
                      px: 2,
                      textAlign: 'center',
                      background: cv.brandGradient,
                      color: cv.textOnCta,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      letterSpacing: '0.01em',
                    }}
                  >
                    Recommended for you
                  </Box>
                ) : isSelected && isSettingsFlow ? (
                  <Box
                    sx={{
                      py: 0.85,
                      px: 2,
                      textAlign: 'center',
                      backgroundColor: cv.purpleSurface,
                      color: cv.brandOrchid,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      letterSpacing: '0.01em',
                      borderBottom: `1px solid ${cv.purpleChipBorder}`,
                    }}
                  >
                    Current selection
                  </Box>
                ) : isFreeDisabled ? (
                  <Box
                    sx={{
                      py: 0.85,
                      px: 2,
                      textAlign: 'center',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      color: cv.textMuted,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      letterSpacing: '0.01em',
                      borderBottom: `1px solid ${cv.border}`,
                    }}
                  >
                    Trial Used
                  </Box>
                ) : (
                  <Box sx={{ height: { lg: 33 }, display: { xs: 'none', lg: 'block' } }} />
                )}

                <Box
                  sx={{
                    p: { xs: 2.25, sm: 2.5 },
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                    position: 'relative',
                  }}
                >
                  <Box
                    aria-hidden
                    sx={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      width: 56,
                      height: 56,
                      borderRadius: plan.id === 'premium' ? '10px' : '50%',
                      border: `1px solid ${cv.border}`,
                      opacity: 0.3,
                      pointerEvents: 'none',
                      ...(plan.id === 'free'
                        ? { borderStyle: 'dashed' }
                        : plan.id === 'basic'
                          ? {
                              boxShadow: `0 0 0 10px ${cv.inkOverlay06}, 0 0 0 20px ${cv.inkOverlay04}`,
                            }
                          : plan.id === 'enterprise'
                            ? {
                                background: `radial-gradient(circle at 30% 30%, transparent 40%, ${cv.border} 41%, transparent 42%)`,
                              }
                            : { transform: 'rotate(45deg)' }),
                    }}
                  />

                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: '1.125rem',
                      color: cv.textPrimary,
                      mb: 0.75,
                    }}
                  >
                    {plan.name}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '0.8125rem',
                      color: cv.textSecondary,
                      lineHeight: 1.45,
                      mb: 2,
                      minHeight: { lg: '3.9em' },
                      pr: 3,
                    }}
                  >
                    {plan.description}
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                      <Typography
                        sx={{
                          fontWeight: 700,
                          fontSize: { xs: '1.75rem', sm: '1.875rem' },
                          color: cv.textPrimary,
                          letterSpacing: '-0.02em',
                          lineHeight: 1,
                        }}
                      >
                        ${price}
                      </Typography>
                      {!isFree && (
                        <Typography
                          sx={{
                            fontSize: '0.8125rem',
                            color: cv.textMuted,
                          }}
                        >
                          /month
                        </Typography>
                      )}
                      {isFree && (
                        <Typography
                          sx={{
                            fontSize: '0.8125rem',
                            color: cv.textMuted,
                            ml: 0.5,
                          }}
                        >
                          forever
                        </Typography>
                      )}
                    </Box>
                    <Typography
                      sx={{
                        fontSize: '0.75rem',
                        color: cv.textMuted,
                        mt: 0.5,
                        minHeight: '1.4em',
                        visibility: showAnnualNote || isFree ? 'visible' : 'hidden',
                      }}
                      aria-hidden={!showAnnualNote && !isFree}
                    >
                      {isFree
                        ? 'No credit card required'
                        : `Billed annually · save ${Math.round(ANNUAL_DISCOUNT * 100)}%`}
                    </Typography>
                  </Box>

                  <Typography
                    sx={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: cv.textMuted,
                      mb: 1.25,
                    }}
                  >
                    What&apos;s included:
                  </Typography>

                  <Box
                    component="ul"
                    sx={{
                      m: 0,
                      p: 0,
                      listStyle: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1.1,
                      flex: 1,
                      mb: 2.5,
                    }}
                  >
                    {plan.features.map((feature) => (
                      <Box
                        component="li"
                        key={feature}
                        sx={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 0.85,
                        }}
                      >
                        <CheckRoundedIcon
                          sx={{
                            fontSize: 16,
                            mt: '2px',
                            color: cv.brandOrchid,
                            flexShrink: 0,
                          }}
                        />
                        <Typography
                          sx={{
                            fontSize: '0.8125rem',
                            color: cv.textSecondary,
                            lineHeight: 1.4,
                          }}
                        >
                          {feature}
                        </Typography>
                      </Box>
                    ))}
                  </Box>

                  <Button
                    type="button"
                    fullWidth
                    disabled={isButtonDisabled}
                    variant={isSelected || isFeatured ? 'contained' : 'outlined'}
                    onClick={() => handleSelect(plan.id)}
                    aria-pressed={isSelected}
                    sx={{
                      py: 1,
                      borderRadius: '10px',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      textTransform: 'none',
                      ...(isButtonDisabled
                        ? {
                            borderColor: cv.border,
                            color: cv.textMuted,
                            cursor: 'not-allowed',
                            opacity: 0.6,
                          }
                        : isFeatured
                          ? {
                              background: cv.brandGradient,
                              color: cv.textOnCta,
                              boxShadow: cv.brandShadowSoft,
                              '&:hover': {
                                background: cv.brandGradientHover,
                                boxShadow: cv.brandShadowStrong,
                              },
                            }
                          : {
                              borderColor: cv.border,
                              color: cv.textPrimary,
                              '&:hover': {
                                borderColor: cv.borderFocus,
                                backgroundColor: cv.surfaceHover,
                              },
                            }),
                    }}
                  >
                    {isSettingsFlow
                      ? (isFreeDisabled ? 'Trial Used' : isSelected ? 'Active Plan' : (isFree ? 'Active Plan' : plan.cta))
                      : plan.cta}
                  </Button>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}

export type { PlanId, BillingCycle };
