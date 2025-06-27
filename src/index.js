import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './APP.jsx'; // Changed to match the file name

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);