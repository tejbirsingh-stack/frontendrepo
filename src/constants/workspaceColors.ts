import { palette } from '../theme/cssVars';

export interface WorkspaceColorOption {
  id: string;
  label: string;
  value: string;
}

export const WORKSPACE_COLORS: WorkspaceColorOption[] = [
  { id: 'green', label: 'Green', value: palette.green },
  { id: 'red', label: 'Red', value: palette.red },
  { id: 'blue', label: 'Blue', value: palette.blue },
  { id: 'purple', label: 'Purple', value: palette.purple },
  { id: 'orange', label: 'Orange', value: palette.orange },
  { id: 'pink', label: 'Pink', value: palette.pink },
  { id: 'cyan', label: 'Cyan', value: palette.cyan },
  { id: 'yellow', label: 'Yellow', value: palette.yellow },
];

export const DEFAULT_WORKSPACE_COLOR = WORKSPACE_COLORS[0].value;

export function workspaceColorGlow(color: string) {
  return `0 0 8px color-mix(in srgb, ${color} 50%, transparent)`;
}
