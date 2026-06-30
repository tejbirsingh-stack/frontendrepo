import type { SvgIconComponent } from '@mui/icons-material';
import AspectRatioOutlinedIcon from '@mui/icons-material/AspectRatioOutlined';
import ClosedCaptionOutlinedIcon from '@mui/icons-material/ClosedCaptionOutlined';
import CompareOutlinedIcon from '@mui/icons-material/CompareOutlined';
import FirstPageOutlinedIcon from '@mui/icons-material/FirstPageOutlined';
import FlipOutlinedIcon from '@mui/icons-material/FlipOutlined';
import GraphicEqOutlinedIcon from '@mui/icons-material/GraphicEqOutlined';
import LastPageOutlinedIcon from '@mui/icons-material/LastPageOutlined';
import LoopOutlinedIcon from '@mui/icons-material/LoopOutlined';
import RotateLeftOutlinedIcon from '@mui/icons-material/RotateLeftOutlined';
import RotateRightOutlinedIcon from '@mui/icons-material/RotateRightOutlined';
import SwapVertOutlinedIcon from '@mui/icons-material/SwapVertOutlined';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import UnfoldMoreDoubleOutlinedIcon from '@mui/icons-material/UnfoldMoreDoubleOutlined';
import WallpaperOutlinedIcon from '@mui/icons-material/WallpaperOutlined';
import type { PlayerToolId } from '../types/playerTools';

export interface PlayerToolDefinition {
  id: PlayerToolId;
  label: string;
  icon: SvgIconComponent;
  shortcut?: string;
  hasSubmenu?: boolean;
  disabled?: boolean;
  pinnable?: boolean;
}

export const PLAYER_TOOL_SECTIONS: PlayerToolDefinition[][] = [
  [{ id: 'audio-meter', label: 'Audio meter', icon: GraphicEqOutlinedIcon, shortcut: 'M' }],
  [
    { id: 'set-in-point', label: 'Set in point', icon: FirstPageOutlinedIcon, shortcut: 'I' },
    { id: 'set-out-point', label: 'Set out point', icon: LastPageOutlinedIcon, shortcut: 'O' },
    { id: 'read-timecode', label: 'Read timecode from file', icon: TimerOutlinedIcon, shortcut: 'G' },
    { id: 'toggle-range', label: 'Toggle range', icon: UnfoldMoreDoubleOutlinedIcon, shortcut: 'R' },
    { id: 'loop', label: 'Loop', icon: LoopOutlinedIcon, shortcut: 'L' },
  ],
  [
    {
      id: 'compare',
      label: 'Compare',
      icon: CompareOutlinedIcon,
      shortcut: 'K',
      disabled: true,
    },
    { id: 'flip', label: 'Flip', icon: FlipOutlinedIcon, shortcut: 'X' },
    { id: 'flop', label: 'Flop', icon: SwapVertOutlinedIcon, shortcut: 'Y' },
    { id: 'rotate-left', label: 'Rotate left', icon: RotateLeftOutlinedIcon, shortcut: '[' },
    { id: 'rotate-right', label: 'Rotate right', icon: RotateRightOutlinedIcon, shortcut: ']' },
    {
      id: 'subtitles',
      label: 'Subtitles',
      icon: ClosedCaptionOutlinedIcon,
      hasSubmenu: true,
      disabled: true,
    },
    {
      id: 'actual-media-size',
      label: 'Actual media size',
      icon: AspectRatioOutlinedIcon,
    },
    {
      id: 'player-background',
      label: 'Player background',
      icon: WallpaperOutlinedIcon,
      hasSubmenu: true,
    },
  ],
];

export const AVAILABLE_PLAYER_TOOL_IDS = new Set<PlayerToolId>(
  PLAYER_TOOL_SECTIONS.flat().map((tool) => tool.id),
);

export const DEFAULT_PINNED_PLAYER_TOOLS: PlayerToolId[] = [];

export const PLAYER_BACKGROUND_OPTIONS = [
  { value: 'black' as const, label: 'Black' },
  { value: 'dark' as const, label: 'Dark gray' },
  { value: 'white' as const, label: 'White' },
  { value: 'checker' as const, label: 'Checkerboard' },
];
