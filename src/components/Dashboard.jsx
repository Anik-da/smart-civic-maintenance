import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
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
  Search,
  PlusCircle
} from 'lucide-react';

// Demo data for when Firebase is unavailable
const DEMO_COMPLAINTS = [
  {
    id: 'demo-1',
    category: 'Road Damage',
    description: 'Large pothole on MG Road near Central Mall causing traffic hazard. Multiple vehicles damaged.',
    status: 'In Progress',
    priority: 'High',
    location: { lat: 12.9716, lng: 77.5946 },
    createdAt: { toDate: () => new Date(Date.now() - 3600000) }
  },
  {
    id: 'demo-2',
    category: 'Streetlight',
    description: 'Three consecutive streetlights non-functional on 5th Cross Road. Area completely dark after 7pm.',
    status: 'Pending',
    priority: 'Medium',
    location: { lat: 12.9756, lng: 77.5906 },
    createdAt: { toDate: () => new Date(Date.now() - 7200000) }
  },
  {
    id: 'demo-3',
    category: 'Garbage',
    description: 'Overflowing garbage bins at Jayanagar 4th Block junction. Waste spilling onto pedestrian walkway.',
    status: 'Dispatched',
    priority: 'Medium',
    location: { lat: 12.9256, lng: 77.5836 },
    createdAt: { toDate: () => new Date(Date.now() - 14400000) }
  },
  {
    id: 'demo-4',
    category: 'Water Leak',
    description: 'Major water pipe burst on 11th Main Road. Water flooding the street and adjacent properties.',
    status: 'Resolved',
    priority: 'High',
    location: { lat: 12.9346, lng: 77.6106 },
    createdAt: { toDate: () => new Date(Date.now() - 86400000) }
  },
  {
    id: 'demo-5',
    category: 'Drainage',
    description: 'Storm drain blocked with debris near Lalbagh Gate. Water pooling during rains causing flooding.',
    status: 'Pending',
    priority: 'Low',
    location: { lat: 12.9507, lng: 77.5848 },
    createdAt: { toDate: () => new Date(Date.now() - 43200000) }
  },
  {
    id: 'demo-6',
    category: 'Road Damage',
    description: 'Speed breaker damaged and sharp edges exposed on Hosur Road service lane. Dangerous for two-wheelers.',
    status: 'Pending',
    priority: 'High',
    location: { lat: 12.9167, lng: 77.6101 },
    createdAt: { toDate: () => new Date(Date.now() - 28800000) }
  }
];

export function Dashboard() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, resolved: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [usingDemo, setUsingDemo] = useState(false);

  const calculateStats = (data) => {
    return data.reduce((acc, curr) => {
      acc.total++;
      const status = curr.status?.toLowerCase() || 'pending';
      if (status === 'pending') acc.pending++;
      else if (status === 'in progress' || status === 'dispatched') acc.inProgress++;
      else if (status === 'resolved') acc.resolved++;
      return acc;
    }, { total: 0, pending: 0, inProgress: 0, resolved: 0 });
  };

  useEffect(() => {
    let unsubscribe;
    try {
      const q = query(collection(db, 'complaints'), orderBy('createdAt', 'desc'));
      unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (data.length > 0) {
          setComplaints(data);
          setStats(calculateStats(data));
        } else {
          // No data in Firebase, use demo data
          setComplaints(DEMO_COMPLAINTS);
          setStats(calculateStats(DEMO_COMPLAINTS));
          setUsingDemo(true);
        }
        setLoading(false);
      }, (error) => {
        console.warn('Firestore connection failed, using demo data:', error.message);
        setComplaints(DEMO_COMPLAINTS);
        setStats(calculateStats(DEMO_COMPLAINTS));
        setUsingDemo(true);
        setLoading(false);
      });
    } catch (err) {
      console.warn('Firebase init failed, using demo data:', err);
      setComplaints(DEMO_COMPLAINTS);
      setStats(calculateStats(DEMO_COMPLAINTS));
      setUsingDemo(true);
      setLoading(false);
    }

    return () => { if (unsubscribe) unsubscribe(); };
  }, []);

  const filteredComplaints = complaints.filter(c => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (c.category?.toLowerCase().includes(term) || c.description?.toLowerCase().includes(term) || c.status?.toLowerCase().includes(term));
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-aqua/30 border-t-aqua rounded-full animate-spin mx-auto"></div>
          <p className="text-sm opacity-50 font-bold tracking-widest uppercase">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      {/* Executive Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-2 border-b border-white/5">
        <div>
          <span className="hero__kicker">Central Command</span>
          <h1 className="hero__title" style={{ fontSize: '3rem', textAlign: 'left', marginBottom: 0 }}>Dashboard</h1>
          <p className="text-slate-400 text-sm mt-2 max-w-md">Real-time incident oversight and civic maintenance coordination.</p>
        </div>
        
        <div className="flex gap-3 items-center">
          {usingDemo && (
            <span className="glass-badge glass-badge--amber text-[9px]">Demo Data</span>
          )}
          <div className="glass px-6 py-3 rounded-2xl flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-aqua animate-pulse shadow-[0_0_10px_#5ee7df]"></div>
            <span className="text-[10px] font-bold tracking-widest uppercase opacity-60">System Online</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard label="Total Reports" value={stats.total} icon={<BarChart3 />} color="aqua" trend="+12%" />
        <StatCard label="Pending Review" value={stats.pending} icon={<Clock />} color="amber" trend="Needs Action" />
        <StatCard label="In Progress" value={stats.inProgress} icon={<AlertCircle />} color="violet" trend="Active" />
        <StatCard label="Resolved" value={stats.resolved} icon={<CheckCircle2 />} color="lime" trend="Completed" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Live Map View */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center px-2">
            <h3 className="font-display text-xl flex items-center gap-2">
              <MapIcon className="w-5 h-5 text-aqua" /> Live Map View
            </h3>
          </div>
          <div className="glass-card p-0 h-[500px] overflow-hidden relative rounded-2xl">
            <DashboardMap 
              complaints={filteredComplaints} 
              onComplaintClick={(c) => setSelectedComplaint(c)} 
            />
          </div>
        </div>

        {/* Activity Feed */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <h3 className="font-display text-xl flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-violet" /> Recent Reports
            </h3>
            <span className="text-[10px] font-bold text-aqua tracking-widest uppercase">{filteredComplaints.length} items</span>
          </div>
          
          <div className="glass-card flex flex-col h-[500px] p-0 rounded-2xl overflow-hidden">
             <div className="p-4 border-b border-white/5 bg-white/5">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
                  <input 
                    type="text" 
                    placeholder="Search reports..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-black/20 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-xs outline-none focus:border-aqua/50 transition-colors" 
                  />
                </div>
             </div>
             
             <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                {filteredComplaints.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-30 italic text-sm">
                    No reports found
                  </div>
                ) : (
                  filteredComplaints.map((c) => (
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
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1">{c.description}</p>
                      {c.priority && (
                        <span className={`inline-block mt-2 text-[9px] font-black uppercase tracking-wider opacity-60 ${c.priority === 'High' ? 'text-rose' : c.priority === 'Medium' ? 'text-amber' : 'text-aqua'}`}>
                          ● {c.priority} Priority
                        </span>
                      )}
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
    <div className={`glass-card p-5 md:p-6 border-l-4 border-l-${color} flex flex-col justify-between hover:scale-[1.02] transition-transform`}>
      <div className="flex justify-between items-start">
        <div className={`p-3 rounded-xl glass ${colorMap[color]}`}>
          {React.cloneElement(icon, { size: 20 })}
        </div>
        <span className="text-[9px] font-black opacity-30 uppercase tracking-widest">{trend}</span>
      </div>
      <div className="mt-4 md:mt-6">
        <div className="text-2xl md:text-3xl font-black tracking-tight">{value}</div>
        <div className="text-[10px] md:text-xs font-bold opacity-40 uppercase tracking-widest mt-1">{label}</div>
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
