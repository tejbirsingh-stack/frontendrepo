export const DISPLAY_FONT = '"Fraunces", Georgia, "Times New Roman", serif';
export const CREAM = '#F3E6C8';
export const CREAM_HOVER = '#ead7a8';
export const INK = '#121212';

export const NAV_LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#workflow', label: 'How it works' },
  { href: '#plans', label: 'Plans' },
  { href: '#security', label: 'Security' },
] as const;

export const PILLARS = [
  {
    id: 'library',
    kicker: 'Media asset management',
    title: 'A library that stays intelligent as it grows',
    body: 'Store video, audio, images, and documents in workspaces and projects. Search, tags, favorites, and duplicate detection keep every asset findable — whether it lives in one folder or across the organization.',
    points: [
      'Workspaces, projects, and nested folders',
      'Resumable uploads with transcoding and thumbnails',
      'Camera and file metadata extracted on ingest',
    ],
  },
  {
    id: 'review',
    kicker: 'Collaborate and review',
    title: 'Feedback lives on the timeline, not in email',
    body: 'Review in real time or async from the asset itself. Timeline annotations, drawings, stamps, and comments stay versioned with the media so editors, clients, and producers share one source of truth.',
    points: [
      'Frame-accurate notes, shapes, and drawing tools',
      'Public, private, and group annotation privacy',
      'Guest review on share links — no download required',
    ],
  },
  {
    id: 'share',
    kicker: 'Share and deliver',
    title: 'Send the cut. Keep control.',
    body: 'Password-protected share links, role-based access, and deletion approvals let you deliver work without losing governance. Clients watch, comment, and leave — your library stays the system of record.',
    points: [
      'Public or private links with optional passwords',
      'Viewer, collaborator, editor, and admin roles',
      'Trash, restore, and admin-approved permanent delete',
    ],
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

export const WORKFLOW = [
  {
    step: '01',
    title: 'Stand up a workspace',
    body: 'Create an organization, pick a plan, and invite the team. Google and Microsoft SSO, or email + MFA, get people in without extra IT theater.',
  },
  {
    step: '02',
    title: 'Ingest without friction',
    body: 'Upload from the desktop with resumable chunked transfers. NOAH transcodes, thumbs, and reads EXIF so files are playable and searchable on arrival.',
  },
  {
    step: '03',
    title: 'Organize and find',
    body: 'Folders, projects, tags, favorites, and duplicate detection keep growing libraries usable. Saved views for Recent, Shared, and Projects match how teams already work.',
  },
  {
    step: '04',
    title: 'Review, share, deliver',
    body: 'Annotate on the timeline, share a link, and keep access on a leash. Activity history and usage metering show what moved — and what it cost.',
  },
] as const;

export const FEATURES = [
  {
    title: 'Library that scales',
    body: 'Recent, favorites, shared, projects, and duplicates — plus folder trees that stay in sync with the files inside them.',
  },
  {
    title: 'Resumable ingest',
    body: 'Chunked uploads, retryable transcodes, and streaming playback so large video does not stall the day.',
  },
  {
    title: 'Timeline review',
    body: 'Comments, shapes, stamps, and drawing tools sit on the player. Privacy controls keep notes public, private, or group-only.',
  },
  {
    title: 'Share links',
    body: 'Public or private guest access, optional passwords, and annotations from people who never need a NOAH seat.',
  },
  {
    title: 'Workspaces & projects',
    body: 'Separate brands, shows, or clients without cloning tools. Invite by folder or project with the right access level.',
  },
  {
    title: 'Roles that match the work',
    body: 'Super Admin, Admin, Editor, Collaborator, and Viewer — plus user groups for the access patterns you already have.',
  },
  {
    title: 'Identity you already use',
    body: 'Google and Microsoft sign-in, email verification, and MFA for accounts that need a second factor.',
  },
  {
    title: 'Metadata on ingest',
    body: 'Camera, lens, exposure, and file properties are extracted automatically so search is useful from the first hour.',
  },
  {
    title: 'Tags & custom fields',
    body: 'Label, filter, and retrieve assets the way your operation actually talks about them.',
  },
  {
    title: 'Usage & billing',
    body: 'Storage, seats, workspaces, and projects stay visible against the plan — Free through Enterprise.',
  },
  {
    title: 'Activity you can audit',
    body: 'User activity, share events, and deletion requests leave a trail operators can actually read.',
  },
  {
    title: 'Creative tool fit',
    body: 'Built to sit beside Adobe Premiere Pro, Final Cut Pro, and browser-first review — metadata stays with the asset.',
  },
] as const;

export const SECURITY_POINTS = [
  {
    title: 'Access on a leash',
    body: 'Role-based permissions, folder and project access levels, and share-link visibility that you can revoke.',
  },
  {
    title: 'Identity & MFA',
    body: 'Work email, Google, or Microsoft. Multi-factor authentication for the accounts that hold the keys.',
  },
  {
    title: 'Deletion is a process',
    body: 'Trash, restore, and admin-approved permanent delete so a misclick is not a career event.',
  },
  {
    title: 'Guest access without chaos',
    body: 'Password-protected links and guest annotations keep clients in the player, not in your source tree.',
  },
] as const;

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
  ctaLabel: string;
}> = [
  {
    id: 'free',
    name: 'Free',
    description: 'For individuals exploring Noah with core library tools.',
    monthlyPriceCents: 0,
    yearlyPriceCents: 0,
    isFeatured: false,
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
    ctaLabel: 'Contact Sales',
    features: [
      'Dedicated account manager',
      'SSO & role-based access control',
      'Custom integrations & automation',
      'Onboarding support',
    ],
  },
];
