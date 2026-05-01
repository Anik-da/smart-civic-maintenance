import { Link } from 'react-router-dom';
import { Shield, FileText, LayoutDashboard, ArrowRight, Search } from 'lucide-react';

export function Landing() {
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl px-4 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-600">
        <div className="group relative">
          <div className="relative professional-surface p-10 border-white/10 hover:border-blue-500/30 transition-all duration-500 h-full flex flex-col items-center text-center rounded-2xl">
            <div className="w-16 h-16 rounded-xl bg-blue-500/5 flex items-center justify-center mb-6 text-blue-500 group-hover:scale-105 transition-all duration-500">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-2xl mb-3 text-blue-400">Citizen Portal</h3>
            <p className="text-sm text-blue-200/60 mb-8 flex-1 leading-relaxed">
              Report infrastructure issues, track your existing complaints, or get help from our AI Assistant.
            </p>
            
            <div className="flex flex-col gap-3 w-full max-w-[240px]">
              <Link to="/report" className="glass glass-btn glass-btn--primary py-3 px-6 flex items-center justify-between group/btn">
                <span className="text-[10px] font-black uppercase tracking-widest">File a Report</span>
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </Link>
              
              <div className="grid grid-cols-2 gap-2">
                <Link to="/track" className="glass glass-btn glass-btn--ghost py-2.5 px-4 flex items-center gap-2 group/btn">
                  <Search className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-[9px] font-bold uppercase tracking-widest">Track</span>
                </Link>
                <Link to="/ai-bot" className="glass glass-btn glass-btn--ghost py-2.5 px-4 flex items-center gap-2 group/btn">
                  <Bot className="w-3.5 h-3.5 text-aqua" />
                  <span className="text-[9px] font-bold uppercase tracking-widest">AI Bot</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <Link to="/dashboard" className="group relative">
          <div className="relative professional-surface p-10 border-white/10 hover:border-blue-600/30 transition-all duration-500 h-full flex flex-col items-center text-center rounded-2xl">
            <div className="w-16 h-16 rounded-xl bg-blue-600/5 flex items-center justify-center mb-6 text-blue-600 group-hover:scale-105 transition-all duration-500">
              <LayoutDashboard className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-2xl mb-3 text-blue-400">Staff Console</h3>
            <p className="text-sm text-blue-200/60 mb-8 flex-1 leading-relaxed">Administrative dashboard for crew dispatch and city-wide analytics.</p>
            <div className="flex items-center gap-3 text-blue-600 text-[11px] font-black tracking-[0.2em] uppercase">
              Secure Login <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
