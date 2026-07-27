import { useEffect } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import DashboardPage from './DashboardPage';
import { useDashboard } from '../context/DashboardContext';

export default function FolderPage() {
  const { folderId } = useParams<{ folderId: string }>();
  const { mediaItems, activeWorkspaceId, fetchFolderData } = useDashboard();

  useEffect(() => {
    if (folderId) {
      fetchFolderData(folderId);
    }
  }, [folderId, fetchFolderData]);

  const folder = mediaItems.find(
    (item) =>
      item.id === folderId &&
      item.type === 'folder' &&
      item.workspaceId === activeWorkspaceId,
  );

  if (!folder) {
    // We shouldn't redirect immediately because fetchFolderData might still be running.
    // However, if it resolves and there is still no folder in mediaItems, we could handle that.
    // For now, if the folder is not found, we'll return null to wait for the data or show a loader.
    // If it never loads, the user might be stuck, but DashboardContext doesn't expose a loading state for this yet.
    if (mediaItems.length === 0) return null; // Very basic guard
  }

  // We can render DashboardPage even if folder is null temporarily, 
  // but DashboardPage expects folderMedia to be an actual object if we are inside it.
  if (!folder) {
    return null; // Wait until folder data is fetched and populated in mediaItems
  }

  return <DashboardPage folderMedia={folder} />;
}
