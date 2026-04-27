import { useState, useEffect, cloneElement } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { ComplaintModal } from './ComplaintModal';
import { DashboardMap } from './DashboardMap';
import { 
  BarChart3, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Map as MapIcon, 
  TrendingUp,
  Search,
  Database
} from 'lucide-react';

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
      const s = curr.status?.toLowerCase() || 'pending';
      if (s === 'pending') acc.pending++;
      else if (s === 'in progress' || s === 'dispatched') acc.inProgress++;
      else if (s === 'resolved') acc.resolved++;
      return acc;
    }, { total: 0, pending: 0, inProgress: 0, resolved: 0 });
  };

  useEffect(() => {
    let unsubscribe;
    let timeoutId;
    let isSubscribed = true;

    const activateFallback = () => {
      if (!isSubscribed) return;
      console.log('Using Dashboard Demo Data Fallback');
      setComplaints(DEMO_COMPLAINTS);
      setStats(calculateStats(DEMO_COMPLAINTS));
      setUsingDemo(true);
      setLoading(false);
    };

    // Set a timeout to fallback if Firestore doesn't respond in 3 seconds
    timeoutId = setTimeout(() => {
      if (loading) {
        activateFallback();
      }
    }, 3000);

    try {
      const q = query(collection(db, 'complaints'), orderBy('createdAt', 'desc'));
      unsubscribe = onSnapshot(q, (snapshot) => {
        if (!isSubscribed) return;
        clearTimeout(timeoutId);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (data.length > 0) {
          setComplaints(data);
          setStats(calculateStats(data));
          setUsingDemo(false);
        } else {
          activateFallback();
        }
        setLoading(false);
      }, (error) => {
        if (!isSubscribed) return;
        console.warn('Firestore Error:', error.message);
        clearTimeout(timeoutId);
        activateFallback();
      });
    } catch (err) {
      console.warn('Sync Firestore Error:', err);
      clearTimeout(timeoutId);
      activateFallback();
    }

    return () => {
      isSubscribed = false;
      if (unsubscribe) unsubscribe();
      clearTimeout(timeoutId);
    };
  }, [loading]);

  const filteredComplaints = (complaints || []).filter(c => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.category?.toLowerCase().includes(term) || 
      c.description?.toLowerCase().includes(term) || 
      c.status?.toLowerCase().includes(term)
    );
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-pulse">
        <div className="w-16 h-16 border-4 border-aqua/20 border-t-aqua rounded-full animate-spin"></div>
        <div className="text-center">
          <p className="text-sm font-black tracking-[0.3em] uppercase opacity-40">Synchronizing Data</p>
          <p className="text-[10px] opacity-20 mt-1 italic">Connecting to secure civic cloud...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-1000 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/5 pb-6">
        <div>
          <span className="hero__kicker">Smart City Infrastructure</span>
          <h1 className="hero__title" style={{ fontSize: '2.5rem', textAlign: 'left', marginBottom: '0.5rem' }}>Management Dashboard</h1>
          <p className="text-slate-400 text-sm max-w-lg">Monitor civic complaints, track maintenance crews, and optimize city resources through real-time AI analytics.</p>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          {usingDemo && (
            <div className="glass px-3 py-1 rounded-lg border-amber/20 bg-amber/5 flex items-center gap-2">
              <Database className="w-3 h-3 text-amber" />
              <span className="text-[9px] font-bold text-amber uppercase tracking-wider">Demo Mode Active</span>
            </div>
          )}
          <div className="glass px-4 py-2 rounded-xl border-aqua/20 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-aqua animate-pulse shadow-[0_0_10px_#5ee7df]"></div>
            <span className="text-[10px] font-bold tracking-widest uppercase opacity-60">Operations Live</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Reports" value={stats.total} icon={<BarChart3 />} color="aqua" subtitle="TOTAL SUBMITTED" />
        <StatCard label="Awaiting Action" value={stats.pending} icon={<Clock />} color="amber" subtitle="PENDING REVIEW" />
        <StatCard label="Crews On-Site" value={stats.inProgress} icon={<AlertCircle />} color="violet" subtitle="IN PROGRESS" />
        <StatCard label="Issue Resolved" value={stats.resolved} icon={<CheckCircle2 />} color="lime" subtitle="SUCCESSFULLY FIXED" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Map */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 px-2">
            <MapIcon className="w-4 h-4 text-aqua" />
            <h3 className="font-display text-lg uppercase tracking-wider">Geospatial Distribution</h3>
          </div>
          <div className="glass-card p-1 h-[500px] rounded-3xl overflow-hidden relative border-white/10 shadow-2xl">
            <DashboardMap 
              complaints={filteredComplaints} 
              onComplaintClick={(c) => setSelectedComplaint(c)} 
            />
          </div>
        </div>

        {/* Feed */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-violet" />
              <h3 className="font-display text-lg uppercase tracking-wider">Live Incident Feed</h3>
            </div>
            <span className="glass px-2 py-0.5 rounded text-[9px] font-bold opacity-40">{filteredComplaints.length} INCIDENTS</span>
          </div>
          
          <div className="glass-card flex flex-col h-[500px] p-0 rounded-3xl overflow-hidden border-white/10">
             <div className="p-4 bg-white/5 border-b border-white/5">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 opacity-30" />
                  <input 
                    type="text" 
                    placeholder="Search by category, description or status..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs outline-none focus:border-aqua/40 transition-all placeholder:opacity-30" 
                  />
                </div>
             </div>
             
             <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar bg-black/20">
                {filteredComplaints.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-20 italic text-xs gap-2">
                    <Search className="w-8 h-8" />
                    No matching records
                  </div>
                ) : (
                  filteredComplaints.map((c) => (
                    <div 
                      key={c.id} 
                      onClick={() => setSelectedComplaint(c)}
                      className="glass p-4 rounded-2xl border-white/5 hover:border-aqua/20 hover:bg-aqua/5 cursor-pointer transition-all duration-300 group relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-aqua/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="flex justify-between items-start mb-3">
                        <span className={`glass-badge glass-badge--${getStatusColor(c.status)} scale-90 origin-left`}>{c.status || 'Pending'}</span>
                        <span className="text-[9px] opacity-20 font-black tracking-tighter">
                          {c.createdAt?.toDate ? new Date(c.createdAt.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'NEW'}
                        </span>
                      </div>
                      <h4 className="text-xs font-black uppercase tracking-wide group-hover:text-aqua transition-colors truncate">{c.category || 'Maintenance Issue'}</h4>
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">{c.description}</p>
                      
                      <div className="mt-3 flex items-center justify-between">
                         <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${c.priority === 'High' ? 'text-rose' : c.priority === 'Medium' ? 'text-amber' : 'text-aqua'} opacity-70`}>
                          {c.priority} Priority
                        </span>
                        <div className="w-1.5 h-1.5 rounded-full bg-white/10 group-hover:bg-aqua transition-colors"></div>
                      </div>
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

function StatCard({ label, value, icon, color, subtitle }) {
  const themes = {
    aqua: 'from-aqua/20 to-transparent border-aqua/10 text-aqua shadow-[0_10px_30px_rgba(94,231,223,0.05)]',
    violet: 'from-violet/20 to-transparent border-violet/10 text-violet shadow-[0_10px_30px_rgba(180,144,245,0.05)]',
    amber: 'from-amber/20 to-transparent border-amber/10 text-amber shadow-[0_10px_30px_rgba(255,210,127,0.05)]',
    lime: 'from-lime/20 to-transparent border-lime/10 text-lime shadow-[0_10px_30px_rgba(168,240,138,0.05)]'
  };

  return (
    <div className={`glass-card p-6 bg-gradient-to-br ${themes[color]} flex flex-col justify-between hover:translate-y-[-4px] transition-all duration-500 rounded-3xl border-white/5`}>
      <div className="flex justify-between items-center">
        <div className="opacity-40">{cloneElement(icon, { size: 18 })}</div>
        <div className="w-8 h-1 rounded-full bg-white/5"></div>
      </div>
      <div className="mt-8">
        <div className="text-[10px] font-black opacity-30 tracking-[0.2em] uppercase mb-1">{subtitle}</div>
        <div className="text-4xl font-black tracking-tighter">{value}</div>
        <div className="text-[11px] font-bold opacity-60 mt-2">{label}</div>
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
