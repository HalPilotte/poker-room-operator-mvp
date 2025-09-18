

import { Box, Button, CircularProgress } from '@mui/material';
import * as React from 'react';

/**
 * Sticky submit bar that anchors the primary action.
 */
export function SubmitBar({ loading, label = 'Submit' }: { loading?: boolean; label?: string }) {
  return (
    <Box sx={{ position: 'sticky', bottom: 0, py: 2, background: 'background.default' }}>
      <Button type="submit" variant="contained" disabled={!!loading}
        endIcon={loading ? <CircularProgress size={18} /> : undefined}>
        {label}
      </Button>
    </Box>
  );
}
export default SubmitBar;