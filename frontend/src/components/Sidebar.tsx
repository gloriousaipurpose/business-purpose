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
  Radar,
  X,
  Lightbulb
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
  { id: 'idea_finder', label: 'Idea Finder 💡', icon: Lightbulb, path: '/idea-finder' },
  { id: 'best_opportunities', label: 'Best Opportunities', icon: Award, path: '/opportunities' },
  { id: 'previous_analyses', label: 'Previous Analyses', icon: Clock, path: '/runs' }
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const content = (
    <div className="flex flex-col h-full bg-[#13111e]">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#29253b] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#29253b] text-purple-300">
            <Radar className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-semibold text-sm tracking-tight text-white">Business Radar</h1>
            <p className="text-[11px] text-purple-300/70">Intelligence System</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-[#7e7b99] hover:text-white hover:bg-[#29253b]"
          >
            <X className="w-4 h-4" />
          </button>
        )}
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
              onClick={() => onClose?.()}
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
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden md:flex w-64 border-r border-[#29253b] flex-col h-screen sticky top-0 z-30 select-none shrink-0">
        {content}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />
          {/* Drawer Sheet */}
          <aside className="fixed inset-y-0 left-0 w-72 border-r border-[#29253b] flex flex-col h-full z-50 select-none shadow-2xl animate-in slide-in-from-left duration-200">
            {content}
          </aside>
        </div>
      )}
    </>
  );
};

