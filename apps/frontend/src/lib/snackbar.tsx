

import * as React from 'react';
import { Snackbar, Alert } from '@mui/material';

/** Simple app-level snackbar helper. */
export function useSnackbar() {
  const [open, setOpen] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [severity, setSeverity] = React.useState<'success'|'error'|'info'|'warning'>('info');

  const show = React.useCallback((msg: string, s: typeof severity = 'info') => {
    setMessage(msg); setSeverity(s); setOpen(true);
  }, []);

  const node = (
    <Snackbar open={open} autoHideDuration={2500} onClose={() => setOpen(false)}>
      <Alert onClose={() => setOpen(false)} severity={severity} sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  );

  return { show, node } as const;
}