import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App';
import './index.css';

// Initialize Sentry with all features
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  release: import.meta.env.VITE_APP_VERSION || '2.0.0',
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
    Sentry.browserProfilingIntegration(),
  ],
  // Performance Monitoring
  tracesSampleRate: import.meta.env.MODE === 'production' ? 0.2 : 1.0,
  // Profiling (for finding slow code)
  profilesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
  // Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  // Enable Sentry Logs
  _experiments: {
    enableLogs: true,
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary
      fallback={({ error }: any) => (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
          <div className="bg-zinc-900/60 backdrop-blur-xl rounded-2xl border border-zinc-800 p-8 max-w-lg text-center space-y-4">
            <h1 className="text-xl font-bold text-red-400">Something went wrong</h1>
            <p className="text-zinc-400 text-sm">{error?.message || 'An unknown error occurred'}</p>
            <p className="text-zinc-600 text-xs break-all font-mono">{error?.stack?.substring(0, 300)}</p>
            <button
              onClick={() => { window.location.reload(); }}
              className="px-6 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )}
    >
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);
