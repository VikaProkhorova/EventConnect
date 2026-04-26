import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import { ApiProvider } from './api/provider';
import { createMockClient } from './api/mockClient';
import './styles/index.css';

const client = createMockClient();

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element #root not found');

createRoot(rootEl).render(
  <StrictMode>
    <ApiProvider client={client}>
      <App />
    </ApiProvider>
  </StrictMode>,
);
