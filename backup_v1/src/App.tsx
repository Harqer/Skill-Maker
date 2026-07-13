import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SkillProvider } from './context/SkillContext';
import { RootLayout } from './components/layout/RootLayout';
import { HomePage } from './pages/HomePage';

export default function App() {
  return (
    <SkillProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootLayout />}>
            <Route index element={<HomePage />} />
            {/* Future routes like /evaluations can go here */}
          </Route>
        </Routes>
      </BrowserRouter>
    </SkillProvider>
  );
}
