import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { SectionPage } from './pages/SectionPage';
import { BestOpportunitiesPage } from './pages/BestOpportunitiesPage';
import { PreviousAnalysesPage } from './pages/PreviousAnalysesPage';
import { ComparePage } from './pages/ComparePage';

export const App: React.FC = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-[#0b0f19]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header />
        <main className="flex-1 pb-16">
          <Routes>
            <Route path="/" element={<Navigate to="/sections/new_startups" replace />} />
            <Route path="/sections/:sectionName" element={<SectionPage />} />
            <Route path="/opportunities" element={<BestOpportunitiesPage />} />
            <Route path="/runs" element={<PreviousAnalysesPage />} />
            <Route path="/compare" element={<ComparePage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default App;
