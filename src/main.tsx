import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import 'react-loading-skeleton/dist/skeleton.css';
import { AuthProvider } from './auth/AuthContext';
import AppSkeletonTheme from './components/loading/AppSkeletonTheme';
import { ThemePreferenceProvider } from './context/ThemePreferenceContext';
import App from './App';
import './styles/index.scss';

import { PublicClientApplication } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import { msalConfig } from './config/msalConfig';

const msalInstance = new PublicClientApplication(msalConfig);

msalInstance.initialize().then(() => {
  createRoot(document.getElementById('root')!).render(
    <MsalProvider instance={msalInstance}>
      <ThemePreferenceProvider>
        <AppSkeletonTheme>
          <AuthProvider>
            <App />
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 4500,
                style: {
                  background: 'var(--noah-dialog-surface, rgba(22, 25, 38, 0.94))',
                  color: 'var(--noah-text-primary, #f3f4f6)',
                  border: '1px solid var(--noah-border, rgba(255, 255, 255, 0.12))',
                  borderRadius: '14px',
                  backdropFilter: 'blur(20px) saturate(180%)',
                  boxShadow: '0 16px 36px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.08)',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  padding: '12px 16px',
                  maxWidth: '420px',
                  lineHeight: '1.45',
                },
                error: {
                  style: {
                    background: 'linear-gradient(135deg, rgba(38, 20, 28, 0.96) 0%, rgba(26, 18, 24, 0.96) 100%)',
                    color: '#fecdd3',
                    border: '1px solid rgba(244, 63, 94, 0.35)',
                    boxShadow: '0 16px 36px rgba(0, 0, 0, 0.5), 0 0 18px rgba(244, 63, 94, 0.15)',
                  },
                  iconTheme: {
                    primary: '#f43f5e',
                    secondary: '#26141c',
                  },
                },
                success: {
                  style: {
                    background: 'linear-gradient(135deg, rgba(18, 36, 28, 0.96) 0%, rgba(16, 26, 22, 0.96) 100%)',
                    color: '#a7f3d0',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    boxShadow: '0 16px 36px rgba(0, 0, 0, 0.5), 0 0 18px rgba(16, 185, 129, 0.15)',
                  },
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#12241c',
                  },
                },
              }}
            />
          </AuthProvider>
        </AppSkeletonTheme>
      </ThemePreferenceProvider>
    </MsalProvider>
  );
});
