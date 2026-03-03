/**
 * @file main.tsx
 * @description Application entry point for the SimCerner EMR.
 *
 * Mounts the React root, wraps the App in StrictMode and BrowserRouter,
 * and imports global + theme stylesheets.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/global.css';
import './styles/cerner-theme.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
