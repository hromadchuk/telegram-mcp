import { Navigate, Route, Routes } from 'react-router';

import { ConnectPage } from '@/pages/connect/ConnectPage';
import { LandingPage } from '@/pages/landing/LandingPage';

export function App() {
  return (
    <Routes>
      <Route element={<LandingPage />} path="/" />
      <Route element={<ConnectPage />} path="/connect" />
      <Route element={<Navigate replace to="/" />} path="*" />
    </Routes>
  );
}
