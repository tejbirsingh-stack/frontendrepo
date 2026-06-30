import type { ReactNode } from 'react';
import BrushOutlinedIcon from '@mui/icons-material/BrushOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import CardMembershipOutlinedIcon from '@mui/icons-material/CardMembershipOutlined';
import KeyboardOutlinedIcon from '@mui/icons-material/KeyboardOutlined';
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined';
import PaymentOutlinedIcon from '@mui/icons-material/PaymentOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import PrivacyTipOutlinedIcon from '@mui/icons-material/PrivacyTipOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined';
import TextFieldsOutlinedIcon from '@mui/icons-material/TextFieldsOutlined';
import WorkOutlineOutlinedIcon from '@mui/icons-material/WorkOutlineOutlined';
import WorkspacesOutlinedIcon from '@mui/icons-material/WorkspacesOutlined';

const SETTINGS_NAV_ICONS: Record<string, ReactNode> = {
  personal: <PersonOutlinedIcon />,
  privacy: <PrivacyTipOutlinedIcon />,
  company: <BusinessOutlinedIcon />,
  usage: <StorageOutlinedIcon />,
  plan: <CardMembershipOutlinedIcon />,
  billing: <PaymentOutlinedIcon />,
  branding: <BrushOutlinedIcon />,
  user: <PeopleOutlinedIcon />,
  projects: <WorkOutlineOutlinedIcon />,
  workspaces: <WorkspacesOutlinedIcon />,
  fields: <TextFieldsOutlinedIcon />,
  security: <SecurityOutlinedIcon />,
  'keyboard-shortcuts': <KeyboardOutlinedIcon />,
  details: <ReceiptLongOutlinedIcon />,
  settings: <ShareOutlinedIcon />,
};

export function getSettingsNavIcon(itemId: string): ReactNode {
  return SETTINGS_NAV_ICONS[itemId] ?? <LinkOutlinedIcon />;
}
