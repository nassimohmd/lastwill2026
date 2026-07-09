import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { StoreProvider } from './state/store';
import { App } from './ui/App';
import { applyTheme, getInitialTheme } from './ui/theme';
import './styles.css';

// applied before the first render (not in a hook) so there's no flash of
// the wrong theme; CSP forbids an inline blocking <script> in index.html,
// so this module-load-time call is the earliest we can set it
applyTheme(getInitialTheme());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </StrictMode>,
);
