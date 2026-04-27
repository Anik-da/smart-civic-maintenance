import { Link } from 'react-router-dom';
import { Shield, FileText, LayoutDashboard, ArrowRight } from 'lucide-react';

export function Landing() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] w-full px-4 text-center">
      <div className="w-20 h-20 glass rounded-[2rem] flex items-center justify-center border-white/10 mb-8 shadow-[0_0_40px_rgba(94,231,223,0.2)]">
        <Shield className="w-10 h-10 text-aqua" />
      </div>
      
      <span className="hero__kicker mb-4 inline-block">Smart City Initiative</span>
      <h1 className="hero__title font-display text-4xl md:text-6xl font-black mb-6 uppercase tracking-tighter">
        Civic <span className="text-transparent bg-clip-text bg-gradient-to-r from-aqua to-violet">Maintenance</span>
      </h1>
      
      <p className="text-slate-400 max-w-lg mx-auto mb-12 text-sm leading-relaxed">
        Welcome to the centralized civic management platform. Please select your portal to continue. 
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
        <Link to="/report" className="group relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-aqua/20 to-transparent rounded-3xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
          <div className="relative glass-card p-8 rounded-3xl border-white/10 hover:border-aqua/30 transition-all duration-300 h-full flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-aqua/10 flex items-center justify-center mb-6 text-aqua">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-xl mb-2">Report Issue</h3>
            <p className="text-xs text-slate-400 mb-6 flex-1">Citizen portal to report infrastructure problems, track complaints, and access emergency SOS services.</p>
            <div className="flex items-center gap-2 text-aqua text-xs font-bold tracking-widest uppercase">
              Enter Portal <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>

        <Link to="/dashboard" className="group relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-violet/20 to-transparent rounded-3xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
          <div className="relative glass-card p-8 rounded-3xl border-white/10 hover:border-violet/30 transition-all duration-300 h-full flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-violet/10 flex items-center justify-center mb-6 text-violet">
              <LayoutDashboard className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-xl mb-2">Staff Dashboard</h3>
            <p className="text-xs text-slate-400 mb-6 flex-1">Authorized personnel portal for managing active incidents, dispatching crews, and viewing analytics.</p>
            <div className="flex items-center gap-2 text-violet text-xs font-bold tracking-widest uppercase">
              Secure Login <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
