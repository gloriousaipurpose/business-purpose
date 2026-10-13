import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LiveProgressModal } from './components/LiveProgressModal';
import { SectionPage } from './pages/SectionPage';
import { BestOpportunitiesPage } from './pages/BestOpportunitiesPage';
import { PreviousAnalysesPage } from './pages/PreviousAnalysesPage';
import { ComparePage } from './pages/ComparePage';
import { IdeaFinderPage } from './pages/IdeaFinderPage';
import { RunProvider } from './context/RunContext';

export const App: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <RunProvider>
      <div className="flex h-screen overflow-hidden bg-[#0b0f19] relative">
        <Sidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <Header onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} />
          <main className="flex-1 pb-16">

            <Routes>
              <Route path="/" element={<Navigate to="/sections/new_startups" replace />} />
              <Route path="/sections/:sectionName" element={<SectionPage />} />
              <Route path="/opportunities" element={<BestOpportunitiesPage />} />
              <Route path="/best_opportunities" element={<Navigate to="/opportunities" replace />} />
              <Route path="/runs" element={<PreviousAnalysesPage />} />
              <Route path="/previous_analyses" element={<Navigate to="/runs" replace />} />
              <Route path="/compare" element={<ComparePage />} />
              <Route path="/idea-finder" element={<IdeaFinderPage />} />
              {/* Alias for direct section URLs */}
              <Route path="/new_startups" element={<Navigate to="/sections/new_startups" replace />} />
              <Route path="/booming_products" element={<Navigate to="/sections/booming_products" replace />} />
              <Route path="/pain_points" element={<Navigate to="/sections/pain_points" replace />} />
              <Route path="/ai_opportunities" element={<Navigate to="/sections/ai_opportunities" replace />} />
              <Route path="/emerging_trends" element={<Navigate to="/sections/emerging_trends" replace />} />
              <Route path="/india_gaps" element={<Navigate to="/sections/india_gaps" replace />} />
              <Route path="/deep_research" element={<Navigate to="/sections/deep_research" replace />} />
              <Route path="*" element={<Navigate to="/sections/new_startups" replace />} />
            </Routes>
          </main>
        </div>
        <LiveProgressModal />
      </div>
    </RunProvider>
  );
};

export default App;
