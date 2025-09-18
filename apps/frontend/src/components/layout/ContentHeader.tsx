

import { Box, Typography } from '@mui/material';
import * as React from 'react';

export function ContentHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="h5">{title}</Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary">{subtitle}</Typography>
      )}
    </Box>
  );
}
export default ContentHeader;