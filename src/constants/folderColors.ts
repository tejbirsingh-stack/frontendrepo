import { WORKSPACE_COLORS, type WorkspaceColorOption } from './workspaceColors';
import { cv } from '../theme/cssVars';

export type FolderColorOption = WorkspaceColorOption;

export const FOLDER_COLORS = WORKSPACE_COLORS;

export const DEFAULT_FOLDER_COLOR: string = cv.warning;
