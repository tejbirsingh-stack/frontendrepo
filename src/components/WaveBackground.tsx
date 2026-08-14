import { Box, type SxProps, type Theme } from '@mui/material';

type WaveBackgroundProps = Readonly<{
  sx?: SxProps<Theme>;
}>;

export default function WaveBackground({ sx }: WaveBackgroundProps) {
  return (
    <Box
      className="wave-background"
      aria-hidden
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        ...sx,
      }}
    >
      <svg
        className="waves"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        viewBox="0 24 150 28"
        preserveAspectRatio="none"
        shapeRendering="auto"
      >
        <defs>
          <path
            id="gentle-wave"
            d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z"
          />
        </defs>
        <g className="parallax">
          <use xlinkHref="#gentle-wave" x="48" y="0" fill="var(--noah-wave-fill-1)" />
          <use xlinkHref="#gentle-wave" x="48" y="3" fill="var(--noah-wave-fill-2)" />
          <use xlinkHref="#gentle-wave" x="48" y="5" fill="var(--noah-wave-fill-3)" />
          <use xlinkHref="#gentle-wave" x="48" y="7" fill="var(--noah-wave-fill-4)" />
        </g>
      </svg>
    </Box>
  );
}
