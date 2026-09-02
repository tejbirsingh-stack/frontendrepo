export function getPortalTarget(): HTMLElement {
  if (typeof document === 'undefined') return null as unknown as HTMLElement;
  return (document.fullscreenElement as HTMLElement) || document.body;
}
