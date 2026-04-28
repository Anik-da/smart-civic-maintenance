import { Link } from 'react-router-dom';
import { Shield, FileText, LayoutDashboard, ArrowRight } from 'lucide-react';

export function Landing() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[90vh] w-full px-6 text-center py-20 overflow-hidden">
      {/* Central Iconic Shield */}
      <div className="w-32 h-32 md:w-40 md:h-40 glass rounded-[3rem] flex items-center justify-center border-white/10 mb-12 shadow-[0_0_60px_rgba(37,99,235,0.4)] animate-float relative group">
        <div className="absolute inset-0 bg-blue-600/30 blur-3xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity duration-1000"></div>
        <Shield className="w-16 h-16 md:w-20 md:h-20 text-blue-400 relative z-10 drop-shadow-[0_0_15px_rgba(96,165,250,0.8)]" />
      </div>
      
      <div className="space-y-6 mb-16 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <span className="text-[12px] md:text-[14px] font-black text-blue-400 uppercase tracking-[0.6em] opacity-100">Centralized Operations Hub</span>
        <h1 className="font-display text-6xl md:text-9xl font-black uppercase tracking-tighter leading-[0.8] flex flex-col items-center">
          <span className="text-white drop-shadow-2xl">Civic</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-blue-400 via-blue-600 to-blue-800 py-2">Maintenance</span>
        </h1>
      </div>
      
      <p className="text-blue-100/60 max-w-2xl mx-auto mb-20 text-base md:text-xl leading-relaxed animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
        The official infrastructure management & emergency response portal for the Smart City Initiative.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full max-w-5xl px-4 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-600">
        <Link to="/report" className="group relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-blue-600 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-20 transition duration-700"></div>
          <div className="relative glass p-10 rounded-[2.5rem] border-white/10 hover:border-blue-400/40 hover:bg-white/[0.07] transition-all duration-500 h-full flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-8 text-blue-400 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(96,165,250,0.3)] transition-all duration-500">
              <FileText className="w-10 h-10" />
            </div>
            <h3 className="font-display font-bold text-3xl mb-4 text-white">Report System</h3>
            <p className="text-sm text-blue-100/40 mb-10 flex-1 leading-relaxed">Citizen access for infrastructure issues, real-time tracking, and emergency SOS services.</p>
            <div className="flex items-center gap-3 text-blue-400 text-[12px] font-black tracking-[0.3em] uppercase">
              Access Portal <ArrowRight className="w-4 h-4 group-hover:translate-x-3 transition-transform" />
            </div>
          </div>
        </Link>

        <Link to="/dashboard" className="group relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-blue-900 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-20 transition duration-700"></div>
          <div className="relative glass p-10 rounded-[2.5rem] border-white/10 hover:border-blue-600/40 hover:bg-white/[0.07] transition-all duration-500 h-full flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-2xl bg-blue-600/10 flex items-center justify-center mb-8 text-blue-500 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(37,99,235,0.3)] transition-all duration-500">
              <LayoutDashboard className="w-10 h-10" />
            </div>
            <h3 className="font-display font-bold text-3xl mb-4 text-white">Staff Console</h3>
            <p className="text-sm text-blue-100/40 mb-10 flex-1 leading-relaxed">Administrative dashboard for incident management, crew dispatch, and city-wide analytics.</p>
            <div className="flex items-center gap-3 text-blue-500 text-[12px] font-black tracking-[0.3em] uppercase">
              Secure Login <ArrowRight className="w-4 h-4 group-hover:translate-x-3 transition-transform" />
            </div>
          </div>
        </Link>
      </div>
    </div>
    </div>
  );
}
