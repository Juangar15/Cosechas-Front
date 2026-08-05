import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Toaster } from 'react-hot-toast'

// Interceptar el hash antes de que Supabase lo procese y limpie
if (window.location.hash.includes('type=invite') || window.location.hash.includes('type=recovery')) {
  localStorage.setItem('necesita_password', 'true');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Toaster position="top-right" />
    <App />
  </StrictMode>,
)
