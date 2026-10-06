import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Sparkles,
  TrendingUp,
  Globe,
  AlertCircle,
  Cpu,
  LineChart,
  Search,
  Target,
  Award,
  Clock,
  Radar
} from 'lucide-react';

export const SECTIONS = [
  { id: 'new_startups', label: 'New Startups', icon: Sparkles, path: '/sections/new_startups' },
  { id: 'booming_products', label: 'Booming Products', icon: TrendingUp, path: '/sections/booming_products' },
  { id: 'global_to_india', label: 'Global to India', icon: Globe, path: '/sections/india_gaps' },
  { id: 'pain_points', label: 'Pain Points', icon: AlertCircle, path: '/sections/pain_points' },
  { id: 'ai_opportunities', label: 'AI & Software', icon: Cpu, path: '/sections/ai_opportunities' },
  { id: 'emerging_trends', label: 'Emerging Trends', icon: LineChart, path: '/sections/emerging_trends' },
  { id: 'deep_research', label: 'Deep Research', icon: Search, path: '/sections/deep_research' },
  { id: 'india_gaps', label: 'India Market Gaps', icon: Target, path: '/sections/india_gaps' },
  { id: 'best_opportunities', label: 'Best Opportunities', icon: Award, path: '/opportunities' },
  { id: 'previous_analyses', label: 'Previous Analyses', icon: Clock, path: '/runs' }
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-[#13111e] border-r border-[#29253b] flex flex-col h-screen sticky top-0 z-30 select-none">
      {/* Minimal Brand Header */}
      <div className="p-5 border-b border-[#29253b] flex items-center gap-3">
        <div className="p-2 rounded-lg bg-[#29253b] text-purple-300">
          <Radar className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-semibold text-sm tracking-tight text-white">Business Radar</h1>
          <p className="text-[11px] text-purple-300/70">Intelligence System</p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin">
        <div className="px-3 py-2 text-[10px] font-medium tracking-wider text-[#7e7b99] uppercase">
          Navigation
        </div>
        {SECTIONS.map((sec) => {
          const Icon = sec.icon;
          return (
            <NavLink
              key={sec.id}
              to={sec.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[#29253b] text-white border border-[#3b3754]'
                    : 'text-[#a19dbf] hover:text-white hover:bg-[#191726]'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0 text-purple-300/80" />
              <span className="truncate">{sec.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-[#29253b] bg-[#0f0e17] text-[11px] text-[#7e7b99] flex items-center justify-between">
        <span>Groq Intelligence</span>
        <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
      </div>
    </aside>
  );
};
