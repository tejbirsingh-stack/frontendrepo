import type { UserRole } from '../constants/userRoles';
import { CURRENT_USER } from '../constants/currentUser';

export type SettingsUserRole = UserRole;

export interface SettingsUserRow {
  id: string;
  name: string;
  initials: string;
  email: string;
  lastActive: string;
  joinedDate: string;
  role: SettingsUserRole;
  roleId?: string;
  roleRelation?: {
    id: string;
    name: string;
  };
  status: 'Active' | 'Pending';
  isCurrentUser?: boolean;
  isOrganizationMember?: boolean;
}

export type ProjectVisibility = 'public' | 'private';

export interface SettingsProjectRow {
  id: string;
  project: string;
  workspace: string;
  status: 'Active' | 'Inactive';
  lastUpdated: string;
  creationDate: string;
  storage: string;
  projectAdmin: string;
  visibility?: ProjectVisibility;
  teamMembers?: WorkspaceTeamMember[];
  isRestricted?: boolean;
  isDefault?: boolean;
  description?: string;
  color?: string;
}

export interface WorkspaceTeamMember {
  id: string;
  name: string;
  initials: string;
  email?: string;
  avatarUrl?: string;
  access?: WorkspaceMemberAccess;
  memberType?: WorkspaceMemberType;
  groupId?: string;
  isCurrentUser?: boolean;
  hasOverride?: boolean;
}

export type WorkspaceMemberAccess = 'Full Access' | 'Can edit' | 'Can view';
export type WorkspaceMemberType = 'Member' | 'Guest' | 'Group';

export interface WorkspaceInvitePayload {
  userId?: string;
  email?: string;
  name?: string;
  groupId?: string;
  groupName?: string;
  memberType: WorkspaceMemberType;
  access: WorkspaceMemberAccess;
  message?: string;
  sendInviteEmail?: boolean;
}

export interface BillingPaymentMethod {
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  nameOnCard: string;
}

export interface BillingAddress {
  company: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface BillingContact {
  company: string;
  email: string;
  taxId?: string;
}

export interface BillingInvoiceRow {
  id: string;
  invoiceNumber: string;
  date: string;
  description: string;
  amount: string;
  status: 'Paid' | 'Pending' | 'Failed';
}

export interface BillingDetails {
  plan: string;
  billingCycle: string;
  nextBillingDate: string;
  amount: string;
  isFreePlanActive: boolean;
  paymentMethod: BillingPaymentMethod;
  billingAddress: BillingAddress;
  billingContact: BillingContact;
}

export const MOCK_BILLING_DETAILS: BillingDetails = {
  plan: 'Team · Premium',
  billingCycle: 'Annual',
  nextBillingDate: 'Jul 1, 2026',
  amount: '$1,188.00',
  isFreePlanActive: false,
  paymentMethod: {
    brand: 'Visa',
    last4: '4242',
    expMonth: 8,
    expYear: 2027,
    nameOnCard: 'Aviral Kataria',
  },
  billingAddress: {
    company: 'MTX B2B',
    line1: '1200 Fayette Street',
    line2: 'Suite 400',
    city: 'Baltimore',
    state: 'MD',
    postalCode: '21201',
    country: 'United States',
  },
  billingContact: {
    company: 'MTX B2B',
    email: 'aviral.kataria@mtxb2b.com',
    taxId: 'US-EIN-12-3456789',
  },
};

export const MOCK_BILLING_INVOICES: BillingInvoiceRow[] = [
  {
    id: 'inv-1',
    invoiceNumber: 'YYHCWP29-0001',
    date: 'Jun 8, 2026',
    description: 'Team plan — 1 member included',
    amount: '$0.00',
    status: 'Paid',
  },
  {
    id: 'inv-2',
    invoiceNumber: 'YYHCWP29-0002',
    date: 'May 8, 2026',
    description: 'Team plan — trial period',
    amount: '$0.00',
    status: 'Paid',
  },
  {
    id: 'inv-3',
    invoiceNumber: 'INV-2025-0038',
    date: 'Jul 1, 2024',
    description: 'Team · Premium — Annual renewal',
    amount: '$1,188.00',
    status: 'Paid',
  },
];

export interface StorageBreakdownSegment {
  id: string;
  label: string;
  valueLabel: string;
  valueBytes: number;
  color: string;
}

export interface UsageSummary {
  membersUsed: number;
  membersTotal: number;
  membersActive: number;
  membersPending: number;
  storageUsedLabel: string;
  storageCapLabel: string;
  storageUsedPercent: number;
  storageCapBytes: number;
  storageBreakdown: StorageBreakdownSegment[];
  projectsCount: number;
  workspacesCount: number;
  seatGuardrailMax: number;
}

export const MOCK_USAGE_SUMMARY: UsageSummary = {
  membersUsed: 1,
  membersTotal: 15,
  membersActive: 1,
  membersPending: 0,
  storageUsedLabel: '11.9 MB',
  storageCapLabel: '3 TB',
  storageUsedPercent: 0.4,
  storageCapBytes: 3 * 1024 ** 4,
  storageBreakdown: [
    {
      id: 'video',
      label: 'Video',
      valueLabel: '8.2 MB',
      valueBytes: 8.2 * 1024 ** 2,
      color: 'var(--noah-brand-purple)',
    },
    {
      id: 'images',
      label: 'Images',
      valueLabel: '2.1 MB',
      valueBytes: 2.1 * 1024 ** 2,
      color: 'var(--noah-brand-blue)',
    },
    {
      id: 'documents',
      label: 'Documents',
      valueLabel: '1.6 MB',
      valueBytes: 1.6 * 1024 ** 2,
      color: 'var(--noah-brand-teal)',
    },
  ],
  projectsCount: 2,
  workspacesCount: 1,
  seatGuardrailMax: 15,
};

export interface PlanLineItem {
  description: string;
  quantity: string;
  unitPrice: string;
  subtotal: string;
}

export interface CurrentPlanDetails {
  planName: string;
  freeTrialExpiry: string;
  lineItems: PlanLineItem[];
  salesTaxPercent: number;
  salesTaxAmount: string;
  subtotal: string;
  total: string;
}

export const MOCK_CURRENT_PLAN: CurrentPlanDetails = {
  planName: 'Team',
  freeTrialExpiry: 'Jun 22, 2026',
  lineItems: [
    {
      description: 'Team plan membership',
      quantity: '1 Member Included',
      unitPrice: '$25 /mo.',
      subtotal: '$25.00',
    },
  ],
  salesTaxPercent: 6,
  salesTaxAmount: '$1.50',
  subtotal: '$25.00',
  total: '$26.50',
};

export interface PaymentInvoiceConfiguration {
  companyName: string;
  taxId: string;
  invoiceEmail: string;
  hasCardOnFile: boolean;
}

export const MOCK_PAYMENT_INVOICE_CONFIG: PaymentInvoiceConfiguration = {
  companyName: 'Not set',
  taxId: 'Not set',
  invoiceEmail: CURRENT_USER.email,
  hasCardOnFile: false,
};

export interface BrandingSettingsData {
  accountInitials: string;
  accountName: string;
  accentColor: string;
  reelBackgroundColor: string;
  reelTitleColor: string;
  hasCustomLogo: boolean;
  hasHeaderImage: boolean;
  headerImageMaxMb: number;
}

export const MOCK_BRANDING_SETTINGS: BrandingSettingsData = {
  accountInitials: CURRENT_USER.initials,
  accountName: CURRENT_USER.accountName,
  accentColor: 'var(--noah-violet-accent)',
  reelBackgroundColor: 'None',
  reelTitleColor: 'None',
  hasCustomLogo: false,
  hasHeaderImage: false,
  headerImageMaxMb: 25,
};

export const DEFAULT_BRANDING_SETTINGS: BrandingSettingsData = {
  accountInitials: 'NA',
  accountName: 'NOAH Account',
  accentColor: 'var(--noah-indigo)',
  reelBackgroundColor: 'None',
  reelTitleColor: 'None',
  hasCustomLogo: false,
  hasHeaderImage: false,
  headerImageMaxMb: 25,
};

export const PROFILE_TIMEZONE_OPTIONS = [
  { value: 'America/Los_Angeles', label: '(UTC-08:00) America / Los Angeles' },
  { value: 'America/New_York', label: '(UTC-05:00) America / New York' },
  { value: 'Europe/London', label: '(UTC+00:00) Europe / London' },
  { value: 'UTC', label: '(UTC+00:00) UTC' },
  { value: 'Asia/Kolkata', label: '(UTC+05:30) Asia / Kolkata' },
  { value: 'Asia/Tokyo', label: '(UTC+09:00) Asia / Tokyo' },
] as const;

export type ProfileTimezoneValue = (typeof PROFILE_TIMEZONE_OPTIONS)[number]['value'];

const PROFILE_TIMEZONE_VALUES = new Set<string>(
  PROFILE_TIMEZONE_OPTIONS.map((option) => option.value),
);

/** Map API/legacy timezone strings onto a Select option value MUI can render. */
export function resolveProfileTimezoneOption(timezone?: string | null): ProfileTimezoneValue {
  if (!timezone) return 'UTC';

  if (PROFILE_TIMEZONE_VALUES.has(timezone)) {
    return timezone as ProfileTimezoneValue;
  }

  const byLabel = PROFILE_TIMEZONE_OPTIONS.find((option) => option.label === timezone);
  if (byLabel) return byLabel.value;

  // Legacy display labels: "(UTC+00:00) Europe / London" → Europe/London
  if (timezone.includes(') ')) {
    const parsed = timezone.split(') ')[1]?.replace(/\s*\/\s*/g, '/').trim();
    if (parsed && PROFILE_TIMEZONE_VALUES.has(parsed)) {
      return parsed as ProfileTimezoneValue;
    }
  }

  // Common aliases
  if (timezone === 'Asia/Calcutta') return 'Asia/Kolkata';
  if (timezone === 'US/Pacific' || timezone === 'PST' || timezone === 'PDT') {
    return 'America/Los_Angeles';
  }
  if (timezone === 'US/Eastern' || timezone === 'EST' || timezone === 'EDT') {
    return 'America/New_York';
  }

  return 'UTC';
}

export interface PersonalProfileSettings {
  fullName: string;
  timezone: string;
  avatarUrl?: string;
}

export const MOCK_PERSONAL_PROFILE: PersonalProfileSettings = {
  fullName: CURRENT_USER.name,
  timezone: 'Asia/Kolkata',
  avatarUrl: CURRENT_USER.avatarUrl,
};

export interface PrivacySettings {
  shareLinkActivity: boolean;
}

export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  shareLinkActivity: true,
};

export function formatBillingAddress(address: BillingAddress): string {
  const lines = [
    address.company,
    address.line1,
    address.line2,
    `${address.city}, ${address.state} ${address.postalCode}`,
    address.country,
  ].filter(Boolean);
  return lines.join('\n');
}

export function formatPaymentMethod(method: BillingPaymentMethod): string {
  const exp = `${String(method.expMonth).padStart(2, '0')}/${method.expYear}`;
  return `${method.brand} ending in ${method.last4} · Expires ${exp}`;
}

export const MOCK_SETTINGS_USERS: SettingsUserRow[] = [
  {
    id: 'u1',
    name: 'Aviral Kataria',
    initials: 'AK',
    email: 'aviral.kataria@mtxb2b.com',
    lastActive: '17 seconds ago',
    joinedDate: 'Jun 23, 2026',
    role: CURRENT_USER.role,
    status: 'Active',
    isCurrentUser: true,
  },
  {
    id: 'u2',
    name: 'Priya Sharma',
    initials: 'PS',
    email: 'priya.sharma@mtxb2b.com',
    lastActive: 'Yesterday',
    joinedDate: 'Mar 4, 2024',
    role: 'Admin',
    status: 'Active',
  },
  {
    id: 'u3',
    name: 'James Cole',
    initials: 'JC',
    email: 'james.cole@mtxb2b.com',
    lastActive: '3 days ago',
    joinedDate: 'Jun 18, 2024',
    role: 'Editor',
    status: 'Active',
  },
  {
    id: 'u4',
    name: 'Mia Laurent',
    initials: 'ML',
    email: 'mia.laurent@mtxb2b.com',
    lastActive: 'Pending invite',
    joinedDate: '—',
    role: 'Collaborator',
    status: 'Pending',
  },
  {
    id: 'u5',
    name: 'Sam Ortiz',
    initials: 'SO',
    email: 'sam.ortiz@mtxb2b.com',
    lastActive: '1 week ago',
    joinedDate: 'Feb 2, 2026',
    role: 'Viewer',
    status: 'Active',
  },
];

export const MOCK_SETTINGS_GUEST_USERS: SettingsUserRow[] = [
  {
    id: 'gu1',
    name: 'Alex Kim',
    initials: 'AK',
    email: 'alex.kim@clientstudio.com',
    lastActive: 'Never',
    joinedDate: '—',
    role: 'Collaborator',
    status: 'Pending',
    isOrganizationMember: false,
  },
  {
    id: 'gu2',
    name: 'Jordan Lee',
    initials: 'JL',
    email: 'jordan.lee@freelance.io',
    lastActive: '2 weeks ago',
    joinedDate: '—',
    role: 'Viewer',
    status: 'Active',
    isOrganizationMember: false,
  },
  {
    id: 'gu3',
    name: 'Taylor Brooks',
    initials: 'TB',
    email: 'taylor@partneragency.com',
    lastActive: 'Yesterday',
    joinedDate: '—',
    role: 'Collaborator',
    status: 'Active',
    isOrganizationMember: false,
  },
];

export interface SettingsUserGroup {
  id: string;
  name: string;
  description: string;
  memberIds: string[];
  createdDate: string;
  createdBy: string;
}

export const MOCK_SETTINGS_USER_GROUPS: SettingsUserGroup[] = [];

let userGroupCounter = 0;

export function createUserGroup(
  name: string,
  description: string,
  memberIds: string[],
): SettingsUserGroup {
  userGroupCounter += 1;
  return {
    id: `g-new-${userGroupCounter}`,
    name,
    description,
    memberIds,
    createdDate: formatSettingsDate(new Date()),
    createdBy: CURRENT_USER.name,
  };
}

export const MOCK_SETTINGS_PROJECTS: SettingsProjectRow[] = [
  {
    id: 'p1',
    project: 'Brand Reel Q1',
    workspace: 'NOAH Workspace',
    status: 'Active',
    lastUpdated: 'Jun 8, 2026',
    creationDate: 'Jan 15, 2025',
    storage: '4.2 GB',
    projectAdmin: 'Aviral Kataria',
    visibility: 'public',
    teamMembers: [
      {
        id: 'pm1',
        name: 'Aviral Kataria',
        initials: 'AK',
        email: 'aviral.kataria@mtxb2b.com',
        avatarUrl: '/aviral-kataria.png',
        access: 'Full Access',
        memberType: 'Member',
        isCurrentUser: true,
      },
      { id: 'pm2', name: 'Priya Sharma', initials: 'PS', email: 'priya.sharma@mtxb2b.com' },
      { id: 'pm3', name: 'James Cole', initials: 'JC', email: 'james.cole@mtxb2b.com' },
    ],
  },
  {
    id: 'p2',
    project: 'Product Launch',
    workspace: 'Creative Studio',
    status: 'Inactive',
    lastUpdated: 'Apr 2, 2026',
    creationDate: 'Nov 3, 2024',
    storage: '1.1 GB',
    projectAdmin: 'Priya Sharma',
    visibility: 'private',
    isRestricted: true,
    teamMembers: [
      { id: 'pm4', name: 'Priya Sharma', initials: 'PS', email: 'priya.sharma@mtxb2b.com' },
      { id: 'pm5', name: 'Mia Laurent', initials: 'ML', email: 'mia.laurent@mtxb2b.com' },
    ],
  },
];

export const MOCK_SETTINGS_WORKSPACES: SettingsProjectRow[] = [
  {
    id: 'w1',
    project: '—',
    workspace: 'NOAH Workspace',
    status: 'Active',
    lastUpdated: 'Jun 9, 2026',
    creationDate: 'Dec 1, 2023',
    storage: '8.6 GB',
    projectAdmin: 'Aviral Kataria',
    isRestricted: false,
    teamMembers: [
      {
        id: 'wm1',
        name: 'Aviral Kataria',
        initials: 'AK',
        email: 'aviral.kataria@mtxb2b.com',
        avatarUrl: '/aviral-kataria.png',
        access: 'Full Access',
        memberType: 'Member',
        isCurrentUser: true,
      },
      { id: 'wm2', name: 'Priya Sharma', initials: 'PS', email: 'priya.sharma@mtxb2b.com' },
      { id: 'wm3', name: 'James Cole', initials: 'JC', email: 'james.cole@mtxb2b.com' },
      { id: 'wm4', name: 'Mia Laurent', initials: 'ML', email: 'mia.laurent@mtxb2b.com' },
      { id: 'wm5', name: 'Sam Ortiz', initials: 'SO', email: 'sam.ortiz@mtxb2b.com' },
      { id: 'wm6', name: 'Nina Park', initials: 'NP', email: 'nina.park@mtxb2b.com' },
    ],
  },
  {
    id: 'w2',
    project: '—',
    workspace: 'Creative Studio',
    status: 'Active',
    lastUpdated: 'May 28, 2026',
    creationDate: 'Feb 14, 2024',
    storage: '2.4 GB',
    projectAdmin: 'Priya Sharma',
    teamMembers: [
      { id: 'wm7', name: 'Priya Sharma', initials: 'PS', email: 'priya.sharma@mtxb2b.com' },
      { id: 'wm8', name: 'James Cole', initials: 'JC', email: 'james.cole@mtxb2b.com' },
      { id: 'wm9', name: 'Mia Laurent', initials: 'ML', email: 'mia.laurent@mtxb2b.com' },
    ],
  },
  {
    id: 'w3',
    project: '—',
    workspace: 'Archive',
    status: 'Inactive',
    lastUpdated: 'Jan 10, 2026',
    creationDate: 'Aug 20, 2023',
    storage: '540 MB',
    projectAdmin: 'Aviral Kataria',
    teamMembers: [
      {
        id: 'wm10',
        name: 'Aviral Kataria',
        initials: 'AK',
        email: 'aviral.kataria@mtxb2b.com',
        avatarUrl: '/aviral-kataria.png',
      },
      { id: 'wm11', name: 'Sam Ortiz', initials: 'SO', email: 'sam.ortiz@mtxb2b.com' },
    ],
  },
];

export const MOCK_CUSTOM_FIELDS = [
  { id: 'f1', name: 'Campaign', type: 'Text', appliesTo: 'All media' },
  { id: 'f2', name: 'Client approval', type: 'Dropdown', appliesTo: 'Projects' },
  { id: 'f3', name: 'Shoot date', type: 'Date', appliesTo: 'Videos' },
];

function emailToDisplayName(email: string): string {
  const local = email.split('@')[0] ?? email;
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function emailToInitials(email: string): string {
  const name = emailToDisplayName(email);
  const parts = name.split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

let invitedUserCounter = 0;

export function createInvitedUser(email: string, role: SettingsUserRole): SettingsUserRow {
  invitedUserCounter += 1;
  return {
    id: `u-invite-${invitedUserCounter}`,
    name: emailToDisplayName(email),
    initials: emailToInitials(email),
    email,
    lastActive: 'Pending invite',
    joinedDate: '—',
    role,
    status: 'Pending',
  };
}

function formatSettingsDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

let projectCounter = 0;

export function createProject(
  name: string,
  workspace: string,
  projectAdmin: string,
  inviteEmails: string[] = [],
  visibility: ProjectVisibility = 'public',
  adminMember?: WorkspaceTeamMember,
  inviteGroupIds: string[] = [],
): SettingsProjectRow {
  projectCounter += 1;
  const today = formatSettingsDate(new Date());
  const invitedGroups = inviteGroupIds
    .map((groupId) => MOCK_SETTINGS_USER_GROUPS.find((group) => group.id === groupId))
    .filter((group): group is SettingsUserGroup => Boolean(group))
    .map((group) => createWorkspaceTeamMemberFromGroup(group));

  return {
    id: `p-new-${projectCounter}`,
    project: name,
    workspace,
    status: 'Active',
    lastUpdated: today,
    creationDate: today,
    storage: '0 MB',
    projectAdmin,
    visibility,
    isRestricted: visibility === 'private',
    teamMembers: [
      adminMember ?? {
        id: `pm-new-${projectCounter}`,
        name: projectAdmin,
        initials: nameToInitials(projectAdmin),
        access: 'Full Access',
        memberType: 'Member',
      },
      ...inviteEmails.map((email) => createWorkspaceTeamMember(email)),
      ...invitedGroups,
    ],
  };
}

let workspaceCounter = 0;

export function createSettingsWorkspace(
  name: string,
  workspaceAdmin: string,
  adminMember?: WorkspaceTeamMember,
  inviteEmails: string[] = [],
  inviteGroupIds: string[] = [],
): SettingsProjectRow {
  workspaceCounter += 1;
  const today = formatSettingsDate(new Date());
  const invitedGroups = inviteGroupIds
    .map((groupId) => MOCK_SETTINGS_USER_GROUPS.find((group) => group.id === groupId))
    .filter((group): group is SettingsUserGroup => Boolean(group))
    .map((group) => createWorkspaceTeamMemberFromGroup(group));

  return {
    id: `w-new-${workspaceCounter}`,
    project: '—',
    workspace: name,
    status: 'Active',
    lastUpdated: today,
    creationDate: today,
    storage: '0 MB',
    projectAdmin: workspaceAdmin,
    teamMembers: [
      adminMember ?? {
        id: `wm-new-${workspaceCounter}`,
        name: workspaceAdmin,
        initials: nameToInitials(workspaceAdmin),
      },
      ...inviteEmails.map((email) => createWorkspaceTeamMember(email)),
      ...invitedGroups,
    ],
  };
}

function nameToInitials(name: string): string {
  const parts = name.split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

let workspaceMemberCounter = 0;

export function createWorkspaceTeamMember(
  email: string,
  options?: {
    name?: string;
    access?: WorkspaceMemberAccess;
    memberType?: WorkspaceMemberType;
  },
): WorkspaceTeamMember {
  workspaceMemberCounter += 1;
  return {
    id: `wm-invite-${workspaceMemberCounter}`,
    name: options?.name ?? emailToDisplayName(email),
    initials: emailToInitials(email),
    email,
    access: options?.access ?? 'Full Access',
    memberType: options?.memberType ?? 'Member',
  };
}

function groupNameToInitials(name: string): string {
  const parts = name.split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function createWorkspaceTeamMemberFromGroup(
  group: SettingsUserGroup,
  options?: { access?: WorkspaceMemberAccess },
): WorkspaceTeamMember {
  workspaceMemberCounter += 1;
  return {
    id: `wm-group-${workspaceMemberCounter}`,
    name: group.name,
    initials: groupNameToInitials(group.name),
    groupId: group.id,
    access: options?.access ?? 'Full Access',
    memberType: 'Group',
  };
}

export function findUserGroupByName(
  name: string,
  groups: SettingsUserGroup[] = MOCK_SETTINGS_USER_GROUPS,
): SettingsUserGroup | undefined {
  const normalized = name.trim().toLowerCase();
  return groups.find((group) => String(group.name || '').toLowerCase() === normalized);
}

export function resolveWorkspaceInvite(
  payload: WorkspaceInvitePayload,
  existingMembers: WorkspaceTeamMember[],
  availableGroups: SettingsUserGroup[] = MOCK_SETTINGS_USER_GROUPS,
): WorkspaceTeamMember | null {
  if (payload.memberType === 'Group') {
    const group =
      (payload.groupId
        ? availableGroups.find((entry) => entry.id === payload.groupId)
        : undefined) ??
      (payload.groupName ? findUserGroupByName(payload.groupName, availableGroups) : undefined);

    if (!group) return null;

    const alreadyAdded = existingMembers.some(
      (member) =>
        member.groupId === group.id ||
        (member.memberType === 'Group' && member.name.toLowerCase() === group.name.toLowerCase()),
    );
    if (alreadyAdded) return null;

    return createWorkspaceTeamMemberFromGroup(group, { access: payload.access });
  }

  const email = payload.email?.trim();
  if (!email) return null;

  const normalizedEmail = email.toLowerCase();
  const alreadyAdded = existingMembers.some(
    (member) => member.email?.toLowerCase() === normalizedEmail,
  );
  if (alreadyAdded) return null;

  return createWorkspaceTeamMember(email, {
    name: payload.name,
    access: payload.access,
    memberType: payload.memberType,
  });
}
