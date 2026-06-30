export type CustomStampId = `custom-${string}`;

export interface CustomStamp {
  id: CustomStampId;
  emoji: string;
  label: string;
}
