import type { ReactNode } from 'react';
import { SkeletonTheme } from 'react-loading-skeleton';
import { useThemePreference } from '../../context/ThemePreferenceContext';
import { getSkeletonThemeColors } from '../../theme/skeletonColors';

export default function AppSkeletonTheme({ children }: { children: ReactNode }) {
  const { effectiveMode } = useThemePreference();
  const colors = getSkeletonThemeColors(effectiveMode);

  return (
    <SkeletonTheme
      key={effectiveMode}
      baseColor={colors.baseColor}
      highlightColor={colors.highlightColor}
      borderRadius="0.5rem"
      duration={1.5}
    >
      {children}
    </SkeletonTheme>
  );
}
