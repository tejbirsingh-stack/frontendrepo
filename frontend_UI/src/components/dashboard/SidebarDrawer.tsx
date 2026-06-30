import { Drawer } from '@mui/material';
import { cv } from '../../theme/cssVars';
import Sidebar from './Sidebar';

interface SidebarDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function SidebarDrawer({ open, onClose }: SidebarDrawerProps) {
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
      <Sidebar variant="drawer" onClose={onClose} drawerOpen={open} />
    </Drawer>
  );
}
