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

  const foundProject = mediaItems.find(
    (item) => item.id === projectId && (item.type === 'folder' || item.isProject),
  );

  const project = foundProject || (projectId ? {
    id: projectId,
    title: 'Project',
    type: 'folder' as const,
    isProject: true,
    workspaceId: activeWorkspaceId || '',
    parentFolderId: null,
    createdAt: new Date().toISOString(),
    sizeBytes: 0,
    storageProvider: 'b2',
    uploadedBy: '',
    status: 'active' as const,
  } : null);

  if (!project) return null;

  return <DashboardPage folderMedia={project} />;
}
