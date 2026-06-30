import { env } from '../config/env';

function slugifyProjectName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function getProjectShareLink(projectId: string, projectName: string): string {
  const slug = slugifyProjectName(projectName) || 'project';
  const origin = env.appOrigin || (typeof window !== 'undefined' ? window.location.origin : 'https://noah.app');
  return `${origin}/share/project/${projectId}/${slug}`;
}

export function getWorkspaceShareLink(workspaceId: string, workspaceName: string): string {
  const slug = slugifyProjectName(workspaceName) || 'workspace';
  const origin = env.appOrigin || (typeof window !== 'undefined' ? window.location.origin : 'https://noah.app');
  return `${origin}/share/workspace/${workspaceId}/${slug}`;
}

export async function copyProjectShareLink(shareLink: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(shareLink);
    return true;
  } catch {
    return false;
  }
}
