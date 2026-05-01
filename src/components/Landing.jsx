import { Link } from 'react-router-dom';
import { Shield, FileText, LayoutDashboard, ArrowRight, Search, Bot } from 'lucide-react';

export function Landing({ user }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full px-6 text-center py-20 overflow-hidden">
      {/* Central Iconic Shield */}
      <div className="w-24 h-24 md:w-32 md:h-32 professional-surface flex items-center justify-center border-white/10 mb-10 shadow-lg relative group">
        <div className="absolute inset-0 bg-blue-600/5 blur-3xl rounded-full opacity-50 group-hover:opacity-80 transition-opacity duration-1000"></div>
        <Shield className="w-12 h-12 md:w-16 md:h-16 text-blue-500 relative z-10 drop-shadow-sm" />
      </div>
      
      <div className="space-y-4 mb-14 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <span className="text-[11px] md:text-[12px] font-black text-blue-500 uppercase tracking-[0.5em]">Centralized Operations Hub</span>
        <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-[0.9] flex flex-col items-center">
          <span className="text-white">Civic</span>
          <span className="text-blue-500 py-1">Maintenance</span>
        </h1>
      </div>
      
      <p className="text-blue-100/50 max-w-xl mx-auto mb-16 text-base md:text-lg leading-relaxed animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
        The official infrastructure management & emergency response portal for the Smart City Initiative. Secure, efficient, and real-time.
      </p>

      <div className={`grid grid-cols-1 ${user ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-6 w-full max-w-6xl px-4 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-600`}>
        {/* Card 1: Report System */}
        <Link 
          to="/report" 
          className="group relative professional-surface p-8 border-white/5 hover:border-blue-500/30 transition-all duration-500 flex flex-col items-center text-center rounded-[2rem] overflow-hidden"
        >
          <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/[0.03] transition-colors duration-500"></div>
          <div className="w-14 h-14 rounded-2xl bg-blue-500/5 flex items-center justify-center mb-6 text-blue-400 group-hover:scale-110 transition-transform duration-500">
            <FileText className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold text-white mb-3 tracking-tight">Report System</h3>
          <p className="text-xs text-blue-100/40 mb-8 leading-relaxed flex-1">
            Official portal for reporting potholes, leaks, and sanitation issues.
          </p>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 group-hover:gap-4 transition-all">
            FILE REPORT <ArrowRight className="w-4 h-4" />
          </div>
        </Link>

        {/* Card: Track Status (Only if logged in) */}
        {user && (
          <Link 
            to="/track" 
            className="group relative professional-surface p-8 border-white/5 hover:border-blue-400/30 transition-all duration-500 flex flex-col items-center text-center rounded-[2rem] overflow-hidden border-blue-400/10"
          >
            <div className="absolute inset-0 bg-blue-400/0 group-hover:bg-blue-400/[0.03] transition-colors duration-500"></div>
            <div className="w-14 h-14 rounded-2xl bg-blue-400/5 flex items-center justify-center mb-6 text-blue-400 group-hover:scale-110 transition-transform duration-500">
              <Search className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 tracking-tight">Track Status</h3>
            <p className="text-xs text-blue-100/40 mb-8 leading-relaxed flex-1">
              Check the real-time status and progress of your submitted reports.
            </p>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 group-hover:gap-4 transition-all">
              VIEW UPDATES <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        )}

        {/* Card 2: Staff Console / AI Answer (If not logged in) */}
        {!user ? (
          <Link 
            to="/ai-bot" 
            className="group relative professional-surface p-8 border-white/5 hover:border-blue-500/30 transition-all duration-500 flex flex-col items-center text-center rounded-[2rem] overflow-hidden"
          >
            <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/[0.03] transition-colors duration-500"></div>
            <div className="w-14 h-14 rounded-2xl bg-blue-500/5 flex items-center justify-center mb-6 text-blue-400 group-hover:scale-110 transition-transform duration-500">
              <Bot className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 tracking-tight">AI Answer</h3>
            <p className="text-xs text-blue-100/40 mb-8 leading-relaxed flex-1">
              Universal assistant for civic guidance and general city inquiries.
            </p>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 group-hover:gap-4 transition-all">
              START CHAT <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        ) : (
          <Link 
            to="/dashboard" 
            className="group relative professional-surface p-8 border-white/5 hover:border-blue-500/30 transition-all duration-500 flex flex-col items-center text-center rounded-[2rem] overflow-hidden"
          >
            <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/[0.03] transition-colors duration-500"></div>
            <div className="w-14 h-14 rounded-2xl bg-blue-500/5 flex items-center justify-center mb-6 text-blue-400 group-hover:scale-110 transition-transform duration-500">
              <LayoutDashboard className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 tracking-tight">Staff Console</h3>
            <p className="text-xs text-blue-100/40 mb-8 leading-relaxed flex-1">
              Internal management portal for city officials and maintenance crews.
            </p>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 group-hover:gap-4 transition-all">
              SECURE LOGIN <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        )}
      </div>

      {/* Hidden/Subtle footer links */}
      <div className="mt-16 flex gap-10 opacity-30 hover:opacity-100 transition-opacity duration-700">
        <Link to="/track" className="text-[9px] font-black uppercase tracking-[0.4em] text-blue-200/50 hover:text-blue-400 flex items-center gap-2">
          <Search className="w-3 h-3" /> TRACKING
        </Link>
        <Link to="/ai-bot" className="text-[9px] font-black uppercase tracking-[0.4em] text-blue-200/50 hover:text-blue-400 flex items-center gap-2">
          <Bot className="w-3 h-3" /> AI ANSWER
        </Link>
      </div>
    </div>
  );
}
