import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AdminProvider } from './context/AdminContext';
import App from './App';
import './index.css';

// Automatically capture token passed from Customer Storefront SSO
try {
  const urlParams = new URLSearchParams(window.location.search);
  const tokenFromUrl = urlParams.get('token');
  if (tokenFromUrl) {
    localStorage.setItem('rs_admin_token', tokenFromUrl);
    if (!localStorage.getItem('rs_admin_user')) {
      localStorage.setItem('rs_admin_user', JSON.stringify({
        name: 'RS Gifts',
        email: 'admin@rsgifts.com',
        role: 'admin'
      }));
    }
    const cleanUrl = window.location.pathname + window.location.hash;
    window.history.replaceState({}, document.title, cleanUrl);
  }
} catch (e) {
  console.warn('Could not parse URL token:', e);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AdminProvider>
        <App />
      </AdminProvider>
    </BrowserRouter>
  </React.StrictMode>
);
