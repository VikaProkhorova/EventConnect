import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import { seedChatStoreOnce } from './app/components/chatStore';
import './styles/index.css';

// Seed sessionStorage (default connections / liked / messages / general chat)
// BEFORE the first React render so every screen — even one entered via deep
// link such as /event/.../participants — reads consistent data on mount.
seedChatStoreOnce();

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element #root not found');

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
