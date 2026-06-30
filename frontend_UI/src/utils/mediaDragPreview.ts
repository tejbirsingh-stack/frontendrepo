import type { MediaType } from '../data/mockMedia';

const typeLabels: Record<MediaType, string> = {
  folder: 'Folder',
  video: 'Video',
  image: 'Image',
  audio: 'Audio',
};

let activeDragGhost: HTMLElement | null = null;

export function removeMediaDragGhost() {
  if (activeDragGhost?.parentNode) {
    activeDragGhost.parentNode.removeChild(activeDragGhost);
  }
  activeDragGhost = null;
}

export function setMediaDragImage(
  event: React.DragEvent,
  title: string,
  type: MediaType,
  itemCount = 1,
) {
  removeMediaDragGhost();

  const ghost = document.createElement('div');
  ghost.setAttribute('role', 'presentation');
  ghost.style.cssText = [
    'position: fixed',
    'top: -1000px',
    'left: -1000px',
    'display: flex',
    'flex-direction: column',
    'gap: 2px',
    'padding: 10px 14px',
    'border-radius: 12px',
    'border: var(--noah-drag-preview-border)',
    'background: var(--noah-drawer-surface)',
    'backdrop-filter: blur(16px)',
    'box-shadow: var(--noah-drag-preview-shadow)',
    'max-width: 260px',
    'pointer-events: none',
    'z-index: 10000',
  ].join(';');

  const titleEl = document.createElement('span');
  titleEl.textContent = itemCount > 1 ? `${itemCount} items` : title;
  titleEl.style.cssText = [
    'font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    'font-size: 13px',
    'font-weight: 600',
    'color: var(--noah-text-primary)',
    'overflow: hidden',
    'text-overflow: ellipsis',
    'white-space: nowrap',
  ].join(';');

  const typeEl = document.createElement('span');
  typeEl.textContent = itemCount > 1 ? 'Moving selection' : typeLabels[type];
  typeEl.style.cssText = [
    'font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    'font-size: 11px',
    'font-weight: 500',
    'color: var(--noah-text-inverse-dim)',
    'text-transform: uppercase',
    'letter-spacing: 0.04em',
  ].join(';');

  ghost.appendChild(titleEl);
  ghost.appendChild(typeEl);
  document.body.appendChild(ghost);
  activeDragGhost = ghost;

  const offsetX = Math.min(ghost.offsetWidth / 2, 80);
  const offsetY = ghost.offsetHeight / 2;
  event.dataTransfer.setDragImage(ghost, offsetX, offsetY);
}
