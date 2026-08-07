import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import {
  createPlan,
  deletePlan,
  fetchPlans,
  updatePlan,
  type PlatformPlan,
} from '../api/platformApi';
import { PageHeader, Panel } from '../components/PlatformUi';
import { cv } from '../../theme/cssVars';

const emptyForm = {
  id: '',
  name: '',
  description: '',
  monthlyPriceCents: 0,
  yearlyPriceCents: 0,
  maxUsers: 5,
  maxWorkspaces: 3,
  storageQuotaBytes: String(5 * 1024 ** 3),
  featuresText: '',
  ctaLabel: 'Get started',
  isPublic: true,
  isFeatured: false,
  sortOrder: 0,
};

export default function PlatformPlansPage() {
  const [plans, setPlans] = useState<PlatformPlan[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = () =>
    fetchPlans()
      .then((res) => setPlans(res.plans))
      .catch((err: Error) => setError(err.message));

  useEffect(() => {
    void load();
  }, []);

  const save = async () => {
    setError('');
    const body = {
      id: form.id,
      name: form.name,
      description: form.description,
      monthlyPriceCents: Number(form.monthlyPriceCents),
      yearlyPriceCents: Number(form.yearlyPriceCents),
      maxUsers: Number(form.maxUsers),
      maxWorkspaces: Number(form.maxWorkspaces),
      storageQuotaBytes: form.storageQuotaBytes,
      features: form.featuresText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      ctaLabel: form.ctaLabel,
      isPublic: form.isPublic,
      isFeatured: form.isFeatured,
      sortOrder: Number(form.sortOrder),
    };
    try {
      if (editingId) {
        await updatePlan(editingId, body);
      } else {
        await createPlan(body);
      }
      setForm(emptyForm);
      setEditingId(null);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed');
    }
  };

  return (
    <Box>
      <PageHeader title="Plans & packages" subtitle="Sellable catalog for customer onboarding" />
      {error ? <Typography sx={{ color: cv.destructive, mb: 2 }}>{error}</Typography> : null}

      <Panel>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Monthly</TableCell>
              <TableCell>Public</TableCell>
              <TableCell>Featured</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {plans.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell>{plan.id}</TableCell>
                <TableCell>{plan.name}</TableCell>
                <TableCell>${(plan.monthlyPriceCents / 100).toFixed(0)}</TableCell>
                <TableCell>{plan.isPublic ? 'Yes' : 'No'}</TableCell>
                <TableCell>{plan.isFeatured ? 'Yes' : 'No'}</TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    sx={{ textTransform: 'none' }}
                    onClick={() => {
                      setEditingId(plan.id);
                      setForm({
                        id: plan.id,
                        name: plan.name,
                        description: plan.description || '',
                        monthlyPriceCents: plan.monthlyPriceCents,
                        yearlyPriceCents: plan.yearlyPriceCents || plan.annualPriceCents || 0,
                        maxUsers: plan.maxUsers,
                        maxWorkspaces: plan.maxWorkspaces,
                        storageQuotaBytes: plan.storageQuotaBytes,
                        featuresText: (plan.features || []).join('\n'),
                        ctaLabel: plan.ctaLabel || '',
                        isPublic: plan.isPublic,
                        isFeatured: plan.isFeatured,
                        sortOrder: plan.sortOrder,
                      });
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    sx={{ textTransform: 'none' }}
                    onClick={() =>
                      void deletePlan(plan.id)
                        .then(load)
                        .catch((err: Error) => setError(err.message))
                    }
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>

      <Panel>
        <Typography sx={{ fontWeight: 600, mb: 2 }}>
          {editingId ? `Edit ${editingId}` : 'Create plan'}
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.5 }}>
          <TextField
            label="ID / slug"
            size="small"
            value={form.id}
            disabled={Boolean(editingId)}
            onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))}
          />
          <TextField
            label="Name"
            size="small"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <TextField
            label="Monthly cents"
            size="small"
            type="number"
            value={form.monthlyPriceCents}
            onChange={(e) => setForm((f) => ({ ...f, monthlyPriceCents: Number(e.target.value) }))}
          />
          <TextField
            label="Yearly cents"
            size="small"
            type="number"
            value={form.yearlyPriceCents}
            onChange={(e) => setForm((f) => ({ ...f, yearlyPriceCents: Number(e.target.value) }))}
          />
          <TextField
            label="Max users"
            size="small"
            type="number"
            value={form.maxUsers}
            onChange={(e) => setForm((f) => ({ ...f, maxUsers: Number(e.target.value) }))}
          />
          <TextField
            label="Storage bytes"
            size="small"
            value={form.storageQuotaBytes}
            onChange={(e) => setForm((f) => ({ ...f, storageQuotaBytes: e.target.value }))}
          />
          <TextField
            label="Description"
            size="small"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            sx={{ gridColumn: '1 / -1' }}
          />
          <TextField
            label="Features (one per line)"
            size="small"
            multiline
            minRows={4}
            value={form.featuresText}
            onChange={(e) => setForm((f) => ({ ...f, featuresText: e.target.value }))}
            sx={{ gridColumn: '1 / -1' }}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 1.5 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={form.isPublic}
                onChange={(e) => setForm((f) => ({ ...f, isPublic: e.target.checked }))}
              />
            }
            label="Public"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={form.isFeatured}
                onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))}
              />
            }
            label="Featured"
          />
          <Button variant="contained" onClick={() => void save()} sx={{ textTransform: 'none' }}>
            {editingId ? 'Update' : 'Create'}
          </Button>
          {editingId ? (
            <Button
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
              }}
              sx={{ textTransform: 'none' }}
            >
              Cancel
            </Button>
          ) : null}
        </Box>
      </Panel>
    </Box>
  );
}
