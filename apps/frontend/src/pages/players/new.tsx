

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../../lib/api';
import { Box, Button, Checkbox, FormControlLabel, MenuItem, TextField, Typography, Alert } from '@mui/material';
import { useState } from 'react';

const schema = z.object({
  name: z.string().min(1).max(80),
  phone: z.string().min(7).max(20),
  consent: z.boolean(),
  notes: z.string().max(1000).optional().or(z.literal('').transform(() => undefined)),
  status: z.enum(['active', 'ban', 'hold']).default('active'),
});

type FormValues = z.infer<typeof schema>;

export default function NewPlayerPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { consent: false, status: 'active' },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      const created = await api<any>('/players', { method: 'POST', body: JSON.stringify(values) });
      reset({ consent: false, status: 'active' });
      alert(`Player created: ${created.name}`);
    } catch (e: any) {
      setServerError(e?.message ?? 'Request failed');
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Typography variant="h5" gutterBottom>New Player</Typography>
      {serverError && <Alert severity="error" sx={{ mb: 2 }}>{serverError}</Alert>}

      <TextField
        label="Name"
        fullWidth
        margin="normal"
        {...register('name')}
        error={!!errors.name}
        helperText={errors.name?.message}
      />

      <TextField
        label="Phone"
        fullWidth
        margin="normal"
        {...register('phone')}
        error={!!errors.phone}
        helperText={errors.phone?.message}
      />

      <FormControlLabel control={<Checkbox {...register('consent')} />} label="Marketing consent" />

      <TextField
        label="Notes"
        fullWidth
        multiline
        rows={3}
        margin="normal"
        {...register('notes')}
        error={!!errors.notes}
        helperText={errors.notes?.message}
      />

      <TextField select label="Status" fullWidth margin="normal" defaultValue="active" {...register('status')}>
        <MenuItem value="active">Active</MenuItem>
        <MenuItem value="hold">Hold</MenuItem>
        <MenuItem value="ban">Ban</MenuItem>
      </TextField>

      <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
        <Button type="submit" variant="contained" disabled={isSubmitting}>Create Player</Button>
      </Box>
    </Box>
  );
}