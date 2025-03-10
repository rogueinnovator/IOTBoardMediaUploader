'use client';

import { useEffect } from 'react';
import ErrorDisplay from '@/components/ErrorDisplay';

export default function Error({ error, reset }) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <ErrorDisplay 
      message="Something went wrong! Please try again."
      retry={reset}
    />
  );
} 