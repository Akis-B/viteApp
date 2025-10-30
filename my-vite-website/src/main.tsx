import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import StopLoss from './pages/StopLoss';
import LearnVolatility from './pages/LearnVolatility';
import LearnStock from './pages/LearnStock';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/StopLoss" element={<StopLoss />} />
        <Route path="/LearnVolatility" element={<LearnVolatility />} />
        <Route path="/LearnStock" element={<LearnStock />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
