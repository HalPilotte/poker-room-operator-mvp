

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../../lib/api';
import { Box, Checkbox, FormControlLabel, MenuItem, Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import Field from '../../components/forms/Field';
import FormBanner from '../../components/forms/FormBanner';
import SubmitBar from '../../components/forms/SubmitBar';
import ContentHeader from '../../components/layout/ContentHeader';

// --- Validation schema ---
// Name and DOB are required. Phone is optional. Notes and status optional.
const schema = z.object({
  name: z.string().min(1, 'Enter a name.').max(80),
  dob: z.string().min(1, 'Enter a date of birth.'), // ISO date string from input[type=date]
  phone: z.string().min(7, 'Enter at least 7 digits.').max(20).optional().or(z.literal('').transform(() => undefined)),
  consent: z.boolean().optional().default(false),
  notes: z.string().max(1000, 'Limit 1,000 characters.').optional().or(z.literal('').transform(() => undefined)),
  status: z.enum(['active', 'ban', 'hold']).default('active'),
}).refine((v) => {
  // Soft age check: warn under 18, but do not block submit. We implement messaging in UI.
  if (!v.dob) return true;
  const age = Math.floor((Date.now() - new Date(v.dob).getTime()) / (365.25 * 24 * 3600 * 1000));
  return age >= 0; // schema itself does not block <18
}, { message: 'Enter a valid date of birth.' });

type FormValues = z.infer<typeof schema>;

export default function NewPlayerPage({ snackbar }: any) {
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { consent: false, status: 'active' },
    mode: 'onBlur',
  });

  const dob = watch('dob');
  const under18 = useMemo(() => {
    if (!dob) return false;
    const age = Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000));
    return age < 18;
  }, [dob]);

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      // Build payload: omit undefined/empty optional fields. Do NOT send dob yet if backend does not accept it.
      const { name, phone, consent, notes, status } = values;
      const payload: Record<string, any> = { name, consent: !!consent, status };
      if (phone) payload.phone = phone;
      if (notes) payload.notes = notes;

      const created = await api<any>('/players', { method: 'POST', body: JSON.stringify(payload) });
      reset({ consent: false, status: 'active' });
      snackbar?.show?.(`Player created: ${created.name}`, 'success');
    } catch (e: any) {
      setServerError(e?.message ?? 'Request failed');
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <ContentHeader title="New Player" subtitle="Only name and date of birth are required. Phone is optional." />
      {serverError && <FormBanner severity="error">{serverError}</FormBanner>}

      {/* Name */}
      <Field
        label="Name"
        fullWidth
        margin="normal"
        {...register('name')}
        error={!!errors.name}
        helperText={errors.name?.message}
      />

      {/* DOB */}
      <Field
        label="Date of Birth"
        type="date"
        InputLabelProps={{ shrink: true }}
        fullWidth
        margin="normal"
        {...register('dob')}
        error={!!errors.dob}
        helperText={errors.dob?.message || (under18 ? 'Player appears under 18. Verify eligibility.' : ' ')}
      />

      {/* Phone (optional) */}
      <Field
        label="Phone (optional)"
        fullWidth
        margin="normal"
        {...register('phone')}
        error={!!errors.phone}
        helperText={errors.phone?.message || 'Optional'}
      />

      {/* Consent */}
      <FormControlLabel control={<Checkbox {...register('consent')} />} label="Agrees to marketing messages" />

      {/* Notes */}
      <Field
        label="Notes"
        fullWidth
        multiline
        rows={3}
        margin="normal"
        {...register('notes')}
        error={!!errors.notes}
        helperText={errors.notes?.message}
      />

      {/* Status */}
      <Field select label="Status" fullWidth margin="normal" defaultValue="active" {...register('status')}>
        <MenuItem value="active">Active</MenuItem>
        <MenuItem value="hold">Hold</MenuItem>
        <MenuItem value="ban">Ban</MenuItem>
      </Field>

      <SubmitBar loading={isSubmitting} label="Create Player" />
    </Box>
  );
}