import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles/index.css';
import { registerSW } from 'virtual:pwa-register';

// Registro automático e seguro do Service Worker para o PWA
if ('serviceWorker' in navigator) {
  registerSW({
    onNeedRefresh() {
      console.log('Nova versão do PWA disponível para atualização.');
    },
    onOfflineReady() {
      console.log('FluencIA pronto para funcionar offline.');
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
