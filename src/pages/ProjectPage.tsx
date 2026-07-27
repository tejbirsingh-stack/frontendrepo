import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import DashboardPage from './DashboardPage';
import { useDashboard } from '../context/DashboardContext';

export default function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { mediaItems, activeWorkspaceId, fetchProjectData } = useDashboard();

  useEffect(() => {
    if (projectId) {
      fetchProjectData(projectId);
    }
  }, [projectId, fetchProjectData]);

  const project = mediaItems.find(
    (item) =>
      item.id === projectId &&
      item.type === 'folder' &&
      item.isProject &&
      item.workspaceId === activeWorkspaceId,
  );

  if (!project) {
    if (mediaItems.length === 0) return null;
    return null;
  }

  return <DashboardPage folderMedia={project} />;
}
