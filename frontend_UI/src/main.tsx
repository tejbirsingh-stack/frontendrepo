import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'react-loading-skeleton/dist/skeleton.css';
import { AuthProvider } from './auth/AuthContext';
import AppSkeletonTheme from './components/loading/AppSkeletonTheme';
import { ThemePreferenceProvider } from './context/ThemePreferenceContext';
import App from './App';
import './styles/index.scss';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemePreferenceProvider>
      <AppSkeletonTheme>
        <AuthProvider>
          <App />
        </AuthProvider>
      </AppSkeletonTheme>
    </ThemePreferenceProvider>
  </StrictMode>,
);
