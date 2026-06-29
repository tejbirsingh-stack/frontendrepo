/** Shared SVG filters — one GPU pass per stamp instead of dozens of CSS drop-shadows. */
export default function StampStickerFilterDefs() {
  return (
    <svg
      aria-hidden
      focusable="false"
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
    >
      <defs>
        <filter
          id="noah-stamp-sticker"
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
          colorInterpolationFilters="sRGB"
        >
          <feMorphology operator="dilate" radius="3" in="SourceAlpha" result="dilated" />
          <feFlood floodColor="var(--noah-text-inverse)" result="white" />
          <feComposite in="white" in2="dilated" operator="in" result="outline" />
          <feMerge result="flat">
            <feMergeNode in="outline" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
          <feDropShadow
            in="flat"
            dx="3"
            dy="5"
            stdDeviation="2.5"
            floodColor="var(--noah-video-stage)"
            floodOpacity="0.28"
          />
        </filter>

        <filter
          id="noah-stamp-sticker-selected"
          x="-60%"
          y="-60%"
          width="220%"
          height="220%"
          colorInterpolationFilters="sRGB"
        >
          <feMorphology operator="dilate" radius="5" in="SourceAlpha" result="selDilated" />
          <feFlood floodColor="var(--noah-purple-light)" floodOpacity="0.8" result="selColor" />
          <feComposite in="selColor" in2="selDilated" operator="in" result="selection" />
          <feMorphology operator="dilate" radius="3" in="SourceAlpha" result="dilated" />
          <feFlood floodColor="var(--noah-text-inverse)" result="white" />
          <feComposite in="white" in2="dilated" operator="in" result="outline" />
          <feMerge result="flat">
            <feMergeNode in="selection" />
            <feMergeNode in="outline" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
          <feDropShadow
            in="flat"
            dx="3"
            dy="5"
            stdDeviation="2.5"
            floodColor="var(--noah-video-stage)"
            floodOpacity="0.28"
          />
        </filter>
      </defs>
    </svg>
  );
}
