import type {
  SettingsUserGroup,
  SettingsUserRow,
  WorkspaceMemberType,
  WorkspaceTeamMember,
} from '../data/mockSettingsData';

export const ORGANIZATION_EMAIL_DOMAIN = 'mtxb2b.com';

export interface MemberTypeDetails {
  description: string;
  inviteDescription: string;
  inputPlaceholder: string;
  suggestionsLabel: string;
  manageSubtitle: string;
}

export const MEMBER_TYPE_DETAILS: Record<WorkspaceMemberType, MemberTypeDetails> = {
  Member: {
    description: 'People who are part of your organization.',
    inviteDescription: 'Invite teammates who already belong to your organization.',
    inputPlaceholder: 'Name or work email',
    suggestionsLabel: 'Organization members',
    manageSubtitle: 'Organization member',
  },
  Guest: {
    description: 'People outside your organization who need email access.',
    inviteDescription: 'Invite external collaborators with an email address outside your organization.',
    inputPlaceholder: 'Name or work email',
    suggestionsLabel: 'Suggested guests',
    manageSubtitle: 'Outside organization',
  },
  Group: {
    description: 'User groups you created in Settings.',
    inviteDescription: 'Add a user group from Settings. Everyone in the group receives the same access.',
    inputPlaceholder: 'Group name',
    suggestionsLabel: 'Groups from Settings',
    manageSubtitle: 'User group from Settings',
  },
};

export function isOrganizationEmail(email: string): boolean {
  return email.toLowerCase().endsWith(`@${ORGANIZATION_EMAIL_DOMAIN}`);
}

export function isOrganizationUser(user: SettingsUserRow): boolean {
  return user.isOrganizationMember !== false;
}

export function getSuggestedUsersForMemberType(
  memberType: WorkspaceMemberType,
  organizationUsers: SettingsUserRow[],
  guestUsers: SettingsUserRow[],
): SettingsUserRow[] {
  if (memberType === 'Guest') return guestUsers;
  if (memberType === 'Member') return organizationUsers;
  return [];
}

export function getMemberTypeManageSubtitle(member: WorkspaceTeamMember, group?: SettingsUserGroup): string {
  if (member.memberType === 'Group') {
    if (group?.description) return group.description;
    return MEMBER_TYPE_DETAILS.Group.manageSubtitle;
  }
  if (member.memberType === 'Guest') return MEMBER_TYPE_DETAILS.Guest.manageSubtitle;
  return MEMBER_TYPE_DETAILS.Member.manageSubtitle;
}
