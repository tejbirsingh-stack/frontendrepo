import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from '@mui/material';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import SubtitlesOutlinedIcon from '@mui/icons-material/SubtitlesOutlined';
import SummarizeOutlinedIcon from '@mui/icons-material/SummarizeOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import FilterListOutlinedIcon from '@mui/icons-material/FilterListOutlined';
import type { SvgIconComponent } from '@mui/icons-material';
import { cv } from '../../theme/cssVars';

interface AiFeaturesTutorialDialogProps {
  open: boolean;
  onClose: () => void;
}

const dialogPaperSx = {
  borderRadius: '20px',
  border: '1px solid var(--noah-border)',
  background: 'var(--noah-dialog-surface)',
  backdropFilter: 'blur(40px) saturate(180%)',
  boxShadow: cv.dialogShadow,
  maxWidth: 560,
};

type TutorialStep = {
  icon: SvgIconComponent;
  title: string;
  body: string;
};

const HOW_TO_STEPS: TutorialStep[] = [
  {
    icon: CloudUploadOutlinedIcon,
    title: 'Analyze on upload',
    body: 'When you upload media, open the AI analysis section and choose which features to run. Analysis starts after the upload finishes.',
  },
  {
    icon: AutoAwesomeOutlinedIcon,
    title: 'Open AI insights in the player',
    body: 'Open any video or audio file, then select AI insights in the side rail. Run analysis or add features you skipped earlier.',
  },
  {
    icon: SearchOutlinedIcon,
    title: 'Search with natural language',
    body: 'Use the search bar in the header to find media by meaning — for example, “budget discussion” — not only by file name.',
  },
  {
    icon: FilterListOutlinedIcon,
    title: 'Filter by AI tags',
    body: 'In the library filters, use AI-generated tags to narrow results to topics detected in your media.',
  },
];

type FeatureCard = {
  icon: SvgIconComponent;
  title: string;
  body: string;
};

const FEATURE_CARDS: FeatureCard[] = [
  {
    icon: SubtitlesOutlinedIcon,
    title: 'Transcript',
    body: 'Timed captions you can click to seek in the player.',
  },
  {
    icon: SummarizeOutlinedIcon,
    title: 'Summary & tags',
    body: 'A short overview plus topic tags for quick scanning.',
  },
  {
    icon: SearchOutlinedIcon,
    title: 'Semantic search',
    body: 'Indexes content so natural-language search can find it.',
  },
  {
    icon: GroupsOutlinedIcon,
    title: 'People & scenes',
    body: 'Detects people and scenes with timestamps (video only).',
  },
];

function StepRow({ step, index }: Readonly<{ step: TutorialStep; index: number }>) {
  const Icon = step.icon;
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1.5,
        alignItems: 'flex-start',
      }}
    >
      <Box
        sx={{
          flexShrink: 0,
          width: 40,
          height: 40,
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: cv.purpleSelectionSoft,
          color: cv.brandPurple,
          position: 'relative',
        }}
        aria-hidden="true"
      >
        <Icon sx={{ fontSize: 20 }} />
        <Box
          component="span"
          sx={{
            position: 'absolute',
            top: -4,
            right: -4,
            width: 18,
            height: 18,
            borderRadius: '50%',
            backgroundColor: cv.brandBlue,
            color: cv.textOnCta,
            fontSize: '0.625rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
          }}
        >
          {index + 1}
        </Box>
      </Box>
      <Box sx={{ minWidth: 0, pt: 0.25 }}>
        <Typography
          sx={{
            fontSize: '0.9375rem',
            fontWeight: 600,
            color: cv.textPrimary,
            mb: 0.25,
          }}
        >
          {step.title}
        </Typography>
        <Typography
          sx={{
            fontSize: '0.8125rem',
            lineHeight: 1.5,
            color: cv.textSecondary,
          }}
        >
          {step.body}
        </Typography>
      </Box>
    </Box>
  );
}

function FeatureCardItem({ card }: Readonly<{ card: FeatureCard }>) {
  const Icon = card.icon;
  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: '14px',
        border: `1px solid ${cv.border}`,
        backgroundColor: cv.surfaceMuted,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.75,
        minHeight: '100%',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
        }}
      >
        <Icon sx={{ fontSize: 18, color: cv.brandPurple }} aria-hidden="true" />
        <Typography
          sx={{
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: cv.textPrimary,
          }}
        >
          {card.title}
        </Typography>
      </Box>
      <Typography
        sx={{
          fontSize: '0.75rem',
          lineHeight: 1.45,
          color: cv.textSecondary,
        }}
      >
        {card.body}
      </Typography>
    </Box>
  );
}

export default function AiFeaturesTutorialDialog({
  open,
  onClose,
}: Readonly<AiFeaturesTutorialDialogProps>) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      aria-labelledby="ai-features-tutorial-title"
      aria-describedby="ai-features-tutorial-desc"
      slotProps={{
        paper: { sx: dialogPaperSx },
        backdrop: {
          sx: { backgroundColor: cv.backdropScrim, backdropFilter: 'blur(4px)' },
        },
      }}
    >
      <DialogTitle
        id="ai-features-tutorial-title"
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
          <AutoAwesomeOutlinedIcon
            sx={{ fontSize: 22, color: cv.brandPurple, flexShrink: 0 }}
            aria-hidden="true"
          />
          <Typography component="span" sx={{ fontWeight: 600, fontSize: '1.125rem' }}>
            How to use AI features
          </Typography>
        </Box>
        <IconButton
          type="button"
          aria-label="Close"
          onClick={onClose}
          sx={{
            color: cv.textSecondary,
            '&:hover': { color: cv.textPrimary, backgroundColor: cv.surfaceHover },
          }}
        >
          <CloseOutlinedIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: '8px !important', maxHeight: 'min(70vh, 640px)' }}>
        <Typography
          id="ai-features-tutorial-desc"
          sx={{
            mb: 2.5,
            fontSize: '0.875rem',
            lineHeight: 1.5,
            color: cv.textSecondary,
          }}
        >
          Noah can transcribe, summarize, tag, and search your media. Follow these steps to
          get the most from AI insights.
        </Typography>

        <Typography
          component="h3"
          sx={{
            mb: 1.5,
            fontSize: '0.75rem',
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: cv.textMuted,
          }}
        >
          Getting started
        </Typography>

        <Box
          component="ol"
          sx={{
            m: 0,
            p: 0,
            listStyle: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            mb: 3,
          }}
        >
          {HOW_TO_STEPS.map((step, index) => (
            <Box component="li" key={step.title}>
              <StepRow step={step} index={index} />
            </Box>
          ))}
        </Box>

        <Typography
          component="h3"
          sx={{
            mb: 1.5,
            fontSize: '0.75rem',
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: cv.textMuted,
          }}
        >
          Available features
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 1.25,
          }}
        >
          {FEATURE_CARDS.map((card) => (
            <FeatureCardItem key={card.title} card={card} />
          ))}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
        <Button
          type="button"
          onClick={onClose}
          variant="contained"
          sx={{
            borderRadius: '10px',
            px: 2.5,
            backgroundColor: cv.brandBlue,
            '&:hover': { backgroundColor: cv.brandBlueDark },
          }}
        >
          Got it
        </Button>
      </DialogActions>
    </Dialog>
  );
}
