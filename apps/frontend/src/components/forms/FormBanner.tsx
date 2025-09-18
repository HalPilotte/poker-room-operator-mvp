

import { Alert, AlertProps } from '@mui/material';
import * as React from 'react';

/**
 * Form-level banner for server-side or cross-field errors.
 * Uses ARIA live region so screen readers announce updates.
 */
export function FormBanner({ children, ...rest }: AlertProps) {
  return (
    <Alert role="alert" aria-live="polite" sx={{ mb: 2 }} {...rest}>
      {children}
    </Alert>
  );
}
export default FormBanner;