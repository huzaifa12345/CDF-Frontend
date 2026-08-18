import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, App as AntApp } from 'antd';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { appTheme } from './app/theme';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ConfigProvider theme={appTheme}>
        <AntApp>
          <App />
        </AntApp>
      </ConfigProvider>
    </QueryClientProvider>
  </StrictMode>,
);
