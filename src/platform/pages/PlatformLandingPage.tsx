import { useEffect, useState } from 'react';
import { Box, Button, MenuItem, TextField, Typography } from '@mui/material';
import { fetchLanding, updateLanding } from '../api/platformApi';
import { PageHeader, Panel } from '../components/PlatformUi';
import { PlatformPlansCatalogSection } from '../components/PlatformPlansCatalogSection';
import { cv } from '../../theme/cssVars';

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

export default function PlatformLandingPage() {
  const [form, setForm] = useState({
    status: 'draft',
    heroTitle: '',
    heroSubtitle: '',
    ctaLabel: '',
    ctaHref: '',
  });
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchLanding('main')
      .then((res) => {
        const page = res.page;
        setForm({
          status: asString(page.status, 'draft'),
          heroTitle: asString(page.heroTitle || page.heroHeadline),
          heroSubtitle: asString(page.heroSubtitle || page.heroSubheadline),
          ctaLabel: asString(page.ctaLabel || page.heroCtaLabel),
          ctaHref: asString(page.ctaHref || page.heroCtaUrl),
        });
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  const save = async () => {
    setError('');
    setSaved(false);
    try {
      await updateLanding('main', {
        status: form.status,
        heroTitle: form.heroTitle,
        heroSubtitle: form.heroSubtitle,
        ctaLabel: form.ctaLabel,
        ctaHref: form.ctaHref,
      });
      setSaved(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed');
    }
  };

  return (
    <Box>
      <PageHeader title="Landing page" subtitle="Manage public marketing content for NOAH" />
      {error ? <Typography sx={{ color: cv.destructive, mb: 2 }}>{error}</Typography> : null}
      {saved ? (
        <Typography sx={{ color: cv.success, mb: 2, fontSize: '0.875rem' }}>Saved</Typography>
      ) : null}

      <Panel title="Hero content" sx={{ mb: 3 }}>
        <Box sx={{ display: 'grid', gap: 1.5, maxWidth: 720 }}>
          <TextField
            select
            size="small"
            label="Status"
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
          >
            <MenuItem value="draft">Draft</MenuItem>
            <MenuItem value="published">Published</MenuItem>
          </TextField>
          <TextField
            size="small"
            label="Hero title"
            value={form.heroTitle}
            onChange={(e) => setForm((f) => ({ ...f, heroTitle: e.target.value }))}
          />
          <TextField
            size="small"
            label="Hero subtitle"
            multiline
            minRows={2}
            value={form.heroSubtitle}
            onChange={(e) => setForm((f) => ({ ...f, heroSubtitle: e.target.value }))}
          />
          <TextField
            size="small"
            label="CTA label"
            value={form.ctaLabel}
            onChange={(e) => setForm((f) => ({ ...f, ctaLabel: e.target.value }))}
          />
          <TextField
            size="small"
            label="CTA href"
            value={form.ctaHref}
            onChange={(e) => setForm((f) => ({ ...f, ctaHref: e.target.value }))}
          />
          <Button variant="contained" onClick={() => void save()} sx={{ textTransform: 'none', width: 140 }}>
            Save
          </Button>
        </Box>
      </Panel>

      <PlatformPlansCatalogSection />
    </Box>
  );
}
