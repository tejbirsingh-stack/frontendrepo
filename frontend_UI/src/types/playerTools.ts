export type PlayerToolId =
  | 'audio-meter'
  | 'set-in-point'
  | 'set-out-point'
  | 'read-timecode'
  | 'toggle-range'
  | 'loop'
  | 'compare'
  | 'flip'
  | 'flop'
  | 'rotate-left'
  | 'rotate-right'
  | 'subtitles'
  | 'actual-media-size'
  | 'player-background';

export type PlayerBackground = 'black' | 'dark' | 'white' | 'checker';

export interface PlayerToolHandlers {
  onToggleLoop: () => void;
  onToggleFlip: () => void;
  onToggleFlop: () => void;
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onSetInPoint: () => void;
  onSetOutPoint: () => void;
  onReadTimecode: () => void;
  onToggleRange: () => void;
  onToggleAudioMeter: () => void;
  onToggleActualMediaSize: () => void;
  onPlayerBackgroundChange: (background: PlayerBackground) => void;
}

export interface PlayerToolsViewState {
  loop: boolean;
  flipHorizontal: boolean;
  flipVertical: boolean;
  rotationSteps: number;
  inPoint: number | null;
  outPoint: number | null;
  rangeEnabled: boolean;
  actualMediaSize: boolean;
  playerBackground: PlayerBackground;
  showAudioMeter: boolean;
}
