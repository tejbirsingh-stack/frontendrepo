import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  IconButton,
  Popover,
  TextField,
  Typography,
} from '@mui/material';
import { AddOutlined as AddOutlinedIcon } from '@mui/icons-material';
import { cv } from '../../theme/cssVars';
import { useDashboard } from '../../context/DashboardContext';
import type { TagScope } from '../../types/managedTag';
import { getManagedTagOptionSx } from '../../utils/managedTagStyles';
import { getTagScopeColor } from '../../utils/tagScopeColorsStorage';
import { normalizeTagName } from '../../utils/tagRegistryStorage';

interface TagTypeaheadInputProps {
  workspaceId: string;
  appliedTags: string[];
  onAddTag: (tagName: string) => void;
}

const tagScopeLabels: Record<TagScope, string> = {
  company: 'Company',
  project: 'Project',
  personal: 'Personal',
};

const tagScopeOrder: TagScope[] = ['company', 'project', 'personal'];

export default function TagTypeaheadInput({
  workspaceId,
  appliedTags,
  onAddTag,
}: TagTypeaheadInputProps) {
  const { getAssignableTags, tagScopeColors } = useDashboard();
  const anchorRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const assignableTags = useMemo(
    () => getAssignableTags(workspaceId),
    [getAssignableTags, workspaceId],
  );

  const suggestions = useMemo(() => {
    const query = value.trim().toLowerCase();
    if (!query) return [];

    return assignableTags.filter(
      (tag) => tag.name.includes(query) && !appliedTags.includes(tag.name),
    );
  }, [appliedTags, assignableTags, value]);

  const suggestionsByScope = useMemo(
    () => ({
      company: suggestions.filter((tag) => tag.scope === 'company'),
      project: suggestions.filter((tag) => tag.scope === 'project'),
      personal: suggestions.filter((tag) => tag.scope === 'personal'),
    }),
    [suggestions],
  );

  const flatSuggestions = useMemo(
    () => tagScopeOrder.flatMap((scope) => suggestionsByScope[scope]),
    [suggestionsByScope],
  );

  const suggestionIndexById = useMemo(() => {
    const indexById = new Map<string, number>();
    flatSuggestions.forEach((tag, index) => {
      indexById.set(tag.id, index);
    });
    return indexById;
  }, [flatSuggestions]);

  useEffect(() => {
    setActiveIndex(0);
  }, [value, flatSuggestions.length]);

  const showMenu = open && value.trim().length > 0;

  const clearInput = () => {
    setValue('');
    setOpen(false);
  };

  const commitTagName = (tagName: string) => {
    const normalized = normalizeTagName(tagName);
    if (!normalized || appliedTags.includes(normalized)) {
      clearInput();
      return;
    }

    onAddTag(normalized);
    clearInput();
  };

  const handleCommit = (event?: React.SyntheticEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    const trimmed = value.trim();
    if (!trimmed) return;

    if (flatSuggestions.length > 0 && activeIndex < flatSuggestions.length) {
      const selected = flatSuggestions[activeIndex];
      if (selected?.name) {
        commitTagName(selected.name);
        return;
      }
    }

    commitTagName(trimmed);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown' && flatSuggestions.length > 0) {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % flatSuggestions.length);
      return;
    }

    if (event.key === 'ArrowUp' && flatSuggestions.length > 0) {
      event.preventDefault();
      setActiveIndex((current) => (current - 1 + flatSuggestions.length) % flatSuggestions.length);
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      handleCommit(event);
    }
  };

  return (
    <>
      <Box ref={anchorRef} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <TextField
          size="small"
          fullWidth
          placeholder="Add a tag"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 150);
          }}
          onKeyDown={handleKeyDown}
          aria-label="Add tag"
          aria-expanded={showMenu}
          aria-haspopup="listbox"
          aria-controls={showMenu ? 'tag-typeahead-listbox' : undefined}
          aria-autocomplete="list"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '10px',
              fontSize: '0.875rem',
              backgroundColor: cv.surface,
              color: cv.textPrimary,
              '& fieldset': { borderColor: cv.border },
              '&:hover fieldset': { borderColor: cv.annotationGuide },
              '&.Mui-focused fieldset': { borderColor: cv.purpleFocusBorder },
            },
            '& .MuiInputBase-input::placeholder': {
              color: cv.textMuted,
              opacity: 1,
            },
          }}
        />
        <IconButton
          type="button"
          aria-label="Add tag"
          onMouseDown={(event) => event.preventDefault()}
          onClick={handleCommit}
          disabled={!value.trim()}
          sx={{
            width: 36,
            height: 36,
            flexShrink: 0,
            color: cv.textSecondary,
            border: '1px solid var(--noah-border)',
            '&:hover': {
              backgroundColor: cv.surfaceHover,
              color: cv.textPrimary,
            },
            '&.Mui-disabled': {
              color: cv.textMuted,
              borderColor: cv.border,
            },
          }}
        >
          <AddOutlinedIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      <Popover
        open={showMenu}
        anchorEl={anchorRef.current}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        disableAutoFocus
        disableEnforceFocus
        disableRestoreFocus
        slotProps={{
          paper: {
            sx: {
              mt: 0.5,
              width: anchorRef.current?.offsetWidth ?? 280,
              borderRadius: '12px',
              border: '1px solid var(--noah-border)',
              backgroundColor: cv.elevatedSurface,
              boxShadow: cv.dropdownShadow,
              overflow: 'hidden',
            },
          },
        }}
      >
        <Box
          id="tag-typeahead-listbox"
          role="listbox"
          aria-label="Tag suggestions"
          sx={{ maxHeight: 240, overflowY: 'auto', p: 1 }}
        >
          {flatSuggestions.length === 0 ? (
            <Box sx={{ px: 0.75, py: 0.5 }}>
              <Typography sx={{ fontSize: '0.8125rem', color: cv.textSecondary }}>
                Press Enter to add{' '}
                <Box component="span" sx={{ fontWeight: 600, color: cv.textPrimary }}>
                  {normalizeTagName(value) || value.trim()}
                </Box>{' '}
                as a personal tag.
              </Typography>
            </Box>
          ) : (
            tagScopeOrder.map((scope) => {
              const scopeTags = suggestionsByScope[scope];
              if (scopeTags.length === 0) return null;

              return (
                <Box key={scope} sx={{ mb: 1, '&:last-of-type': { mb: 0 } }}>
                  <Typography
                    sx={{
                      mb: 0.5,
                      px: 0.75,
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      color: cv.textMuted,
                    }}
                  >
                    {tagScopeLabels[scope]}
                  </Typography>
                  {scopeTags.map((tag) => {
                    const highlighted = suggestionIndexById.get(tag.id) === activeIndex;
                    const scopeColor = getTagScopeColor(tag.scope, tagScopeColors);

                    return (
                      <Box
                        key={tag.id}
                        role="option"
                        aria-selected={highlighted}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => commitTagName(tag.name)}
                        sx={getManagedTagOptionSx(tag, tagScopeColors, highlighted)}
                      >
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: scopeColor,
                            flexShrink: 0,
                          }}
                        />
                        <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: scopeColor }}>
                          {tag.name}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              );
            })
          )}
        </Box>
      </Popover>
    </>
  );
}
