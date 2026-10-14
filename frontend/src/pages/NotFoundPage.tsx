import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Radar, Home, ArrowLeft, AlertTriangle } from 'lucide-react';

interface NotFoundPageProps {
  message?: string;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({
  message = "The page you're looking for doesn't exist or was moved.",
}) => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">

        {/* Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="p-5 rounded-2xl bg-purple-900/30 border border-purple-700/30">
              <Radar className="w-12 h-12 text-purple-300 opacity-60" />
            </div>
            <div className="absolute -top-1 -right-1 p-1.5 bg-red-900/80 border border-red-700/60 rounded-full">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            </div>
          </div>
        </div>

        {/* Error Code */}
        <div>
          <p className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-purple-300 to-purple-600 select-none mb-2">
            404
          </p>
          <h1 className="text-white text-xl font-semibold mb-2">Page Not Found</h1>
          <p className="text-[#7e7b99] text-sm leading-relaxed">{message}</p>
          {location.pathname !== '/' && (
            <p className="text-[#3b3754] text-xs mt-2 font-mono">
              Tried: {location.pathname}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/sections/new_startups"
            className="flex items-center gap-2 px-5 py-2.5 bg-purple-700 hover:bg-purple-600 text-white text-sm font-semibold rounded-xl transition-colors w-full sm:w-auto justify-center"
          >
            <Home className="w-4 h-4" />
            Go to Dashboard
          </Link>
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#181623] border border-[#29253b] hover:border-[#3b3754] text-[#a19dbf] hover:text-white text-sm font-medium rounded-xl transition-colors w-full sm:w-auto justify-center"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>

        {/* Quick links */}
        <div className="pt-4 border-t border-[#29253b]">
          <p className="text-[#7e7b99] text-xs mb-3">Or jump to a section:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { label: 'New Startups', path: '/sections/new_startups' },
              { label: 'Pain Points', path: '/sections/pain_points' },
              { label: 'Idea Finder', path: '/idea-finder' },
              { label: 'Best Opportunities', path: '/opportunities' },
            ].map(({ label, path }) => (
              <Link
                key={path}
                to={path}
                className="text-[11px] px-3 py-1.5 rounded-full bg-[#181623] border border-[#29253b] text-[#a19dbf] hover:text-white hover:border-[#3b3754] transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
