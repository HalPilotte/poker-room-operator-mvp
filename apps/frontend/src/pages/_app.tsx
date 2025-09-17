

import type { AppProps } from 'next/app';
import { CssBaseline, Container } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export default function App({ Component, pageProps }: AppProps) {
  const [qc] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={qc}>
      <CssBaseline />
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Component {...pageProps} />
      </Container>
    </QueryClientProvider>
  );
}