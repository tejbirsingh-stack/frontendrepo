export const DISPLAY_FONT = '"Fraunces", Georgia, "Times New Roman", serif';

export const NAV_LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#upcycling', label: 'Upcycling' },
  { href: '#plans', label: 'Plans' },
] as const;

export const PILLARS = [
  {
    id: 'library',
    kicker: 'Media asset management',
    title: 'A library that stays intelligent',
    body: 'Workspaces, search, and tags keep every asset findable as the library grows.',
  },
  {
    id: 'review',
    kicker: 'Collaborate and review',
    title: 'Feedback on the timeline',
    body: 'Notes, drawings, and comments stay on the media — not in email.',
  },
  {
    id: 'share',
    kicker: 'Share and deliver',
    title: 'Send the cut. Keep control.',
    body: 'Password-protected links and roles let you deliver without losing governance.',
  },
] as const;

export const CAPABILITIES = [
  { value: 'MAM', label: 'Library, projects, and search in one place' },
  { value: 'Review', label: 'Timeline annotations on video and audio' },
  { value: 'Share', label: 'Guest links with optional passwords' },
  { value: 'Secure', label: 'SSO, MFA, and role-based access' },
] as const;

export const FRICTION = {
  without: [
    'Assets scattered across drives, chats, and cloud folders',
    'Notes lost in email threads and Slack screenshots',
    'No one is sure which version is final',
    'Sharing means another upload to another tool',
  ],
  with: [
    'Every asset searchable inside the workspace it belongs to',
    'Feedback pinned to the frame it refers to',
    'One library, one version history, one source of truth',
    'Clients review in the player — no extra transfers',
  ],
} as const;

export const WHY_NOAH = {
  title: 'Why teams switch to NOAH Cloud',
  subtitle:
    'Replace scattered drives with AI search, frame-level review, and org-wide access — so creative work ships faster.',
  columns: ['Capability', 'Traditional drives', 'NOAH Cloud'] as const,
  rows: [
    { capability: 'Search speed', traditional: 'Minutes to hours', noah: 'Instant, AI-powered' },
    { capability: 'Asset visibility', traditional: 'Masters only', noah: 'Every frame & B-roll' },
    { capability: 'Feedback', traditional: 'Email & timecodes', noah: 'Direct frame markup' },
    { capability: 'Team access', traditional: 'Limited / physical', noah: 'Org-wide cloud' },
  ],
  ctaPrimary: 'Start free trial',
  ctaSecondary: 'Book a demo',
} as const;

/** PDF homepage messaging — compact pictorial section on the landing page. */
export const UPCYCLING_SECTION = {
  kicker: 'Introducing the future',
  title: 'Stop Searching. Start Upcycling.',
  subtitle: 'Find any frame. Reuse every shoot. Share with control.',
  flow: [
    { id: 'chaos', label: 'Chaos', detail: 'Lost drives & buried B-roll' },
    { id: 'noah', label: 'NOAH', detail: 'One intelligent library' },
    { id: 'reuse', label: 'Upcycle', detail: 'Search, share, ship again' },
  ],
  ai: [
    { id: 'scene', label: 'Scene Detection', detail: 'Sunset. Street. Instantly.' },
    { id: 'face', label: 'Facial Recognition', detail: 'Find talent in every clip.' },
    { id: 'index', label: 'Instant Indexing', detail: 'Metadata on every upload.' },
  ],
  story: [
    { id: 'broll', title: 'Raw B-Roll', detail: 'Every take, kept.' },
    { id: 'masters', title: 'Master Files', detail: 'Ready to distribute.' },
    { id: 'assets', title: 'Project Assets', detail: 'One source of truth.' },
  ],
  actions: [
    { id: 'search', title: 'Instant Search' },
    { id: 'share', title: 'Global Share' },
    { id: 'access', title: 'Anywhere Access' },
    { id: 'markup', title: 'Frame Markup' },
  ],
  excellence: {
    stat: '60%',
    headline: 'Higher efficiency',
    body: 'Less search waste. More production output.',
  },
} as const;

export const TEAM_SIZE_OPTIONS = ['Solo', '2-10', '11-50', '50-100', '101-500', '501+'] as const;

export const FALLBACK_HERO = {
  title: 'A library worthy of your beautiful work.',
  subtitle:
    'NOAH Cloud is the media intelligence layer for modern teams — find anything, review on the timeline, and share finished work without leaving your library.',
};

export const FALLBACK_PLANS: Array<{
  id: string;
  name: string;
  description: string;
  monthlyPriceCents: number;
  yearlyPriceCents: number;
  features: string[];
  isFeatured: boolean;
  hasAI: boolean;
  ctaLabel: string;
}> = [
  {
    id: 'free',
    name: 'Free',
    description: 'For individuals exploring Noah with core library tools.',
    monthlyPriceCents: 0,
    yearlyPriceCents: 0,
    isFeatured: false,
    hasAI: false,
    ctaLabel: 'Continue with Free',
    features: [
      '1 Project & 1 Workspace',
      'Share links with view access',
      'Mobile & desktop access',
      'Community support',
    ],
  },
  {
    id: 'basic',
    name: 'Basic',
    description: 'For individuals and small teams getting started.',
    monthlyPriceCents: 1000,
    yearlyPriceCents: 10800,
    isFeatured: false,
    hasAI: false,
    ctaLabel: 'Get started',
    features: [
      '2 Projects & 2 Workspaces',
      'Media library essentials',
      'Share links & file comments',
      'Email support',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'For growing teams that need smarter workflows.',
    monthlyPriceCents: 2500,
    yearlyPriceCents: 27000,
    isFeatured: true,
    hasAI: false,
    ctaLabel: 'Start with Premium',
    features: [
      'Review & annotate video/audio',
      'Advanced filters & reporting',
      'Billing & usage tracking',
      'Priority support',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations with advanced needs.',
    monthlyPriceCents: 5000,
    yearlyPriceCents: 54000,
    isFeatured: false,
    hasAI: false,
    ctaLabel: 'Contact Sales',
    features: [
      'Dedicated account manager',
      'SSO & role-based access control',
      'Custom integrations & automation',
      'Onboarding support',
    ],
  },
];
