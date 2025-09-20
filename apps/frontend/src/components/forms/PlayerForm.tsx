import { useMemo, useState, type InputHTMLAttributes } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Checkbox, FormControlLabel, MenuItem } from '@mui/material';
import Field from './Field';
import FormBanner from './FormBanner';
import SubmitBar from './SubmitBar';
import { defaultPlayerFormValues, playerFormSchema, PlayerFormValues } from './playerFormSchema';

export type PlayerFormProps = {
  initialValues?: Partial<PlayerFormValues>;
  submitLabel?: string;
  onSubmit: (values: PlayerFormValues) => Promise<void> | void;
};

export type { PlayerFormValues } from './playerFormSchema';

const dataTestId = (value: string) => ({ 'data-testid': value } as InputHTMLAttributes<HTMLInputElement>);

export default function PlayerForm({ initialValues, submitLabel = 'Submit', onSubmit }: PlayerFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    reset,
  } = useForm<PlayerFormValues>({
    resolver: zodResolver(playerFormSchema),
    mode: 'onBlur',
    defaultValues: { ...defaultPlayerFormValues, ...initialValues },
  });

  const dob = watch('date_of_birth');
  const under18 = useMemo(() => {
    if (!dob) return false;
    const parsed = new Date(dob);
    if (Number.isNaN(parsed.getTime())) return false;
    const age = Math.floor((Date.now() - parsed.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    return age < 18;
  }, [dob]);

  async function submit(values: PlayerFormValues) {
    try {
      setServerError(null);
      await onSubmit(values);
      reset({ ...defaultPlayerFormValues, ...initialValues });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Request failed';
      setServerError(message);
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit(submit)} noValidate>
      {serverError && (
        <FormBanner severity="error" role="alert" data-testid="server-error">
          {serverError}
        </FormBanner>
      )}

      <Field
        label="First name"
        fullWidth
        margin="normal"
        inputProps={dataTestId('first_name')}
        FormHelperTextProps={{ 'aria-live': 'polite' as any }}
        {...register('first_name')}
        error={!!errors.first_name}
        helperText={errors.first_name?.message}
      />

      <Field
        label="Last name"
        fullWidth
        margin="normal"
        inputProps={dataTestId('last_name')}
        FormHelperTextProps={{ 'aria-live': 'polite' as any }}
        {...register('last_name')}
        error={!!errors.last_name}
        helperText={errors.last_name?.message}
      />

      <Field
        label="Date of birth"
        type="date"
        InputLabelProps={{ shrink: true }}
        fullWidth
        margin="normal"
        inputProps={dataTestId('date_of_birth')}
        FormHelperTextProps={{ 'aria-live': 'polite' as any }}
        {...register('date_of_birth')}
        error={!!errors.date_of_birth}
        helperText={
          errors.date_of_birth?.message ||
          (under18 ? 'Player appears under 18. Verify eligibility.' : ' ')
        }
      />

      <Field
        label="Alias"
        fullWidth
        margin="normal"
        inputProps={dataTestId('alias')}
        FormHelperTextProps={{ 'aria-live': 'polite' as any }}
        {...register('alias')}
        error={!!errors.alias}
        helperText={errors.alias?.message}
      />

      <Field
        label="Phone"
        type="tel"
        fullWidth
        margin="normal"
        placeholder="e.g. +14155552671"
        inputProps={{ ...dataTestId('phone'), inputMode: 'tel', pattern: '^\\+[1-9]\\d{7,14}$' }}
        FormHelperTextProps={{ 'aria-live': 'polite' as any }}
        {...register('phone')}
        error={!!errors.phone}
        helperText={errors.phone?.message}
      />

      <Field
        label="Address"
        fullWidth
        multiline
        rows={3}
        margin="normal"
        inputProps={dataTestId('address')}
        FormHelperTextProps={{ 'aria-live': 'polite' as any }}
        {...register('address')}
        error={!!errors.address}
        helperText={errors.address?.message}
      />

      <FormControlLabel
        control={<Checkbox {...register('consent')} inputProps={dataTestId('consent')} />}
        label="I consent to the processing of my data"
      />
      {errors.consent && (
        <FormBanner severity="warning" role="status" data-testid="consent-error">
          {errors.consent.message}
        </FormBanner>
      )}

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

      <Field select label="Status" fullWidth margin="normal" defaultValue="Active" SelectProps={{ 'data-testid': 'status' } as any} {...register('status')} error={!!errors.status} helperText={errors.status?.message}>
        <MenuItem value="Active">Active</MenuItem>
        <MenuItem value="Suspended">Suspended</MenuItem>
        <MenuItem value="Banned">Banned</MenuItem>
      </Field>

      <SubmitBar loading={isSubmitting} label={submitLabel} />
    </Box>
  );
}
