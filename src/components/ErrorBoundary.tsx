import React, { ReactNode } from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="p-4 bg-[#ff5c6a]/10 border border-[#ff5c6a]/30 rounded-xl text-[#ff5c6a]">
      <h2 className="font-bold mb-2">Wystąpił błąd renderowania</h2>
      <p className="text-sm font-mono">{error.message}</p>
    </div>
  );
}

export function ErrorBoundary({ children, fallback }: Props) {
  return (
    <ReactErrorBoundary FallbackComponent={fallback ? () => <>{fallback}</> : ErrorFallback}>
      {children}
    </ReactErrorBoundary>
  );
}
