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
