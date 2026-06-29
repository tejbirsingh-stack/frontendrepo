import { Navigate, useParams } from 'react-router-dom';
import DashboardPage from './DashboardPage';
import { useDashboard } from '../context/DashboardContext';

export default function FolderPage() {
  const { folderId } = useParams<{ folderId: string }>();
  const { mediaItems, activeWorkspaceId } = useDashboard();

  const folder = mediaItems.find(
    (item) =>
      item.id === folderId &&
      item.type === 'folder' &&
      item.workspaceId === activeWorkspaceId,
  );

  if (!folder) {
    return <Navigate to="/home" replace />;
  }

  return <DashboardPage folderMedia={folder} />;
}
