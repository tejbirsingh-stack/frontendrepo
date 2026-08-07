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
            <Toaster position="top-right" />
          </AuthProvider>
        </AppSkeletonTheme>
      </ThemePreferenceProvider>
    </MsalProvider>
  );
});
