import type { DashboardNotificationSettings, DashboardNotificationImage } from '../api/platformApi';

const STORAGE_KEY = 'noah_local_dashboard_notification';

export function readLocalDashboardNotification(): DashboardNotificationSettings | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DashboardNotificationSettings;
  } catch (err) {
    console.warn('Failed to read local dashboard notification', err);
    return null;
  }
}

export function writeLocalDashboardNotification(data: DashboardNotificationSettings): DashboardNotificationSettings {
  try {
    const toSave = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    return toSave;
  } catch (err) {
    console.error('Failed to save local dashboard notification', err);
    return data;
  }
}

export function isLocalNotificationImage(img: DashboardNotificationImage): boolean {
  return img.id.startsWith('local-') || (img.url?.startsWith('data:image/') ?? false); 
}

export function createLocalNotificationImage(file: File, dataUrl: string, index: number): DashboardNotificationImage {
  return {
    id: `local-${Date.now()}-${index}`,
    filePath: '',
    fileName: file.name,
    mimeType: file.type,
    sizeBytes: String(file.size),
    sortOrder: index,
    url: dataUrl,
  };
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
