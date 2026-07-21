import { apiClient } from './client';
import type { Notification } from '../data/mockNotifications';

export const fetchNotifications = async (): Promise<Notification[]> => {
  try {
    const response = await apiClient.get<any>('/notifications');
    if (response && response.notifications) {
      return response.notifications.map((n: any) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        time: new Date(n.createdAt).toLocaleDateString() + ' ' + new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        unread: !n.isRead,
        type: n.type,
        relatedEntityId: n.relatedEntityId
      }));
    }
    return [];
  } catch (error) {
    console.error('Failed to fetch notifications', error);
    return [];
  }
};

export const markNotificationAsRead = async (id: string): Promise<boolean> => {
  try {
    await apiClient.put(`/notifications/${id}/read`);
    return true;
  } catch (error) {
    console.error(`Failed to mark notification ${id} as read`, error);
    return false;
  }
};
