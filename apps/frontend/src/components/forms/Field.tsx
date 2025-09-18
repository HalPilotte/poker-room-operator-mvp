

import { TextField, TextFieldProps } from '@mui/material';
import * as React from 'react';

/**
 * MUI TextField wrapper that forwards RHF's ref to the underlying input.
 * This ensures register() actually binds and validation sees field values.
 */
const Field = React.forwardRef<HTMLInputElement, TextFieldProps & { reserveHelperSpace?: boolean }>(
  ({ helperText, reserveHelperSpace = true, ...rest }, ref) => (
    <TextField
      {...rest}
      inputRef={ref}
      helperText={reserveHelperSpace ? helperText || ' ' : helperText}
    />
  )
);
Field.displayName = 'Field';

export default Field;