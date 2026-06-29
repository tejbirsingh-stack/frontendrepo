import { palette } from '../theme/cssVars';

export interface AnnotationColor {
  id: string;
  label: string;
  value: string;
  /** @deprecated Legacy rainbow strokes only */
  gradient?: boolean;
}

export const CUSTOM_ANNOTATION_COLOR_ID = 'custom';

export function createCustomAnnotationColor(value: string): AnnotationColor {
  return {
    id: CUSTOM_ANNOTATION_COLOR_ID,
    label: 'Custom color',
    value,
  };
}

export function isCustomAnnotationColor(color: AnnotationColor): boolean {
  return color.id === CUSTOM_ANNOTATION_COLOR_ID;
}

export function isPresetAnnotationColor(color: AnnotationColor): boolean {
  return !color.gradient && color.id !== CUSTOM_ANNOTATION_COLOR_ID;
}

export const annotationColors: AnnotationColor[] = [
  { id: 'black', label: 'Black', value: palette.black },
  { id: 'gray', label: 'Gray', value: palette.gray },
  { id: 'red', label: 'Red', value: palette.red },
  { id: 'orange', label: 'Orange', value: palette.orange },
  { id: 'yellow', label: 'Yellow', value: palette.yellow },
  { id: 'green', label: 'Green', value: palette.green },
  { id: 'teal', label: 'Teal', value: palette.teal },
  { id: 'blue', label: 'Blue', value: palette.blue },
  { id: 'purple', label: 'Purple', value: palette.purple },
  { id: 'pink', label: 'Pink', value: palette.pink },
  { id: 'white', label: 'White', value: palette.white },
  { id: 'gray-light', label: 'Light gray', value: palette.grayLight },
  { id: 'red-light', label: 'Light red', value: palette.redLight },
  { id: 'orange-light', label: 'Light orange', value: palette.orangeLight },
  { id: 'yellow-light', label: 'Light yellow', value: palette.yellowLight },
  { id: 'green-light', label: 'Light green', value: palette.greenLight },
  { id: 'teal-light', label: 'Light teal', value: palette.tealLight },
  { id: 'blue-light', label: 'Light blue', value: palette.blueLight },
  { id: 'purple-light', label: 'Light purple', value: palette.purpleLight },
  { id: 'pink-light', label: 'Light pink', value: palette.pinkLight },
  { id: 'white-soft', label: 'Soft white', value: palette.whiteSoft },
];

export const DEFAULT_ANNOTATION_COLOR = annotationColors[5];
