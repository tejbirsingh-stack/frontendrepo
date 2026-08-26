/** Bounding box of a detected face, as percentages of the media frame. */
export interface FramePersonBox {
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
}

export interface FramePerson {
  id: string;
  name: string;
  initials: string;
  detail: string;
  box: FramePersonBox;
}

/** Placeholder faces shown until frame analysis is wired to a real service. */
export const MOCK_FRAME_PEOPLE: FramePerson[] = [
  {
    id: 'ai-person-1',
    name: 'Person 1',
    initials: 'P1',
    detail: 'Center frame',
    box: { xPercent: 44, yPercent: 30, widthPercent: 13, heightPercent: 20 },
  },
  {
    id: 'ai-person-2',
    name: 'Person 2',
    initials: 'P2',
    detail: 'Left of frame',
    box: { xPercent: 22, yPercent: 34, widthPercent: 12, heightPercent: 18 },
  },
  {
    id: 'ai-person-3',
    name: 'Person 3',
    initials: 'P3',
    detail: 'Right of frame',
    box: { xPercent: 66, yPercent: 33, widthPercent: 12, heightPercent: 18 },
  },
  {
    id: 'ai-person-4',
    name: 'Person 4',
    initials: 'P4',
    detail: 'Background',
    box: { xPercent: 48, yPercent: 18, widthPercent: 8, heightPercent: 12 },
  },
  {
    id: 'ai-person-5',
    name: 'Person 5',
    initials: 'P5',
    detail: 'Background left',
    box: { xPercent: 31, yPercent: 20, widthPercent: 8, heightPercent: 12 },
  },
  {
    id: 'ai-person-6',
    name: 'Person 6',
    initials: 'P6',
    detail: 'Background right',
    box: { xPercent: 60, yPercent: 19, widthPercent: 8, heightPercent: 12 },
  },
  {
    id: 'ai-person-7',
    name: 'Person 7',
    initials: 'P7',
    detail: 'Foreground left',
    box: { xPercent: 12, yPercent: 52, widthPercent: 14, heightPercent: 22 },
  },
  {
    id: 'ai-person-8',
    name: 'Person 8',
    initials: 'P8',
    detail: 'Foreground right',
    box: { xPercent: 74, yPercent: 54, widthPercent: 14, heightPercent: 22 },
  },
  {
    id: 'ai-person-9',
    name: 'Person 9',
    initials: 'P9',
    detail: 'Partially occluded',
    box: { xPercent: 38, yPercent: 56, widthPercent: 11, heightPercent: 17 },
  },
  {
    id: 'ai-person-10',
    name: 'Person 10',
    initials: 'P10',
    detail: 'Edge of frame',
    box: { xPercent: 88, yPercent: 30, widthPercent: 10, heightPercent: 16 },
  },
  {
    id: 'ai-person-11',
    name: 'Person 11',
    initials: 'P11',
    detail: 'Crowd',
    box: { xPercent: 6, yPercent: 24, widthPercent: 8, heightPercent: 12 },
  },
  {
    id: 'ai-person-12',
    name: 'Person 12',
    initials: 'P12',
    detail: 'Crowd',
    box: { xPercent: 55, yPercent: 62, widthPercent: 10, heightPercent: 16 },
  },
];
