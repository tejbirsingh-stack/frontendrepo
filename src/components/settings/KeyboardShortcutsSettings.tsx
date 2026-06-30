import { useCallback, useEffect, useMemo, useState } from 'react';
import { cv } from '../../theme/cssVars';
import {
  Box,
  Button,
  IconButton,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import RestoreOutlinedIcon from '@mui/icons-material/RestoreOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import KeyboardOutlinedIcon from '@mui/icons-material/KeyboardOutlined';
import { SettingsSectionCard } from './SettingsSectionCard';
import { useKeyboardShortcutsCatalog } from '../../hooks/useKeyboardShortcutsCatalog';
import type { KeyboardShortcutEntry } from '../../constants/appKeyboardShortcuts';
import { formatKeyboardEventAsShortcut } from '../../utils/formatKeyboardShortcut';
import { validateShortcutRebind, isShortcutEditable } from '../../utils/keyboardShortcutValidation';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

function ShortcutKeyBadge({
  value,
  highlight = false,
  editable = false,
}: {
  value: string;
  highlight?: boolean;
  editable?: boolean;
}) {
  return (
    <Typography
      component="kbd"
      sx={{
        display: 'inline-block',
        px: editable ? 1.25 : 1,
        py: editable ? 0.65 : 0.5,
        borderRadius: '8px',
        border: `1px ${editable ? 'dashed' : 'solid'} ${
          highlight || editable ? cv.borderFocus : cv.border
        }`,
        backgroundColor: highlight
          ? cv.purpleSelectionBg
          : editable
            ? cv.surfaceMuted
            : cv.surface,
        fontSize: '0.75rem',
        color: highlight || editable ? cv.textPrimary : cv.textSecondary,
        fontFamily: 'inherit',
        whiteSpace: 'nowrap',
        transition: 'border-color 0.15s ease, background-color 0.15s ease',
      }}
    >
      {value}
    </Typography>
  );
}

function groupShortcutsBySection(shortcuts: KeyboardShortcutEntry[]) {
  const sections: { section: string; items: KeyboardShortcutEntry[] }[] = [];
  const sectionIndex = new Map<string, number>();

  shortcuts.forEach((shortcut) => {
    const section = shortcut.section ?? 'Shortcuts';
    const existingIndex = sectionIndex.get(section);
    if (existingIndex == null) {
      sectionIndex.set(section, sections.length);
      sections.push({ section, items: [shortcut] });
      return;
    }
    sections[existingIndex].items.push(shortcut);
  });

  return sections;
}

function ShortcutRow({
  entry,
  defaultEntry,
  isEditing,
  isRecording,
  pendingShortcut,
  onSelect,
  onConfirm,
  onCancelRecording,
  onReset,
  showDivider,
  recordingError,
}: {
  entry: KeyboardShortcutEntry;
  defaultEntry: KeyboardShortcutEntry;
  isEditing: boolean;
  isRecording: boolean;
  pendingShortcut: string | null;
  onSelect: () => void;
  onConfirm: () => void;
  onCancelRecording: () => void;
  onReset: () => void;
  showDivider: boolean;
  recordingError: string | null;
}) {
  const isLocked = !isShortcutEditable(entry.id, entry.shortcut);
  const isCustomized = entry.shortcut !== defaultEntry.shortcut;
  const displayShortcut = isRecording && pendingShortcut ? pendingShortcut : entry.shortcut;
  const isEditableIdle = isEditing && !isRecording && !isLocked;

  return (
    <Box
      role={isEditing ? 'button' : undefined}
      tabIndex={isEditing ? 0 : undefined}
      aria-label={isEditing ? `Change shortcut for ${entry.label}` : undefined}
      onClick={isEditing ? onSelect : undefined}
      onKeyDown={
        isEditing
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onSelect();
              }
            }
          : undefined
      }
      sx={{
        mx: isEditableIdle ? 1.5 : 0,
        mb: isEditableIdle ? 0.75 : 0,
        px: 2,
        py: 1.5,
        display: 'flex',
        alignItems: isRecording ? 'flex-start' : 'center',
        justifyContent: 'space-between',
        gap: 2,
        flexWrap: 'wrap',
        cursor: isEditing ? 'pointer' : 'default',
        outline: 'none',
        borderRadius: isEditableIdle || isRecording ? '12px' : 0,
        border: isEditableIdle
          ? `1px solid ${cv.border}`
          : isRecording
            ? `1px solid ${cv.borderFocus}`
            : '1px solid transparent',
        backgroundColor: isRecording
          ? cv.purpleSurface
          : isEditableIdle
            ? cv.surfaceSubtle
            : 'transparent',
        transition: 'background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
        ...(showDivider && !isEditableIdle
          ? { borderBottom: `1px solid ${cv.dividerSubtle}` }
          : {}),
        ...(isEditableIdle
          ? {
              '&:hover': {
                backgroundColor: cv.purpleSurface,
                borderColor: cv.purpleSelectionStrong,
                boxShadow: cv.purpleFocusRingTight,
                '& .shortcut-edit-hint': { color: cv.brandPurple },
                '& .shortcut-edit-icon': { color: cv.brandPurple },
              },
            }
          : {}),
        '&:focus-visible': isEditing
          ? {
              boxShadow: `0 0 0 2px ${cv.borderFocus}`,
              borderColor: cv.borderFocus,
            }
          : {},
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: '0.9375rem', fontWeight: 500, color: cv.textPrimary }}>
          {entry.label}
        </Typography>
        {entry.description ? (
          <Typography sx={{ mt: 0.35, fontSize: '0.8125rem', color: cv.textSecondary, lineHeight: 1.5 }}>
            {entry.description}
          </Typography>
        ) : null}
        {isRecording ? (
          <>
            <Typography sx={{ mt: 1, fontSize: '0.8125rem', color: cv.brandPurple }}>
              {pendingShortcut
                ? 'Press Enter or Confirm to save this shortcut. Esc to cancel.'
                : 'Press the keys you want to use for this action.'}
            </Typography>
            {recordingError ? (
              <Typography
                role="alert"
                sx={{ mt: 0.75, fontSize: '0.8125rem', color: cv.errorText, lineHeight: 1.5 }}
              >
                {recordingError}
              </Typography>
            ) : null}
          </>
        ) : isLocked && isEditing ? (
          <Typography sx={{ mt: 0.35, fontSize: '0.8125rem', color: cv.textMuted, lineHeight: 1.5 }}>
            System shortcut. This binding cannot be changed.
          </Typography>
        ) : null}
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          flexShrink: 0,
          flexWrap: 'wrap',
          justifyContent: 'flex-end',
        }}
        onClick={isRecording ? (event) => event.stopPropagation() : undefined}
      >
        {isRecording ? (
          <>
            <ShortcutKeyBadge
              value={displayShortcut}
              highlight={Boolean(pendingShortcut)}
            />
            <Button
              size="small"
              variant="contained"
              disabled={!pendingShortcut}
              onClick={onConfirm}
              sx={{
                textTransform: 'none',
                borderRadius: '8px',
                minWidth: 80,
                background: cv.brandGradient,
                boxShadow: 'none',
                '&:hover': { boxShadow: 'none', opacity: 0.92 },
                '&.Mui-disabled': {
                  background: cv.surfaceRaised,
                  color: cv.textMuted,
                },
              }}
            >
              Confirm
            </Button>
            <Button
              size="small"
              onClick={onCancelRecording}
              sx={{ textTransform: 'none', color: cv.textSecondary }}
            >
              Cancel
            </Button>
          </>
        ) : isEditableIdle ? (
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.75,
              px: 1,
              py: 0.5,
              borderRadius: '10px',
              border: `1px dashed ${cv.border}`,
              backgroundColor: cv.surfaceSubtle,
            }}
          >
            <EditOutlinedIcon
              className="shortcut-edit-icon"
              sx={{ fontSize: 16, color: cv.textMuted, transition: 'color 0.15s ease' }}
            />
            <ShortcutKeyBadge value={entry.shortcut} editable />
            <Typography
              className="shortcut-edit-hint"
              sx={{
                fontSize: '0.75rem',
                fontWeight: 500,
                color: cv.textMuted,
                transition: 'color 0.15s ease',
              }}
            >
              Change
            </Typography>
          </Box>
        ) : isEditing && isLocked ? (
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.75,
              px: 1,
              py: 0.5,
              borderRadius: '10px',
              border: `1px solid ${cv.border}`,
              backgroundColor: cv.surfaceSubtle,
              color: cv.textMuted,
            }}
          >
            <LockOutlinedIcon sx={{ fontSize: 16 }} />
            <ShortcutKeyBadge value={entry.shortcut} />
          </Box>
        ) : (
          <ShortcutKeyBadge value={entry.shortcut} />
        )}
        {isEditing && !isRecording && !isLocked && isCustomized ? (
          <IconButton
            size="small"
            aria-label={`Reset ${entry.label}`}
            onClick={(event) => {
              event.stopPropagation();
              onReset();
            }}
            sx={{
              color: cv.textSecondary,
              '&:hover': { color: cv.textPrimary, backgroundColor: cv.surfaceHover },
            }}
          >
            <RestoreOutlinedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        ) : null}
      </Box>
    </Box>
  );
}

export default function KeyboardShortcutsSettings() {
  const {
    catalog,
    defaultCatalog,
    hasOverrides,
    updateShortcut,
    resetShortcut,
    restoreDefaults,
  } = useKeyboardShortcutsCatalog();
  const [activeTab, setActiveTab] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [pendingShortcut, setPendingShortcut] = useState<string | null>(null);
  const [recordingError, setRecordingError] = useState<string | null>(null);

  const defaultById = useMemo(() => {
    const map = new Map<string, KeyboardShortcutEntry>();
    defaultCatalog.forEach((category) => {
      category.shortcuts.forEach((entry) => map.set(entry.id, entry));
    });
    return map;
  }, [defaultCatalog]);

  const activeCategory = catalog[activeTab];

  const clearRecording = useCallback(() => {
    setRecordingId(null);
    setPendingShortcut(null);
    setRecordingError(null);
  }, []);

  const handleConfirm = useCallback(() => {
    if (!recordingId || !pendingShortcut) return;

    const validation = validateShortcutRebind(recordingId, pendingShortcut, catalog);
    if (!validation.valid) {
      setRecordingError(validation.message ?? 'This shortcut cannot be assigned.');
      return;
    }

    updateShortcut(recordingId, { shortcut: pendingShortcut });
    clearRecording();
  }, [recordingId, pendingShortcut, catalog, updateShortcut, clearRecording]);

  const handleSelectShortcut = useCallback((id: string) => {
    if (!isShortcutEditable(id)) return;
    setRecordingId(id);
    setPendingShortcut(null);
    setRecordingError(null);
  }, []);

  useEffect(() => {
    if (!isEditing || !recordingId) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        clearRecording();
        return;
      }

      const isConfirmEnter =
        event.key === 'Enter' &&
        !event.shiftKey &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey;

      if (isConfirmEnter && pendingShortcut) {
        event.preventDefault();
        handleConfirm();
        return;
      }

      const formatted = formatKeyboardEventAsShortcut(event);
      if (!formatted) return;

      event.preventDefault();
      event.stopPropagation();
      setPendingShortcut(formatted);
      setRecordingError(null);
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isEditing, recordingId, pendingShortcut, clearRecording, handleConfirm]);

  const handleDoneEditing = () => {
    clearRecording();
    setIsEditing(false);
  };

  return (
    <SettingsSectionCard
      title="Keyboard Shortcuts"
      description="Full shortcut reference for your team. Admins can customize key bindings shown here."
    >
      <Box
        sx={{
          px: 2,
          pt: 1.5,
          pb: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          flexWrap: 'wrap',
          borderBottom: `1px solid ${cv.dividerSubtle}`,
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, value: number) => {
            clearRecording();
            setActiveTab(value);
          }}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: 40,
            '& .MuiTab-root': {
              minHeight: 40,
              py: 0.5,
              px: 1.5,
              fontSize: '0.875rem',
              fontWeight: 500,
              color: cv.textSecondary,
              textTransform: 'none',
            },
            '& .Mui-selected': {
              color: `${cv.textPrimary} !important`,
            },
            '& .MuiTabs-indicator': {
              background: cv.brandGradient,
              height: 2,
              borderRadius: '2px',
            },
          }}
        >
          {catalog.map((category) => (
            <Tab key={category.id} label={category.label} />
          ))}
        </Tabs>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
          {hasOverrides ? (
            <Button
              size="small"
              variant="text"
              onClick={() => {
                clearRecording();
                restoreDefaults();
              }}
              sx={{ color: cv.textSecondary, textTransform: 'none' }}
            >
              Reset all
            </Button>
          ) : null}
          <Button
            size="small"
            variant={isEditing ? 'contained' : 'outlined'}
            onClick={() => (isEditing ? handleDoneEditing() : setIsEditing(true))}
            sx={{
              textTransform: 'none',
              borderRadius: '8px',
              ...(isEditing
                ? {
                    background: cv.brandGradient,
                    border: 'none',
                    '&:hover': { opacity: 0.92 },
                  }
                : {
                    borderColor: cv.border,
                    color: cv.textPrimary,
                  }),
            }}
          >
            {isEditing ? 'Done editing' : 'Edit shortcuts'}
          </Button>
        </Box>
      </Box>

      {isEditing ? (
        <Box
          sx={{
            mx: 1.5,
            mt: 1.5,
            mb: 0.5,
            px: 1.5,
            py: 1.25,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1.25,
            borderRadius: '12px',
            border: `1px solid ${cv.purpleBorderSoft}`,
            backgroundColor: cv.purpleSurface,
          }}
        >
          <KeyboardOutlinedIcon sx={{ fontSize: 18, color: cv.brandPurple, mt: 0.15 }} />
          <Box>
            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: cv.textPrimary }}>
              Click any shortcut to rebind it
            </Typography>
            <Typography sx={{ mt: 0.35, fontSize: '0.8125rem', color: cv.textSecondary, lineHeight: 1.5 }}>
              Press your new key combination, then confirm with Enter or the Confirm button.
            </Typography>
          </Box>
        </Box>
      ) : null}

      {activeCategory ? (
        <Box sx={{ py: isEditing ? 1 : 0.5 }}>
          {groupShortcutsBySection(activeCategory.shortcuts).map((section) => (
            <Box key={section.section}>
              <Typography
                sx={{
                  px: 2,
                  pt: 1.5,
                  pb: 0.75,
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: cv.textMuted,
                }}
              >
                {section.section}
              </Typography>

              {section.items.map((entry, index) => {
                const defaultEntry = defaultById.get(entry.id) ?? entry;
                const isRecording = recordingId === entry.id;
                return (
                  <ShortcutRow
                    key={entry.id}
                    entry={entry}
                    defaultEntry={defaultEntry}
                    isEditing={isEditing}
                    isRecording={isRecording}
                    pendingShortcut={isRecording ? pendingShortcut : null}
                    onSelect={() => handleSelectShortcut(entry.id)}
                    onConfirm={handleConfirm}
                    onCancelRecording={clearRecording}
                    onReset={() => resetShortcut(entry.id)}
                    showDivider={!isEditing && index < section.items.length - 1}
                    recordingError={isRecording ? recordingError : null}
                  />
                );
              })}
            </Box>
          ))}
        </Box>
      ) : null}
    </SettingsSectionCard>
  );
}
