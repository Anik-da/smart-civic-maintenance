import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { ComplaintModal } from './ComplaintModal';
import { Card } from './ui/Card';
import { DashboardMap } from './DashboardMap';
import { 
  BarChart3, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Map as MapIcon, 
  Filter, 
  TrendingUp,
  Search
} from 'lucide-react';

export function Dashboard() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, resolved: 0 });

  useEffect(() => {
    const q = query(collection(db, 'complaints'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setComplaints(data);
      
      const newStats = data.reduce((acc, curr) => {
        acc.total++;
        const status = curr.status?.toLowerCase() || 'pending';
        if (status === 'pending') acc.pending++;
        else if (status === 'in progress' || status === 'dispatched') acc.inProgress++;
        else if (status === 'resolved') acc.resolved++;
        return acc;
      }, { total: 0, pending: 0, inProgress: 0, resolved: 0 });
      
      setStats(newStats);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      {/* Executive Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-2 border-b border-white/5">
        <div>
          <span className="hero__kicker">Central Command</span>
          <h1 className="hero__title" style={{ fontSize: '3rem', textAlign: 'left', marginBottom: 0 }}>Dashboard</h1>
          <p className="text-slate-400 text-sm mt-2 max-w-md">Real-time incident oversight and civic maintenance coordination system.</p>
        </div>
        
        <div className="flex gap-3">
          <div className="glass px-6 py-3 rounded-2xl flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-aqua animate-pulse shadow-[0_0_10px_#5ee7df]"></div>
            <span className="text-[10px] font-bold tracking-widest uppercase opacity-60">System Online</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Incidents" value={stats.total} icon={<BarChart3 />} color="aqua" trend="+12%" />
        <StatCard label="Awaiting Audit" value={stats.pending} icon={<Clock />} color="amber" trend="Action Required" />
        <StatCard label="Active Response" value={stats.inProgress} icon={<AlertCircle />} color="violet" trend="In Field" />
        <StatCard label="Resolved" value={stats.resolved} icon={<CheckCircle2 />} color="lime" trend="98% Target" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Live Map View */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center px-2">
            <h3 className="font-display text-xl flex items-center gap-2">
              <MapIcon className="w-5 h-5 text-aqua" /> Geospatial Intelligence
            </h3>
          </div>
          <div className="glass-card p-0 h-[500px] overflow-hidden group">
            <DashboardMap complaints={complaints} />
            <div className="absolute top-4 right-4 z-10">
               <button className="glass p-3 rounded-xl hover:bg-white/10 transition-colors">
                  <Filter className="w-4 h-4" />
               </button>
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <h3 className="font-display text-xl flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-violet" /> Recent Activity
            </h3>
            <button className="text-[10px] font-bold text-aqua tracking-widest uppercase hover:underline">View All</button>
          </div>
          
          <div className="glass-card flex flex-col h-[500px] p-0">
             <div className="p-4 border-b border-white/5 bg-white/5">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
                  <input type="text" placeholder="Search reports..." className="w-full bg-black/20 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-xs outline-none focus:border-aqua/50 transition-colors" />
                </div>
             </div>
             
             <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                {complaints.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-30 italic text-sm">
                    No active reports
                  </div>
                ) : (
                  complaints.map((c) => (
                    <div 
                      key={c.id} 
                      onClick={() => setSelectedComplaint(c)}
                      className="glass p-4 rounded-xl border-white/5 hover:border-white/20 hover:bg-white/5 cursor-pointer transition-all group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`glass-badge glass-badge--${getStatusColor(c.status)}`}>{c.status || 'Pending'}</span>
                        <span className="text-[10px] opacity-30 font-bold">
                          {c.createdAt?.toDate ? new Date(c.createdAt.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now'}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold truncate group-hover:text-aqua transition-colors">{c.category || 'Maintenance Issue'}</h4>
                      <p className="text-xs text-slate-400 line-clamp-1 mt-1">{c.description}</p>
                    </div>
                  ))
                )}
             </div>
          </div>
        </div>
      </div>

      {selectedComplaint && (
        <ComplaintModal 
          complaint={selectedComplaint} 
          onClose={() => setSelectedComplaint(null)} 
        />
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color, trend }) {
  const colorMap = {
    aqua: 'text-aqua bg-aqua/10 border-aqua/20 shadow-[0_0_20px_rgba(94,231,223,0.1)]',
    violet: 'text-violet bg-violet/10 border-violet/20 shadow-[0_0_20px_rgba(180,144,245,0.1)]',
    amber: 'text-amber bg-amber/10 border-amber/20 shadow-[0_0_20px_rgba(255,210,127,0.1)]',
    lime: 'text-lime bg-lime/10 border-lime/20 shadow-[0_0_20px_rgba(168,240,138,0.1)]'
  };

  return (
    <div className={`glass-card p-6 border-l-4 border-l-${color} flex flex-col justify-between hover:scale-[1.02] transition-transform`}>
      <div className="flex justify-between items-start">
        <div className={`p-3 rounded-xl glass ${colorMap[color]}`}>
          {React.cloneElement(icon, { size: 20 })}
        </div>
        <span className="text-[10px] font-black opacity-30 uppercase tracking-widest">{trend}</span>
      </div>
      <div className="mt-6">
        <div className="text-3xl font-black tracking-tight">{value}</div>
        <div className="text-xs font-bold opacity-40 uppercase tracking-widest mt-1">{label}</div>
      </div>
    </div>
  );
}

function getStatusColor(status) {
  const s = status?.toLowerCase();
  if (s === 'resolved') return 'lime';
  if (s === 'in progress' || s === 'dispatched') return 'violet';
  if (s === 'pending') return 'amber';
  return 'aqua';
}
