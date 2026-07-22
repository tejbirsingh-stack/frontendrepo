export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  unread?: boolean;
  forUserEmail?: string;
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

export function addInAppNotification(title: string, message: string, forUserEmail?: string) {
  const stored = localStorage.getItem('noah-notifications');
  let currentItems: Notification[] = [];
  if (stored) {
    try {
      currentItems = JSON.parse(stored);
    } catch (e) {}
  } else {
    currentItems = notifications.map((notification) => ({ ...notification }));
  }

  const newNotification: Notification = {
    id: crypto.randomUUID(),
    title,
    message,
    time: 'Just now',
    unread: true,
    forUserEmail,
  };

  currentItems = [newNotification, ...currentItems];
  localStorage.setItem('noah-notifications', JSON.stringify(currentItems));
  
  // Dispatch custom event to update any active Header components in the page
  window.dispatchEvent(new Event('noah-notifications-updated'));
}
