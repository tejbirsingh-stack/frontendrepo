import type { AnnotationColor } from './annotationColors';
import { palette } from '../theme/cssVars';

export const drawColors: AnnotationColor[] = [
  { id: 'black', label: 'Black', value: palette.black },
  { id: 'red', label: 'Red', value: palette.red },
  { id: 'orange', label: 'Orange', value: palette.orange },
  { id: 'yellow', label: 'Yellow', value: palette.yellow },
  { id: 'green', label: 'Green', value: palette.green },
  { id: 'blue', label: 'Light blue', value: palette.sky },
  { id: 'purple', label: 'Purple', value: palette.purple },
  { id: 'white', label: 'White', value: palette.white },
];

export const DEFAULT_DRAW_COLOR = drawColors[0];
