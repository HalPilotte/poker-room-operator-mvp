import { z } from 'zod';

// E.164 phone format. Leading + and up to 15 digits.
const E164 = /^\+[1-9]\d{7,14}$/;

export const playerFormSchema = z.object({
  first_name: z.string().trim().min(1, 'First name is required.').max(80, 'Max 80 characters.'),
  last_name: z.string().trim().min(1, 'Last name is required.').max(80, 'Max 80 characters.'),
  alias: z
    .string()
    .max(80, 'Max 80 characters.')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  date_of_birth: z
    .string()
    .min(1, 'Date of birth is required.')
    .refine((v) => !Number.isNaN(new Date(v).getTime()), 'Enter a valid date.'),
  address: z
    .string()
    .max(500, 'Max 500 characters.')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  phone: z
    .string()
    .min(1, 'Phone is required.')
    .regex(E164, 'Use E.164 format, e.g. +14155552671'),
  consent: z.boolean().refine((v) => v === true, { message: 'Consent is required.' }),
  notes: z
    .string()
    .max(1000, 'Limit 1,000 characters.')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  status: z.enum(['Active', 'Suspended', 'Banned'], { required_error: 'Status is required.' }),
});

export type PlayerFormValues = z.infer<typeof playerFormSchema>;

export const defaultPlayerFormValues: PlayerFormValues = {
  first_name: '',
  last_name: '',
  alias: undefined,
  date_of_birth: '',
  address: undefined,
  phone: '',
  consent: false,
  notes: undefined,
  status: 'Active',
};
