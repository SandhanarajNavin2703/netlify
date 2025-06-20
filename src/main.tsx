import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log('🔥 ENV VARS:', import.meta.env);
console.log('✅ Firebase Key:', import.meta.env.VITE_FIREBASE_API_KEY);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
