import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const srcDir = path.join(root, 'src');

const skipFiles = new Set([
  'src/styles/_palette.scss',
  'src/styles/_theme.scss',
  'src/theme/cssVars.ts',
  'src/assets/vite.svg',
  'src/assets/react.svg',
]);

const replacements = [
  // Template literal borders
  ['`1px solid rgba(255, 255, 255, 0.05)`', '`1px solid ${cv.dividerSubtle}`'],
  ['`1px solid rgba(255, 255, 255, 0.06)`', '`1px solid ${cv.divider}`'],
  ["'1px solid rgba(255, 255, 255, 0.05)'", '`1px solid ${cv.dividerSubtle}`'],
  ["'1px solid rgba(255, 255, 255, 0.06)'", '`1px solid ${cv.divider}`'],
  ['borderBottom: `1px solid rgba(255, 255, 255, 0.05)`', 'borderBottom: `1px solid ${cv.dividerSubtle}`'],
  ['borderBottom: `1px solid rgba(255, 255, 255, 0.06)`', 'borderBottom: `1px solid ${cv.divider}`'],
  ['borderTop: `1px solid rgba(255, 255, 255, 0.05)`', 'borderTop: `1px solid ${cv.dividerSubtle}`'],
  ['borderRight: { md: `1px solid rgba(255, 255, 255, 0.06)` }', 'borderRight: { md: `1px solid ${cv.divider}` }'],
  ['borderBottom: { xs: `1px solid rgba(255, 255, 255, 0.06)`, md: \'none\' }', 'borderBottom: { xs: `1px solid ${cv.divider}`, md: \'none\' }'],
  ['border: `1px solid rgba(239, 68, 68, 0.25)`', 'border: `1px solid ${cv.redGlowSoft}`'],
  ['? `1px solid rgba(147, 51, 234, 0.35)`', '? `1px solid ${cv.purpleSelectionStrong}`'],

  // Core hex
  ["'#0c0c10'", 'cv.dialogSurface'],
  ['"#0c0c10"', 'cv.dialogSurface'],
  ["'#050508'", 'cv.bg'],
  ["'#f5f5f7'", 'cv.textPrimary'],
  ["'#ffffff'", 'cv.textInverse'],
  ['"#ffffff"', 'cv.textInverse'],
  ["'#fff'", 'cv.textInverse'],
  ["'#000'", 'cv.videoStage'],
  ["'#000000'", 'cv.videoStage'],
  ["'#111111'", 'palette.black'],
  ["'#111827'", 'cv.gray900Ui'],
  ["'#121216'", 'cv.elevatedSurface'],
  ["'#1a1a1a'", 'cv.inkDark'],
  ["'#222222'", 'cv.emojiPickerSurface'],
  ["'#6366f1'", 'cv.indigo'],
  ["'#9333ea'", 'cv.brandPurple'],
  ["'#2563eb'", 'cv.brandBlue'],
  ["'#1d4ed8'", 'cv.brandBlueDark'],
  ["'#7e22ce'", 'cv.brandPurpleDark'],
  ["'#a5b4fc'", 'cv.indigoLight'],
  ["'#c084fc'", 'cv.purpleLight'],
  ["'#e9d5ff'", 'cv.purpleLighter'],
  ["'#86efac'", 'cv.successText'],
  ["'#4ade80'", 'cv.greenBright'],
  ["'#fbbf24'", 'cv.warning'],
  ["'#fca5a5'", 'cv.errorText'],
  ["'#f87171'", 'palette.redLight'],
  ["'#1a652a'", 'cv.successDark'],
  ["'#16161c'", 'cv.avatarSurplusBg'],
  ["'#173554'", 'cv.linkChipText'],
  ["'#b7d7f6'", 'cv.linkChipBg'],
  ["'#a5ccf3'", 'cv.linkChipBgHover'],
  ["'#dc2626'", 'cv.destructiveStrong'],
  ["'#b91c1c'", 'cv.destructiveDeep'],
  ["'#4b5563'", 'cv.gray600'],
  ["'#6b7280'", 'palette.gray'],
  ["'#e5e7eb'", 'cv.gray200'],
  ["'#a855f7'", 'palette.purple'],
  ["'#ef4444'", 'palette.red'],
  ["'#eab308'", 'palette.yellow'],
  ["'#22c55e'", 'palette.green'],
  ["'#06b6d4'", 'palette.cyan'],
  ["'#f59e0b'", 'palette.amber'],
  ["'#ec4899'", 'palette.pink'],
  ["'#3b82f6'", 'palette.blue'],
  ["'#60a5fa'", 'palette.blueLight'],
  ["'#f97316'", 'palette.orange'],
  ["'#64748b'", 'cv.slateAvatar'],

  // White alphas
  ["'rgba(255, 255, 255, 0.015)'", 'cv.panelTint'],
  ["'rgba(255, 255, 255, 0.02)'", 'cv.surfaceSubtle'],
  ["'rgba(255, 255, 255, 0.03)'", 'cv.surfaceMuted'],
  ["'rgba(255, 255, 255, 0.04)'", 'cv.glassBackground'],
  ["'rgba(255, 255, 255, 0.05)'", 'cv.dividerSubtle'],
  ["'rgba(255, 255, 255, 0.06)'", 'cv.insetHighlight'],
  ["'rgba(255, 255, 255, 0.07)'", 'cv.surfaceHover'],
  ["'rgba(255, 255, 255, 0.08)'", 'cv.surfaceRaised'],
  ["'rgba(255, 255, 255, 0.1)'", 'cv.whiteBorderSoft'],
  ["'rgba(255, 255, 255, 0.12)'", 'cv.surfaceActive'],
  ["'rgba(255, 255, 255, 0.14)'", 'cv.annotationGuide'],
  ["'rgba(255, 255, 255, 0.15)'", 'cv.borderInputHover'],
  ["'rgba(255, 255, 255, 0.2)'", 'cv.borderStrong'],
  ["'rgba(255, 255, 255, 0.28)'", 'cv.whiteBorderDashed'],
  ["'rgba(255, 255, 255, 0.92)'", 'cv.whiteSurfaceMedium'],
  ["'rgba(255, 255, 255, 0.96)'", 'cv.whiteSurfaceStrong'],
  ["'rgba(255,255,255,0.06)'", 'cv.insetHighlight'],
  ["'rgba(255,255,255,0.02) 100%)'", 'cv.surfaceSubtle + \' 100%)\''],
  ["'rgba(255, 255, 255, 0.055) 1px, transparent 1px'", 'cv.gridDot + \' 1px, transparent 1px\''],

  // Purple
  ["'rgba(147, 51, 234, 0.08)'", 'cv.purpleSurface'],
  ["'rgba(147, 51, 234, 0.12)'", 'cv.purpleSelectionSoft'],
  ["'rgba(147, 51, 234, 0.14)'", 'cv.purpleSelectionBg'],
  ["'rgba(147, 51, 234, 0.16)'", 'cv.purpleSurfaceHover'],
  ["'rgba(147, 51, 234, 0.18)'", 'cv.purpleSelectionHover'],
  ["'rgba(147, 51, 234, 0.2)'", 'cv.purpleSurfaceActive'],
  ["'rgba(147, 51, 234, 0.22)'", 'cv.purpleSelectionMedium'],
  ["'rgba(147, 51, 234, 0.24)'", 'cv.purpleGlowSoft'],
  ["'rgba(147, 51, 234, 0.25)'", 'cv.purpleFocusRing'],
  ["'rgba(147, 51, 234, 0.28)'", 'cv.purpleSelection'],
  ["'rgba(147, 51, 234, 0.35)'", 'cv.purpleSelectionStrong'],
  ["'rgba(147, 51, 234, 0.45)'", 'cv.purpleSelectionBorder'],
  ["'rgba(147, 51, 234, 0.5)'", 'cv.purpleFocusBorder'],
  ["'rgba(147, 51, 234, 0.65)'", 'cv.emojiPickerInputBorder'],
  ["'rgba(147, 51, 234, 0.85)'", 'cv.purpleSelectionRing'],
  ["'rgba(192, 132, 252, 0.25)'", 'cv.strokeFocusRing'],
  ["'rgba(192, 132, 252, 0.85)'", 'cv.purpleLightStrong'],
  ["'rgba(192, 132, 252, 0.95)'", 'cv.purpleLightDashed'],

  // Blue / indigo
  ["'rgba(99, 102, 241, 0.12)'", 'cv.indigoSurface'],
  ["'rgba(99, 102, 241, 0.15)'", 'cv.indigoAccentSurface'],
  ["'rgba(99, 102, 241, 0.2)'", 'cv.indigoSurface'],
  ["'rgba(37, 99, 235, 0.08)'", 'cv.blueSelectionHover'],
  ["'rgba(37, 99, 235, 0.1)'", 'cv.blueDragSurface'],
  ["'rgba(37, 99, 235, 0.12)'", 'cv.blueSelectionSurface'],
  ["'rgba(37, 99, 235, 0.15)'", 'cv.blueAccentSurface'],
  ["'rgba(37, 99, 235, 0.18)'", 'cv.blueGlow18'],
  ["'rgba(37, 99, 235, 0.22)'", 'cv.brandShadowSoft'],
  ["'rgba(37, 99, 235, 0.24)'", 'cv.blueGlow24'],
  ["'rgba(37, 99, 235, 0.25)'", 'cv.brandShadowStrong'],
  ["'rgba(37, 99, 235, 0.3)'", 'cv.brandShadow'],

  // Status / accent
  ["'rgba(239, 68, 68, 0.12)'", 'cv.destructiveHover'],
  ["'rgba(239, 68, 68, 0.15)'", 'cv.destructiveSurface'],
  ["'rgba(239, 68, 68, 0.25)'", 'cv.redGlowSoft'],
  ["'rgba(239, 68, 68, 0.35)'", 'cv.destructiveBorderSoft'],
  ["'rgba(34, 197, 94, 0.12)'", 'cv.successSurface'],
  ["'rgba(74, 222, 128, 0.12)'", 'cv.greenBrightSurface'],
  ["'rgba(251, 191, 36, 0.12)'", 'cv.warningSurface'],
  ["'rgba(251, 191, 36, 0.15)'", 'cv.yellowAccentSurface'],

  // Black overlays (light UI)
  ["'rgba(0, 0, 0, 0.04)'", 'cv.inkOverlay04'],
  ["'rgba(0, 0, 0, 0.06)'", 'cv.inkOverlay06'],
  ["'rgba(0, 0, 0, 0.08)'", 'cv.inkOverlay08'],
  ["'rgba(0, 0, 0, 0.1)'", 'cv.inkOverlay10'],
  ["'rgba(0, 0, 0, 0.12)'", 'cv.inkOverlay12'],
  ["'rgba(0, 0, 0, 0.14)'", 'cv.inkOverlay14'],
  ["'rgba(0, 0, 0, 0.16)'", 'cv.inkOverlay16'],
  ["'rgba(0, 0, 0, 0.18)'", 'cv.inkOverlay18'],
  ["'rgba(0, 0, 0, 0.2)'", 'cv.inkOverlay20'],
  ["'rgba(0, 0, 0, 0.25)'", 'cv.inkOverlay25'],
  ["'rgba(0, 0, 0, 0.28)'", 'cv.inkOverlay28'],
  ["'rgba(0, 0, 0, 0.35)'", 'cv.inkOverlay35'],
  ["'rgba(0, 0, 0, 0.38)'", 'cv.inkOverlay38'],
  ["'rgba(0, 0, 0, 0.8)'", 'cv.inkOverlay80'],
  ["'rgba(0, 0, 0, 0.88)'", 'cv.inkOverlay88'],
  ["'rgba(17, 17, 17, 0.72)'", 'cv.inkScrim72'],
  ["'rgba(17, 17, 17, 0.88)'", 'cv.inkScrim88'],
  ["'rgba(0, 0, 0, 0.45)'", 'cv.dropdownShadow'],
  ["'rgba(0, 0, 0, 0.5)'", 'cv.popoverShadow'],
  ["'rgba(0, 0, 0, 0.55)'", 'cv.dialogShadow'],
  ["'rgba(0, 0, 0, 0.65)'", 'cv.backdropScrim'],
  ["'rgba(0, 0, 0, 0.72)'", 'cv.backdropScrimStrong'],

  // Gradients
  ["'linear-gradient(135deg, #2563eb 0%, #9333ea 100%)'", 'cv.brandGradient'],
  ["'linear-gradient(135deg, #1d4ed8 0%, #7e22ce 100%)'", 'cv.brandGradientHover'],
  ["'linear-gradient(135deg, rgba(37, 99, 235, 0.35) 0%, rgba(147, 51, 234, 0.35) 100%)'", 'cv.stampGradient'],
  ["'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(255, 255, 255, 0.03) 48%)'", 'cv.billingHeroGradient'],
  ["'linear-gradient(90deg, rgba(37, 99, 235, 0.18) 0%, rgba(147, 51, 234, 0.18) 100%)'", 'cv.bluePurpleGradient'],
  ["'linear-gradient(160deg, rgba(147, 51, 234, 0.15) 0%, rgba(37, 99, 235, 0.08) 100%)'", 'cv.uploadPreviewGradient'],

  // Composite shadows
  ["'0 12px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.06)'", 'cv.islandShadow'],
  ["'0 12px 32px rgba(0, 0, 0, 0.45)'", 'cv.tooltipShadow'],
  ["'0 16px 48px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.06)'", 'cv.toolbarShadow'],
  ["'0 16px 48px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.04)'", 'cv.popoverShadow'],
  ["'0 16px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.06)'", 'cv.selectedToolbarShadow'],
  ["'0 16px 40px rgba(0, 0, 0, 0.55)'", 'cv.dropdownShadow'],
  ["'0 24px 64px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.06)'", 'cv.dialogShadow'],
  ["'0 24px 64px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.06)'", 'cv.dialogShadow'],
  ["'0 8px 32px rgba(37, 99, 235, 0.35)'", 'cv.loginBrandShadow'],
  ["'0 12px 40px rgba(147, 51, 234, 0.4)'", 'cv.loginBrandShadowHover'],
  ["'0 4px 14px rgba(37, 99, 235, 0.22)'", 'cv.brandShadowSoft'],
  ["'0 4px 16px rgba(37, 99, 235, 0.3)'", 'cv.brandShadow'],
  ["'0 4px 16px rgba(239, 68, 68, 0.25)'", 'cv.redGlowSoft'],
  ["'0 8px 24px rgba(37, 99, 235, 0.25)'", 'cv.brandShadowStrong'],
  ["'0 0 0 6px rgba(37, 99, 235, 0.22)'", 'cv.focusRingBlue'],
  ["'0 0 0 4px rgba(192, 132, 252, 0.25)'", 'cv.focusRingPurple4'],
  ["'0 0 0 2px rgba(147, 51, 234, 0.25)'", 'cv.focusRingPurple2'],
  ["'0 0 0 1px rgba(0, 0, 0, 0.35)'", 'cv.playheadRing'],
  ["'0 0 0 1px rgba(147, 51, 234, 0.12)'", 'cv.purpleFocusRingTight'],
  ["'0 6px 18px rgba(0, 0, 0, 0.28)'", 'cv.stampMarkerShadow'],
  ["'0 2px 8px rgba(147, 51, 234, 0.35)'", 'cv.avatarPinShadow'],
  ["'0 12px 40px rgba(0, 0, 0, 0.16), 0 2px 8px rgba(0, 0, 0, 0.06)'", 'cv.commentCardShadow'],
  ["'0 10px 32px rgba(0, 0, 0, 0.14), 0 2px 8px rgba(0, 0, 0, 0.06)'", 'cv.commentHoverShadow'],
  ["'0 8px 28px rgba(0, 0, 0, 0.18), 0 2px 8px rgba(0, 0, 0, 0.08)'", 'cv.markerShadow'],
  ["'0 4px 16px rgba(0, 0, 0, 0.18)'", 'cv.previewPlayShadow'],
  ["'0 12px 32px rgba(0, 0, 0, 0.25)'", 'cv.previewCardShadow'],
  ["'0 20px 48px rgba(0, 0, 0, 0.55)'", 'cv.dialogShadow'],
  ["'-8px 0 32px rgba(0, 0, 0, 0.45)'", 'cv.dropdownShadow'],

  // SVG / attributes
  ['borderColor="#0c0c10"', 'borderColor={cv.dialogSurface}'],
  ['borderColor="rgba(12, 12, 16, 1)"', 'borderColor={cv.dialogSurface}'],
  ['stroke="rgba(255, 255, 255, 0.14)"', 'stroke={cv.annotationGuide}'],
  ['stopColor="#ef4444"', 'stopColor={cv.rainbowRed}'],
  ['stopColor="#eab308"', 'stopColor={cv.rainbowYellow}'],
  ['stopColor="#22c55e"', 'stopColor={cv.rainbowGreen}'],
  ['stopColor="#3b82f6"', 'stopColor={cv.rainbowBlue}'],
  ['stopColor="#a855f7"', 'stopColor={cv.rainbowPurple}'],
  ['outline: \'2px solid #9333ea\'', 'outline: `2px solid ${cv.brandPurple}`'],
  ['border: \'2px solid #c084fc\'', 'border: `2px solid ${cv.purpleLight}`'],
  ['border: "2px solid #c084fc"', 'border: `2px solid ${cv.purpleLight}`'],
  ['borderTop: \'6px solid #111827\'', 'borderTop: `6px solid ${cv.gray900Ui}`'],
  ['fallbackColor = \'#a855f7\'', 'fallbackColor = palette.purple'],
  ["repeating-conic-gradient(#6b7280 0% 25%, #9ca3af 0% 50%) 50% / 18px 18px", '`repeating-conic-gradient(${cv.checkerDark} 0% 25%, ${cv.checkerLight} 0% 50%) 50% / 18px 18px`'],
  ['backgroundImage: \'radial-gradient(circle, rgba(255, 255, 255, 0.055) 1px, transparent 1px)\'', 'backgroundImage: `radial-gradient(circle, ${cv.gridDot} 1px, transparent 1px)`'],

  // Emoji picker CSS vars
  ["'--background': '#222222'", "'--background': cv.emojiPickerSurface"],
  ["'--border-color': 'rgba(255, 255, 255, 0.1)'", "'--border-color': cv.whiteBorderSoft"],
  ["'--input-border-color': 'rgba(147, 51, 234, 0.65)'", "'--input-border-color': cv.emojiPickerInputBorder"],
  ["'--category-font-color': '#f3f4f6'", "'--category-font-color': cv.emojiPickerText"],
  ["'--input-font-color': '#f3f4f6'", "'--input-font-color': cv.emojiPickerText"],
  ["'--input-placeholder-color': 'rgba(243, 244, 246, 0.55)'", "'--input-placeholder-color': cv.emojiPickerPlaceholder"],

  // Legacy colors object
  ['background: colors.brandGradient', 'background: cv.brandGradient'],
  ['colors.brandGradient', 'cv.brandGradient'],
  ['colors.purple', 'cv.brandPurple'],
  ['colors.blue', 'cv.brandBlue'],
  ['fill="rgba(255, 255, 255, 0.12)"', 'fill="var(--noah-wave-fill-1)"'],
  ['fill="rgba(255, 255, 255, 0.08)"', 'fill="var(--noah-wave-fill-2)"'],
  ['fill="rgba(255, 255, 255, 0.05)"', 'fill="var(--noah-wave-fill-3)"'],
  ['fill="rgba(255, 255, 255, 0.03)"', 'fill="var(--noah-wave-fill-4)"'],

  // Round 3 — remaining literals
  ["'rgba(255, 255, 255, 0.55)'", 'cv.textInverseMuted'],
  ["'rgba(255, 255, 255, 0.08)'", 'cv.surfaceRaised'],
  ["'rgba(37, 99, 235, 0.06)'", 'cv.blueSelectionFaint'],
  ["'rgba(37, 99, 235, 0.14)'", 'cv.blueAccentMedium'],
  ["'rgba(37, 99, 235, 0.18)'", 'cv.blueGlow18'],
  ["'rgba(37, 99, 235, 0.28)'", 'cv.blueGlowStrong'],
  ["'rgba(37, 99, 235, 0.35)'", 'cv.blueGlow35'],
  ["'rgba(37, 99, 235, 0.45)'", 'cv.blueBorderStrong'],
  ["'rgba(37, 99, 235, 0.2)'", 'cv.blueBorderSoft'],
  ["'rgba(37, 99, 235, 0.5)'", 'cv.blueGlow50'],
  ["'rgba(34, 197, 94, 0.14)'", 'cv.greenAccentMedium'],
  ["'rgba(34, 197, 94, 0.15)'", 'cv.greenAccentSurface'],
  ["'rgba(147, 51, 234, 0.15)'", 'cv.purpleAccentSurface'],
  ["'rgba(0, 0, 0, 0.3)'", 'cv.blackScrim30'],
  ["'rgba(0, 0, 0, 0.7)'", 'cv.blackScrim70'],
  ["'rgba(0, 0, 0, 0.12)'", 'cv.inkOverlay12'],
  ["'#f472b6'", 'palette.pinkLight'],
  ["'#bfdbfe'", 'cv.blue200'],
  ["'#e879a8'", 'cv.pinkAccent'],
  ["'#8fa3b8'", 'cv.slateMuted'],
  ["'#ffffff'", 'cv.textInverse'],
  ["'linear-gradient(90deg, #2563eb 0%, #9333ea 100%)'", 'cv.brandGradientHorizontal'],
  ["'conic-gradient(#ef4444, #eab308, #22c55e, #3b82f6, #a855f7, #ef4444)'", 'cv.rainbowConic'],
  ["'1px solid rgba(147, 51, 234, 0.25)'", '`1px solid ${cv.purpleBorderSoft}`'],
  ["'1px solid rgba(147, 51, 234, 0.45)'", '`1px solid ${cv.purpleSelectionBorder}`'],
  ["'1px solid rgba(255, 255, 255, 0.08)'", '`1px solid ${cv.emojiPickerBorder}`'],
  ["'2px solid #c084fc'", '`2px solid ${cv.purpleLight}`'],
  ["'2px solid #ffffff'", '`2px solid ${cv.textInverse}`'],
  ["'1.5px dashed rgba(192, 132, 252, 0.95)'", '`1.5px dashed ${cv.purpleLightDashed}`'],
  ["'2px dashed rgba(255, 255, 255, 0.28)'", '`2px dashed ${cv.whiteBorderDashed}`'],
  ["'1px solid rgba(0, 0, 0, 0.12)'", '`1px solid ${cv.inkOverlay12}`'],
  ["'1px solid rgba(0, 0, 0, 0.08)'", '`1px solid ${cv.inkOverlay08}`'],
  ["borderRight: \"1px solid rgba(255, 255, 255, 0.05)\"", 'borderRight: `1px solid ${cv.dividerSubtle}`'],
  ["borderBottom: \"1px solid rgba(255, 255, 255, 0.05)\"", 'borderBottom: `1px solid ${cv.dividerSubtle}`'],
  ["'0 20px 48px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.06)'", 'cv.popoverShadowElevated'],
  ["'0 12px 32px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.06)'", 'cv.islandShadowStrong'],
  ["'0 16px 48px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.04)'", 'cv.popoverShadow'],
  ["'0 12px 32px rgba(0, 0, 0, 0.3)'", 'cv.cardHoverShadow'],
  ["'0 4px 16px rgba(0, 0, 0, 0.35)'", 'cv.shapePickerShadow'],
  ["'0 0 8px rgba(37, 99, 235, 0.5)'", 'cv.notificationGlow'],
  ["'0 0 0 2px rgba(147, 51, 234, 0.35)'", 'cv.purpleSelectionStrong'],
  ["'inset 0 0 0 1px rgba(147, 51, 234, 0.35)'", '`inset 0 0 0 1px ${cv.purpleSelectionStrong}`'],
  ["'1px solid rgba(147, 51, 234, 0.35)'", '`1px solid ${cv.purpleSelectionStrong}`'],
  ["'2px solid rgba(147, 51, 234, 0.85)'", '`2px solid ${cv.purpleSelectionRing}`'],
  ["'linear-gradient(to top, rgba(0, 0, 0, 0.88) 0%, rgba(0, 0, 0, 0.45) 50%, transparent 100%)'", 'cv.videoScrimGradient'],
  ["'linear-gradient(160deg, ${config.accent} 0%, rgba(147, 51, 234, 0.08) 100%)'", '`linear-gradient(160deg, ${config.accent} 0%, ${cv.mediaTypeGradientEnd} 100%)`'],
  ["'linear-gradient(160deg, ${typeConfig.audio.accent} 0%, rgba(147, 51, 234, 0.08) 100%)'", '`linear-gradient(160deg, ${typeConfig.audio.accent} 0%, ${cv.mediaTypeGradientEnd} 100%)`'],
  ["scrollbarColor: 'rgba(255, 255, 255, 0.28) transparent'", 'scrollbarColor: `${cv.whiteBorderDashed} transparent`'],
  ["accent: 'rgba(37, 99, 235, 0.15)'", 'accent: cv.blueAccentSurface'],
  ["accent: 'rgba(34, 197, 94, 0.15)'", 'accent: cv.greenAccentSurface'],
  ["accent: 'rgba(251, 191, 36, 0.15)'", 'accent: cv.yellowAccentSurface'],
  ["accent: 'rgba(147, 51, 234, 0.15)'", 'accent: cv.purpleAccentSurface'],
  ["backgroundColor: 'rgba(37, 99, 235, 0.18) !important'", 'backgroundColor: `${cv.blueGlow18} !important`'],
  ["borderColor: 'rgba(37, 99, 235, 0.35) !important'", 'borderColor: `${cv.blueGlow35} !important`'],
  ["? 'rgba(37, 99, 235, 0.06)'", '? cv.blueSelectionFaint'],
  ["? 'rgba(37, 99, 235, 0.28)'", '? cv.blueGlowStrong'],
  ["? 'rgba(37, 99, 235, 0.35)'", '? cv.blueGlow35'],
  ["? 'rgba(37, 99, 235, 0.45)'", '? cv.blueBorderStrong'],
  ["? 'rgba(37, 99, 235, 0.2)'", '? cv.blueBorderSoft'],
  ["? '1px solid rgba(147, 51, 234, 0.45)'", '? `1px solid ${cv.purpleSelectionBorder}`'],
  ["open ? '1px solid rgba(147, 51, 234, 0.45)' : '1px solid transparent'", 'open ? `1px solid ${cv.purpleSelectionBorder}` : \'1px solid transparent\''],
  ["active ? '1px solid rgba(147, 51, 234, 0.45)' : '1px solid transparent'", 'active ? `1px solid ${cv.purpleSelectionBorder}` : \'1px solid transparent\''],
  ["isActive ? '0 0 0 2px rgba(147, 51, 234, 0.35)' : 'none'", 'isActive ? `0 0 0 2px ${cv.purpleSelectionStrong}` : \'none\''],
  ["isDropTarget ? '0 0 0 2px rgba(147, 51, 234, 0.35)' : 'none'", 'isDropTarget ? `0 0 0 2px ${cv.purpleSelectionStrong}` : \'none\''],
  ["isActive ? '0 0 0 2px rgba(147, 51, 234, 0.35)' : 'none'", 'isActive ? cv.focusRingPurple2 : \'none\''],
  ["highlighted ? '0 0 0 2px rgba(147, 51, 234, 0.25)' : 'none'", 'highlighted ? cv.focusRingPurple2 : \'none\''],
  ["isActive ? 'inset 0 0 0 1px rgba(147, 51, 234, 0.35)' : 'none'", 'isActive ? `inset 0 0 0 1px ${cv.purpleSelectionStrong}` : \'none\''],
  ["background: 'rgba(0, 0, 0, 0.2)'", 'background: cv.inkOverlay20'],
  ["background: 'rgba(0, 0, 0, 0.7)'", 'background: cv.blackScrim70'],
  ["backgroundColor: 'rgba(0, 0, 0, 0.35)'", 'backgroundColor: cv.drawerScrim'],
  ["backgroundColor: 'rgba(0, 0, 0, 0.28)'", 'backgroundColor: cv.timelineScrim'],
  ["boxShadow: '0 16px 40px rgba(0, 0, 0, 0.45)'", 'boxShadow: cv.dropdownShadow'],
];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist') continue;
      walk(full, files);
    } else if (/\.(tsx?|css)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

function ensureThemeImports(content, filePath) {
  const needsCv = content.includes('cv.');
  const needsPalette = content.includes('palette.');
  if (!needsCv && !needsPalette) return content;

  const rel = path.relative(path.dirname(filePath), path.join(srcDir, 'theme/cssVars')).replace(/\\/g, '/');
  const importPath = rel.startsWith('.') ? rel : `./${rel}`;
  const normalized = importPath.replace(/\.ts$/, '');

  const hasImport = content.includes(`'${normalized}'`) || content.includes(`"${normalized}"`);
  if (hasImport) return content;

  const names = [];
  if (needsCv) names.push('cv');
  if (needsPalette) names.push('palette');
  const importLine = `import { ${names.join(', ')} } from '${normalized}';\n`;

  const importMatch = content.match(/^import .+;\n/m);
  if (importMatch) {
    const idx = content.indexOf(importMatch[0]) + importMatch[0].length;
    return content.slice(0, idx) + importLine + content.slice(idx);
  }
  return importLine + content;
}

let changedFiles = 0;
for (const file of walk(srcDir)) {
  const rel = path.relative(root, file).replace(/\\/g, '/');
  if (skipFiles.has(rel)) continue;
  if (rel.includes('styles/')) continue;

  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  for (const [from, to] of replacements) {
    if (content.includes(from)) {
      content = content.split(from).join(to);
      changed = true;
    }
  }

  if (changed) {
    content = ensureThemeImports(content, file);
    fs.writeFileSync(file, content);
    changedFiles += 1;
  }
}

console.log(`Updated ${changedFiles} files.`);
