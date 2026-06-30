import { Drawer } from '@mui/material';
import { cv } from '../../theme/cssVars';
import SettingsSidebar from './SettingsSidebar';

interface SettingsSidebarDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function SettingsSidebarDrawer({ open, onClose }: SettingsSidebarDrawerProps) {
  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: cv.dialogShadow,
          },
        },
        paper: {
          sx: {
            width: '100%',
            maxWidth: '100vw',
            backgroundColor: 'transparent',
            borderRight: 'none',
            boxShadow: 'none',
          },
        },
      }}
    >
      <SettingsSidebar variant="drawer" onClose={onClose} />
    </Drawer>
  );
}
