import type { ReactNode } from 'react';
import { Box } from '@mui/material';

const SETTINGS_FORM_MAX_WIDTH = 760;

export function SettingsFormContainer({ children }: { children: ReactNode }) {
  return (
    <Box sx={{ width: '100%', maxWidth: SETTINGS_FORM_MAX_WIDTH }}>{children}</Box>
  );
}

export function SettingsTableContainer({ children }: { children: ReactNode }) {
  return <Box sx={{ width: '100%', minWidth: 0 }}>{children}</Box>;
}
