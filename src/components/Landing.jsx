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

      {/* Unified Citizen Portal Card */}
      <div className="w-full max-w-xl px-4 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-600">
        <div className="relative professional-surface p-8 md:p-12 border-white/10 rounded-[2.5rem] flex flex-col items-center group overflow-hidden">
          {/* Decorative background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full -z-10 group-hover:bg-blue-500/20 transition-all duration-1000"></div>
          
          <div className="w-20 h-20 rounded-2xl bg-blue-500/5 border border-white/5 flex items-center justify-center mb-8 text-blue-500 group-hover:scale-110 group-hover:bg-blue-500/10 transition-all duration-700 shadow-xl">
            <FileText className="w-10 h-10" />
          </div>
          
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">Citizen Portal</h2>
          <p className="text-sm md:text-base text-blue-100/40 mb-12 leading-relaxed max-w-sm">
            Report infrastructure issues, track your existing complaints, or get instant answers from our AI Assistant.
          </p>
          
          {/* Primary Action */}
          <Link 
            to="/report" 
            className="w-full glass glass-btn glass-btn--primary py-6 px-10 flex items-center justify-center gap-4 mb-6 rounded-2xl shadow-[0_10px_40px_rgba(59,130,246,0.2)] hover:shadow-[0_15px_50px_rgba(59,130,246,0.3)] transition-all active:scale-[0.98]"
          >
            <span className="text-[14px] font-black uppercase tracking-[0.2em] ml-2">FILE A REPORT</span>
            <ArrowRight className="w-6 h-6" />
          </Link>
          
          {/* Secondary Actions */}
          <div className="grid grid-cols-2 gap-4 w-full">
            <Link 
              to="/track" 
              className="glass glass-btn glass-btn--ghost py-5 flex items-center justify-center gap-3 rounded-2xl border-white/5 hover:border-blue-400/30 hover:bg-white/5 transition-all group/btn"
            >
              <Search className="w-5 h-5 text-blue-400 group-hover/btn:scale-110 transition-transform" />
              <span className="text-[11px] font-black uppercase tracking-widest text-white/80">TRACK</span>
            </Link>
            <Link 
              to="/ai-bot" 
              className="glass glass-btn glass-btn--ghost py-5 flex items-center justify-center gap-3 rounded-2xl border-white/5 hover:border-blue-500/30 hover:bg-white/5 transition-all group/btn"
            >
              <Bot className="w-5 h-5 text-blue-500 group-hover/btn:scale-110 transition-transform" />
              <span className="text-[11px] font-black uppercase tracking-widest text-white/80">AI ANSWER</span>
            </Link>
          </div>
        </div>

        {/* Subtle Staff Link */}
        <div className="mt-12 opacity-40 hover:opacity-100 transition-opacity">
          <Link to="/dashboard" className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-200/50 hover:text-blue-400 flex items-center justify-center gap-3">
            <LayoutDashboard className="w-4 h-4" /> STAFF CONSOLE
          </Link>
        </div>
      </div>
    </div>
  );
}
