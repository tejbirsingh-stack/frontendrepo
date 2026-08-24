import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from '@mui/material';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import { cv } from '../../theme/cssVars';
import AiSummaryBlock from '../media/AiSummaryBlock';

export interface AiSummaryDialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  summary?: string | null;
  tags?: string[];
}

const dialogPaperSx = {
  borderRadius: '20px',
  border: '1px solid var(--noah-border)',
  background: 'var(--noah-dialog-surface)',
  backdropFilter: 'blur(40px) saturate(180%)',
  boxShadow: cv.dialogShadow,
  maxWidth: 520,
};

export default function AiSummaryDialog({
  open,
  onClose,
  title = 'Summary',
  summary,
  tags = [],
}: AiSummaryDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      aria-labelledby="ai-summary-dialog-title"
      slotProps={{
        paper: { sx: dialogPaperSx },
        backdrop: {
          sx: { backgroundColor: cv.backdropScrim, backdropFilter: 'blur(4px)' },
        },
      }}
    >
      <DialogTitle
        id="ai-summary-dialog-title"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          pb: 1,
          fontWeight: 600,
          fontSize: '1.125rem',
          color: cv.textPrimary,
        }}
      >
        <Typography component="span" sx={{ fontWeight: 600, fontSize: '1.125rem' }}>
          {title}
        </Typography>
        <IconButton
          type="button"
          aria-label="Close summary"
          onClick={onClose}
          sx={{ color: cv.textSecondary }}
        >
          <CloseOutlinedIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: '8px !important', pb: 3 }}>
        <AiSummaryBlock summary={summary} tags={tags} />
      </DialogContent>
    </Dialog>
  );
}
