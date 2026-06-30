export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  unread?: boolean;
}

export const notifications: Notification[] = [
  {
    id: '1',
    title: 'Upload complete',
    message: 'Drone Shots folder finished processing.',
    time: '2m ago',
    unread: true,
  },
  {
    id: '2',
    title: 'Shared with you',
    message: 'Sarah added 12 files to Client Media.',
    time: '1h ago',
    unread: true,
  },
  {
    id: '3',
    title: 'Storage alert',
    message: 'You have used 85% of your workspace storage.',
    time: '3h ago',
    unread: false,
  },
  {
    id: '4',
    title: 'Comment on Sunset',
    message: 'Alex left a note on your latest upload.',
    time: 'Yesterday',
    unread: false,
  },
  {
    id: '5',
    title: 'Workspace invite',
    message: 'You were added to Marketing Assets.',
    time: '2 days ago',
    unread: false,
  },
];
