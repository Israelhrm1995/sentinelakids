import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import QrScannerPage from './pages/QrScannerPage';
import AlunoInfoPage from './pages/AlunoInfoPage';

const AppRouter: React.FC = () => (
  <BrowserRouter basename={import.meta.env.BASE_URL}>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/scan" element={<QrScannerPage key={window.location.pathname + window.history.state?.remountKey || ''} />} />
      <Route path="/aluno/:id" element={<AlunoInfoPage />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  </BrowserRouter>
);

export default AppRouter;
