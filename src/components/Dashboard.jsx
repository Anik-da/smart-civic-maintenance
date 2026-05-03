import { useState, useEffect, cloneElement, useMemo } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { ComplaintModal } from './ComplaintModal';
import { DashboardMap } from './DashboardMap';
import {
  Trash2,
  ShieldCheck,
  Plus,
  XCircle,
  ChevronRight,
  Settings,
  Bell,
  BarChart3,
  Users,
  LogOut,
  Clock,
  AlertCircle,
  CheckCircle2,
  Map as MapIcon,
  TrendingUp,
  Search,
  UserPlus,
  RefreshCcw
} from 'lucide-react';
import { ControlCenterSidebar } from './ControlCenterSidebar';

const DEMO_COMPLAINTS = [
  {
    id: 'demo-1',
    category: 'Road Damage',
    description: 'Large pothole on MG Road near Central Mall causing traffic hazard. Multiple vehicles damaged.',
    status: 'In Progress',
    priority: 'High',
    location: { lat: 12.9716, lng: 77.5946 },
    assignedTo: 'ROADS',
    estimatedEndDate: new Date(Date.now() + 86400000 * 5).toISOString(),
    createdAt: { toDate: () => new Date(Date.now() - 3600000) }
  },
  {
    id: 'demo-2',
    category: 'Streetlight',
    description: 'Three consecutive streetlights non-functional on 5th Cross Road. Area completely dark after 7pm.',
    status: 'Pending',
    priority: 'Medium',
    location: { lat: 12.9756, lng: 77.5906 },
    assignedTo: 'ELECTRICITY',
    estimatedEndDate: new Date(Date.now() + 86400000 * 3).toISOString(),
    createdAt: { toDate: () => new Date(Date.now() - 7200000) }
  },
  {
    id: 'demo-3',
    category: 'Garbage',
    description: 'Overflowing garbage bins at Jayanagar 4th Block junction. Waste spilling onto pedestrian walkway.',
    status: 'Dispatched',
    priority: 'Medium',
    location: { lat: 12.9256, lng: 77.5836 },
    assignedTo: 'SANITATION',
    estimatedEndDate: new Date(Date.now() + 86400000 * 2).toISOString(),
    createdAt: { toDate: () => new Date(Date.now() - 14400000) }
  },
  {
    id: 'demo-4',
    category: 'Water Leak',
    description: 'Major water pipe burst on 11th Main Road. Water flooding the street and adjacent properties.',
    status: 'Resolved',
    priority: 'High',
    location: { lat: 12.9346, lng: 77.6106 },
    assignedTo: 'WATER',
    estimatedEndDate: new Date(Date.now() - 86400000).toISOString(),
    createdAt: { toDate: () => new Date(Date.now() - 86400000) }
  },
  {
    id: 'demo-5',
    category: 'Drainage',
    description: 'Storm drain blocked with debris near Lalbagh Gate. Water pooling during rains causing flooding.',
    status: 'Pending',
    priority: 'Low',
    location: { lat: 12.9507, lng: 77.5848 },
    assignedTo: 'WATER',
    estimatedEndDate: new Date(Date.now() + 86400000 * 4).toISOString(),
    createdAt: { toDate: () => new Date(Date.now() - 43200000) }
  }
];

const DEMO_NOTIFICATIONS = [
  { id: 1, type: 'critical', text: 'Emergency SOS signal received from Sector 7. Immediate dispatch required.', time: '2 mins ago' },
  { id: 2, type: 'warning', text: 'Heavy rain forecast for next 6 hours. Potential flooding in low-lying areas.', time: '15 mins ago' },
  { id: 3, type: 'info', text: 'Maintenance crew ROADS-04 has completed the repair at MG Road.', time: '1 hour ago' },
  { id: 4, type: 'info', text: 'New staff member registered: Sarah Chen (Electric Dept).', time: '3 hours ago' },
  { id: 5, type: 'info', text: 'Weekly system health check completed. All sensors functional.', time: '5 hours ago' }
];

export function Dashboard({ user, onLogout }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, resolved: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [usingDemoIncidents, setUsingDemoIncidents] = useState(false);
  const [usingDemoNotifications, setUsingDemoNotifications] = useState(false);
  const [activeTab, setActiveTab] = useState('incidents'); // 'incidents', 'staff', 'analytics', 'notifications'
  const [notifications, setNotifications] = useState([]); // Initialize empty for real-time
  const [staff, setStaff] = useState([]);
  const [newStaff, setNewStaff] = useState({ name: '', department: 'ROADS', role: 'WORKER', passcode: '', avatarUrl: '' });
  const [showAddStaff, setShowAddStaff] = useState(false);

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
    let unsubscribeComplaints;
    let unsubscribeEmergencies;
    let unsubscribeStaff;
    let unsubscribeNotifications;
    let timeoutId;
    let isSubscribed = true;

    const dataReceived = {
      complaints: false,
      emergencies: false,
      notifications: false
    };

    const activateIncidentFallback = () => {
      if (!isSubscribed) return;
      if (dataReceived.complaints || dataReceived.emergencies) return; // Don't fallback if we got live data
      console.log('Using Dashboard Incident Demo Data Fallback');
      setComplaints(DEMO_COMPLAINTS);
      setStats(calculateStats(DEMO_COMPLAINTS));
      setUsingDemoIncidents(true);
      setLoading(false);
    };

    const activateNotificationFallback = () => {
      if (!isSubscribed) return;
      if (dataReceived.notifications) return; // Don't fallback if we got live data
      console.log('Using Dashboard Notification Demo Data Fallback');
      setNotifications(DEMO_NOTIFICATIONS);
      setUsingDemoNotifications(true);
    };

    timeoutId = setTimeout(() => {
      if (isSubscribed) {
        if (!dataReceived.complaints && !dataReceived.emergencies) {
          activateIncidentFallback();
        }
        if (!dataReceived.notifications) {
          activateNotificationFallback();
        }
      }
    }, 4000); // Increased to 4s for slower connections

    try {
      const qC = collection(db, 'complaints');
      const qN = collection(db, 'notifications');
      let currentComplaints = [];
      let currentEmergencies = [];

      const updateMerged = () => {
        if (!isSubscribed) return;
        
        // Merge and Sort manually to handle missing timestamps gracefully
        const merged = [...currentComplaints, ...currentEmergencies].sort((a, b) => {
          // Use Date.now() as fallback for serverTimestamp() which is null initially
          const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 
                        a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 
                        a.createdAt instanceof Date ? a.createdAt.getTime() : Date.now();
          
          const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 
                        b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 
                        b.createdAt instanceof Date ? b.createdAt.getTime() : Date.now();
          
          return timeB - timeA;
        });

        if (merged.length > 0) {
          setComplaints(merged);
          setStats(calculateStats(merged));
          setUsingDemoIncidents(false);
          setLoading(false);
        } else if (dataReceived.complaints && dataReceived.emergencies) {
           // We received live data from both, but it's empty
           setComplaints([]);
           setStats({ total: 0, pending: 0, inProgress: 0, resolved: 0 });
           setUsingDemoIncidents(false);
           setLoading(false);
        } else if (!loading && !usingDemoIncidents) {
           activateIncidentFallback();
        }
      };

      // Removed orderBy from query to prevent excluding documents missing the field
      unsubscribeComplaints = onSnapshot(qC, (snapshot) => {
        dataReceived.complaints = true;
        currentComplaints = snapshot.docs.map(doc => ({ id: doc.id, collectionName: 'complaints', ...doc.data() }));
        updateMerged();
      }, (error) => {
        console.warn('Firestore Complaints Error:', error.message);
        activateIncidentFallback();
      });

      const qE = collection(db, 'emergencies');
      unsubscribeEmergencies = onSnapshot(qE, (snapshot) => {
        dataReceived.emergencies = true;
        currentEmergencies = snapshot.docs.map(doc => ({
          id: doc.id,
          collectionName: 'emergencies',
          ...doc.data(),
          category: doc.data().type || 'Emergency SOS',
          description: `Emergency signal received from ${doc.data().phone || 'unknown user'}. Immediate attention required.`
        }));
        updateMerged();
      }, (error) => {
        console.warn('Firestore Emergencies Error:', error.message);
      });

      // Allow all authorized staff to see personnel for assignment
      if (user?.role) {
        const qS = collection(db, 'staff');
        unsubscribeStaff = onSnapshot(qS, (snapshot) => {
          setStaff(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
      }

      // Live Notifications Listener
      unsubscribeNotifications = onSnapshot(qN, (snapshot) => {
        dataReceived.notifications = true;
        const liveNotes = snapshot.docs.map(doc => {
          const data = doc.data();
          let timeStr = 'Just now';
          if (data.createdAt) {
            const date = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
            const diffMs = Date.now() - date.getTime();
            const diffMins = Math.floor(diffMs / 60000);
            if (diffMins < 1) timeStr = 'Just now';
            else if (diffMins < 60) timeStr = `${diffMins} mins ago`;
            else if (diffMins < 1440) timeStr = `${Math.floor(diffMins / 60)} hrs ago`;
            else timeStr = date.toLocaleDateString();
          }
          return { id: doc.id, ...data, time: timeStr };
        }).sort((a, b) => {
          const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 
                        a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 
                        a.createdAt instanceof Date ? a.createdAt.getTime() : Date.now();
          
          const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 
                        b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 
                        b.createdAt instanceof Date ? b.createdAt.getTime() : Date.now();
          
          return timeB - timeA;
        });

        if (liveNotes.length > 0) {
          setNotifications(liveNotes);
          setUsingDemoNotifications(false);
        } else if (dataReceived.notifications) {
          setNotifications([]);
          setUsingDemoNotifications(false);
        }
      });
    } catch (err) {
      console.warn('Sync Firestore Error:', err);
      clearTimeout(timeoutId);
      activateIncidentFallback();
      activateNotificationFallback();
    }

    return () => {
      isSubscribed = false;
      if (unsubscribeComplaints) unsubscribeComplaints();
      if (unsubscribeEmergencies) unsubscribeEmergencies();
      if (unsubscribeStaff) unsubscribeStaff();
      if (unsubscribeNotifications) unsubscribeNotifications();
      clearTimeout(timeoutId);
    };
  }, [user?.role]); // Run on mount and if role changes

  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (!newStaff.name || !newStaff.passcode) return;

    try {
      await addDoc(collection(db, 'staff'), {
        ...newStaff,
        createdAt: new Date()
      });
      setNewStaff({ name: '', department: 'ROADS', role: 'WORKER', passcode: '', avatarUrl: '' });
      setShowAddStaff(false);
    } catch (err) {
      console.error('Failed to add staff:', err);
    }
  };

  const handleRemoveStaff = async (id) => {
    if (window.confirm('Are you sure you want to remove this staff member?')) {
      try {
        await deleteDoc(doc(db, 'staff', id));
      } catch (err) {
        console.error('Failed to remove staff:', err);
      }
    }
  };

  const [statusFilter, setStatusFilter] = useState('All');

  const filteredComplaints = (complaints || []).filter(c => {
    const matchesSearch = !searchTerm || (
      c.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.status?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const matchesStatus = statusFilter === 'All' || c.status?.toLowerCase() === statusFilter.toLowerCase();

    const matchesRole = user?.role === 'ADMIN' || 
                        c.assignedTo === user?.department || 
                        c.assignedDept === user?.department ||
                        c.assignedTo === 'ADMIN' || 
                        !c.assignedTo;

    return matchesSearch && matchesStatus && matchesRole;
  });

  // Calculate stats based on filtered complaints to keep UI consistent
  const currentStats = calculateStats(filteredComplaints);

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
    <div className="main-container">
      <ControlCenterSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={onLogout}
      />

      {/* Main Content Area */}
      <main className="content-area custom-scrollbar">
        {activeTab === 'incidents' ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4 flex-wrap w-full">
              <div>
                <span className="hero__kicker text-blue-500">Smart City Infrastructure</span>
                <h1 className="text-4xl font-display tracking-tight mb-2 text-blue-400">Operations Center</h1>
                <p className="text-blue-100/60 text-sm max-w-lg">Monitoring {user?.department} operations across the metropolitan area.</p>
              </div>
              <div className="flex items-center gap-4 bg-blue-500/5 p-2 rounded-md border border-blue-500/10">
                <div className="text-right">
                  <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{user?.department}</div>
                  <div className="text-[8px] text-blue-100/40 font-bold uppercase">Active Sector</div>
                </div>
                <div className="w-px h-8 bg-blue-500/20"></div>
                <div className="flex items-center gap-2 px-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shadow-[0_0_8px_rgba(96,165,250,0.5)]"></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-100/80">System Live</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div onClick={() => setStatusFilter('All')} className="cursor-pointer">
                <StatCard label="Active Reports" value={currentStats.total} icon={<BarChart3 />} color="aqua" subtitle="TOTAL SUBMITTED" active={statusFilter === 'All'} />
              </div>
              <div onClick={() => setStatusFilter('Pending')} className="cursor-pointer">
                <StatCard label="Awaiting Action" value={currentStats.pending} icon={<Clock />} color="amber" subtitle="PENDING REVIEW" active={statusFilter === 'Pending'} />
              </div>
              <div onClick={() => setStatusFilter('In Progress')} className="cursor-pointer">
                <StatCard label="Crews On-Site" value={currentStats.inProgress} icon={<AlertCircle />} color="violet" subtitle="IN PROGRESS" active={statusFilter === 'In Progress'} />
              </div>
              <div onClick={() => setStatusFilter('Resolved')} className="cursor-pointer">
                <StatCard label="Issue Resolved" value={currentStats.resolved} icon={<CheckCircle2 />} color="lime" subtitle="SUCCESSFULLY FIXED" active={statusFilter === 'Resolved'} />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Map */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <MapIcon className="w-4 h-4 text-aqua" />
                    <h3 className="font-display text-lg uppercase tracking-wider">Geospatial Distribution</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase opacity-30 tracking-widest">Real-time GPS Tracking</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-aqua"></div>
                  </div>
                </div>
                <div className="professional-surface p-1 h-[600px] rounded-md overflow-hidden relative shadow-xl">
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
                    <h3 className="font-display text-lg uppercase tracking-wider">Operational Feed</h3>
                  </div>
                  <span className="glass px-2 py-0.5 rounded text-[9px] font-black opacity-40 uppercase tracking-tighter">
                    {filteredComplaints.length} Records {usingDemoIncidents ? '(DEMO)' : '(LIVE)'}
                  </span>
                </div>

                <div className="professional-surface flex flex-col h-[600px] p-0 rounded-md overflow-hidden">
                  <div className="p-5 bg-white/5 border-b border-white/5">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
                      <input
                        type="text"
                        placeholder="Search incidents or locations..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-md py-3.5 pl-12 pr-4 text-xs outline-none focus:border-blue-400/40 transition-all placeholder:opacity-30 font-medium"
                      />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-black/20">
                    {filteredComplaints.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center opacity-20 italic text-xs gap-3">
                        <Search className="w-10 h-10" />
                        <span className="uppercase tracking-widest font-black">No active records match your query</span>
                      </div>
                    ) : (
                      filteredComplaints.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => setSelectedComplaint(c)}
                          className={`professional-surface p-5 border-white/5 hover:border-blue-400/30 hover:bg-blue-400/5 cursor-pointer transition-all duration-500 group relative overflow-hidden ${c.status?.toLowerCase() === 'resolved' ? 'opacity-60 grayscale-[0.5]' : ''}`}
                        >
                          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-aqua/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                          <div className="flex justify-between items-start mb-4">
                            <span className={`glass-badge glass-badge--${getStatusColor(c.status)} px-3 py-1 font-black`}>{c.status || 'Pending'}</span>
                            <div className="flex flex-col items-end">
                              <span className="text-[9px] opacity-40 font-bold uppercase tracking-widest mb-1">Incident ID</span>
                              <span className="text-[10px] font-mono font-bold opacity-20 group-hover:opacity-100 transition-opacity">#{c.id.slice(-6).toUpperCase()}</span>
                            </div>
                          </div>

                          {c.imageUrl && (
                            <div className="mb-4 rounded-lg overflow-hidden border border-white/10 aspect-video relative group/img">
                              <img 
                                src={c.imageUrl} 
                                alt={c.category} 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity"></div>
                            </div>
                          )}

                          <h4 className="text-sm font-black uppercase tracking-wide group-hover:text-aqua transition-colors mb-2">{c.category || 'Maintenance Issue'}</h4>
                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">{c.description}</p>

                          <div className="mt-5 pt-5 border-t border-white/5 space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-aqua">
                                  <Users className="w-3.5 h-3.5" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[8px] opacity-40 font-bold uppercase">Assigned Unit</span>
                                  <span className="text-[10px] font-black text-white/80 uppercase tracking-wider">
                                    {c.assignedTo ? (
                                      c.assignedDept ? `${c.assignedTo} (${c.assignedDept})` : c.assignedTo
                                    ) : 'UNASSIGNED'}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-[8px] opacity-40 font-bold uppercase block mb-1">Est. Completion</span>
                                <span className="text-[10px] font-black text-violet">
                                  {c.estimatedEndDate ? new Date(c.estimatedEndDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: '2-digit' }) : 'PENDING'}
                                </span>
                              </div>
                            </div>

                            {c.operatorFeedback && (
                              <div className="mt-4 p-4 bg-blue-400/5 border border-blue-400/20 rounded-xl relative group/note overflow-hidden">
                                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover/note:opacity-30 transition-opacity">
                                  <RefreshCcw className="w-12 h-12 -rotate-12" />
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></div>
                                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-blue-400/80">Operational Note</span>
                                </div>
                                <p className="text-xs text-blue-100/90 font-medium leading-relaxed">
                                  {c.operatorFeedback}
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="mt-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full ${c.priority === 'High' ? 'bg-rose shadow-[0_0_8px_#f43f5e]' : c.priority === 'Medium' ? 'bg-amber shadow-[0_0_8px_#fbbf24]' : 'bg-aqua shadow-[0_0_8px_#5ee7df]'}`}></div>
                              <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${c.priority === 'High' ? 'text-rose' : c.priority === 'Medium' ? 'text-amber' : 'text-aqua'}`}>
                                {c.priority} Priority
                              </span>
                            </div>
                            <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-aqua" />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'staff' ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
            <div className="flex justify-between items-end">
              <div>
                <span className="hero__kicker">Human Resources</span>
                <h1 className="text-4xl font-display tracking-tight mb-2">Staff Hub</h1>
                <p className="text-slate-400 text-sm max-w-lg">Managing authorized personnel, department allocations, and secure access credentials.</p>
              </div>
              <button
                onClick={() => setShowAddStaff(true)}
                className="professional-surface px-8 py-4 bg-blue-600/10 border-blue-500/30 hover:bg-blue-600/20 transition-all flex items-center gap-3 text-[11px] font-black tracking-[0.2em] uppercase shadow-lg shadow-blue-500/5"
              >
                <UserPlus className="w-4 h-4" /> Register New Personnel
              </button>
            </div>

            <div className="staff-grid">
              {staff.length === 0 ? (
                <div className="col-span-full h-64 flex flex-col items-center justify-center opacity-20 italic gap-4">
                  <Users className="w-16 h-16" />
                  <span className="text-lg font-display uppercase tracking-widest">No personnel records found in database</span>
                </div>
              ) : (
                staff.map((member) => (
                  <div key={member.id} className="premium-card p-6 border-white/5 hover:border-violet/30 transition-all group relative">
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleRemoveStaff(member.id)}
                        className="p-2.5 bg-rose/10 text-rose rounded-md hover:bg-rose/20 transition-all hover:scale-110"
                        title="Remove Staff"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 rounded-md bg-white/5 flex items-center justify-center overflow-hidden border border-white/5 shadow-inner">
                        {member.avatarUrl ? (
                          <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-2xl font-black text-violet">
                            {(member.name || 'S')[0]}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm uppercase tracking-wide text-blue-400 truncate">{member.name || 'Staff Member'}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[8px] px-2 py-0.5 bg-violet/10 text-violet rounded-md font-black uppercase tracking-widest border border-violet/20">
                            {member.role}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center px-1">
                        <span className="text-[9px] opacity-40 font-bold uppercase tracking-wider">Operational Unit</span>
                        <span className="text-[10px] font-black text-aqua uppercase">{member.department}</span>
                      </div>
                      <div className="p-4 bg-black/40 rounded-md border border-white/5 group-hover:border-violet/20 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-3.5 h-3.5 text-lime" />
                            <span className="text-[9px] opacity-40 font-bold uppercase tracking-widest">Access Passcode</span>
                          </div>
                          <div className="w-1.5 h-1.5 rounded-full bg-lime/40"></div>
                        </div>
                        <code className="text-sm font-mono font-bold tracking-[0.3em] text-white/90 block text-center pt-1">{member.passcode}</code>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between opacity-30 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-lime"></div>
                        <span className="text-[8px] font-bold uppercase tracking-widest">Active</span>
                      </div>
                      <span className="text-[8px] font-bold uppercase tracking-widest">ID: {member.id.slice(-4)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : activeTab === 'analytics' ? (() => {
          // ── Compute analytics from live complaint data ──
          const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          const dayCounts = [0, 0, 0, 0, 0, 0, 0];
          const categoryMap = {};
          const deptStats = { ROADS: { total: 0, resolved: 0 }, ELECTRICITY: { total: 0, resolved: 0 }, WATER: { total: 0, resolved: 0 }, SANITATION: { total: 0, resolved: 0 }, ADMIN: { total: 0, resolved: 0 } };
          let highPriorityTotal = 0;
          let highPriorityResolved = 0;

          complaints.forEach(c => {
            // Day-of-week distribution
            const created = c.createdAt?.toDate ? c.createdAt.toDate() : (c.createdAt ? new Date(c.createdAt) : new Date());
            dayCounts[created.getDay()]++;

            // Category hotspot counting
            const cat = c.category || 'Other';
            categoryMap[cat] = (categoryMap[cat] || 0) + 1;

            // Department SLA
            const dept = (c.assignedTo || '').toUpperCase();
            if (deptStats[dept]) {
              deptStats[dept].total++;
              if (c.status?.toLowerCase() === 'resolved') deptStats[dept].resolved++;
            }

            // Priority clearance
            if (c.priority?.toLowerCase() === 'high') {
              highPriorityTotal++;
              if (c.status?.toLowerCase() === 'resolved') highPriorityResolved++;
            }
          });

          // Re-order day counts so Mon first: [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
          const orderedDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
          const orderedCounts = [dayCounts[1], dayCounts[2], dayCounts[3], dayCounts[4], dayCounts[5], dayCounts[6], dayCounts[0]];
          const maxDayCount = Math.max(...orderedCounts, 1);
          const barPercents = orderedCounts.map(c => Math.max(Math.round((c / maxDayCount) * 100), 5));

          // Top hotspots from categories
          const hotspots = Object.entries(categoryMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([loc, count]) => ({ loc, count }));

          // Priority clearance rate
          const clearanceRate = highPriorityTotal > 0 ? Math.round((highPriorityResolved / highPriorityTotal) * 100) : 0;

          // SLA compliance per department
          const slaData = Object.entries(deptStats).map(([dept, s]) => ({
            dept,
            perf: s.total > 0 ? Math.round((s.resolved / s.total) * 100) : 0
          }));

          // Resource allocation from staff
          const activeStaff = staff.length;
          const totalCapacity = Math.max(activeStaff + 6, 10);
          const capacityPercent = Math.round((activeStaff / totalCapacity) * 100);

          return (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
            <div>
              <span className="hero__kicker">Performance Metrics</span>
              <h1 className="text-4xl font-display tracking-tight mb-2">Operational Analytics</h1>
              <p className="text-slate-400 text-sm max-w-lg">Advanced insights into service delivery, response efficiency, and infrastructure health.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <div className="premium-card p-8">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-aqua" />
                      Incident Resolution Trend
                    </h3>
                    <div className="flex gap-2">
                      <span className="glass px-2 py-1 rounded text-[8px] font-bold uppercase tracking-tighter border-aqua/30 text-aqua">{complaints.length} Total</span>
                    </div>
                  </div>
                  <div className="chart-container">
                    {orderedDays.map((day, i) => (
                      <div key={day} className="chart-bar-wrap">
                        <div className="chart-bar" style={{ height: `${barPercents[i]}%`, animationDelay: `${i * 80}ms` }}></div>
                        <span className="chart-label">{day}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="premium-card p-8">
                    <h3 className="text-sm font-black uppercase tracking-widest mb-6 text-violet">Top Hotspots</h3>
                    <div className="space-y-6">
                      {hotspots.length === 0 ? (
                        <p className="text-xs opacity-30 italic">No complaint data available yet</p>
                      ) : hotspots.map((hotspot, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-violet/10 flex items-center justify-center text-[10px] font-bold text-violet">{i + 1}</div>
                            <span className="text-xs font-bold">{hotspot.loc}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-black">{hotspot.count} cases</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="premium-card p-8">
                    <h3 className="text-sm font-black uppercase tracking-widest mb-6 text-amber">Priority Shift</h3>
                    <div className="flex justify-center py-4">
                      <div className="gauge-ring" style={{ '--progress': `${clearanceRate}%` }}>
                        <div className="gauge-value text-amber">{clearanceRate}%</div>
                      </div>
                    </div>
                    <p className="text-[10px] text-center opacity-40 font-bold uppercase tracking-widest mt-4">High Priority Clearance Rate</p>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div className="premium-card p-8 bg-aqua/5 border-aqua/20">
                  <h3 className="text-sm font-black uppercase tracking-widest mb-6">SLA Compliance</h3>
                  <div className="space-y-6">
                    {slaData.map((d, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black tracking-widest uppercase">
                          <span>{d.dept}</span>
                          <span className={d.perf > 85 ? 'text-lime' : d.perf > 0 ? 'text-amber' : 'opacity-30'}>{d.perf}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-right from-aqua to-violet transition-all duration-1000" style={{ width: `${d.perf}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="premium-card p-8">
                  <h3 className="text-sm font-black uppercase tracking-widest mb-4">Resource Allocation</h3>
                  <div className="p-4 bg-black/40 rounded-md border border-white/5">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] opacity-40 font-bold uppercase">Active Units</span>
                      <span className="text-lg font-display text-aqua">{activeStaff} / {totalCapacity}</span>
                    </div>
                    <div className={`text-[8px] font-black uppercase tracking-widest ${capacityPercent > 70 ? 'text-lime' : capacityPercent > 40 ? 'text-amber' : 'text-rose'}`}>
                      {capacityPercent > 70 ? 'Optimal Capacity' : capacityPercent > 40 ? 'Moderate Load' : 'Low Staffing'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          );
        })() : activeTab === 'notifications' ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
            <div className="flex justify-between items-end">
              <div>
                <span className="hero__kicker">Communication Center</span>
                <h1 className="text-4xl font-display tracking-tight mb-2">Command Feed</h1>
                <p className="text-slate-400 text-sm max-w-lg">Real-time log of system events, emergency broadcasts, and operational updates.</p>
              </div>
              <button
                onClick={() => setNotifications([])}
                className="glass px-6 py-3 rounded-md border-white/10 hover:bg-white/5 transition-all text-[10px] font-black tracking-widest uppercase opacity-40 hover:opacity-100"
              >
                Clear History
              </button>
            </div>

            <div className="max-w-3xl">
              <div className="timeline-container">
                {notifications.length === 0 ? (
                  <div className="py-20 text-center opacity-20 italic">
                    <Bell className="w-12 h-12 mx-auto mb-4" />
                    <p className="uppercase tracking-[0.3em] font-black">No active notifications</p>
                  </div>
                ) : (
                  notifications.map((n) => {
                    const normalizedType = (n.type || '').toLowerCase();
                    return (
                      <div key={n.id} className="timeline-item group">
                        <div className={`timeline-dot ${normalizedType === 'warning' ? 'timeline-dot--warning' : normalizedType === 'critical' ? 'timeline-dot--critical' : ''}`}></div>
                        <div className="timeline-content">
                          <span className="timeline-time">{n.time}</span>
                          {n.title && <h5 className="text-[11px] font-black uppercase tracking-widest text-white/90 mb-1">{n.title}</h5>}
                          <p className="timeline-text">{n.text || n.message}</p>
                          <div className="mt-4 flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="text-[9px] font-black uppercase text-aqua tracking-widest hover:underline">Acknowledge</button>
                            <button className="text-[9px] font-black uppercase text-violet tracking-widest hover:underline">View Details</button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        ) : null}
      </main>

      {showAddStaff && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="glass-card w-full max-w-md p-8 rounded-md border-violet/20 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-violet/20 rounded-md">
                  <UserPlus className="w-5 h-5 text-violet" />
                </div>
                <h3 className="text-xl font-display uppercase tracking-widest">Add New Staff</h3>
              </div>
              <button onClick={() => setShowAddStaff(false)} className="p-2 opacity-40 hover:opacity-100 transition-opacity">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Full Name</label>
                <input
                  autoFocus
                  required
                  type="text"
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="w-full bg-white/5 border border-white/10 rounded-md p-4 text-sm outline-none focus:border-violet/40 focus:bg-violet/5 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Department</label>
                  <select
                    value={newStaff.department}
                    onChange={(e) => setNewStaff({ ...newStaff, department: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-md p-4 text-sm outline-none focus:border-violet/40 appearance-none"
                  >
                    <option value="ROADS">ROADS</option>
                    <option value="ELECTRICITY">ELECTRICITY</option>
                    <option value="WATER">WATER</option>
                    <option value="SANITATION">SANITATION</option>
                    <option value="ADMIN">ADMINISTRATION</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Role</label>
                  <select
                    value={newStaff.role}
                    onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-md p-4 text-sm outline-none focus:border-violet/40 appearance-none"
                  >
                    <option value="WORKER">WORKER</option>
                    <option value="ADMIN">ADMINISTRATOR</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Avatar Image URL (Optional)</label>
                <input
                  type="url"
                  value={newStaff.avatarUrl}
                  onChange={(e) => setNewStaff({ ...newStaff, avatarUrl: e.target.value })}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full bg-white/5 border border-white/10 rounded-md p-4 text-sm outline-none focus:border-violet/40 focus:bg-violet/5 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Access Passcode</label>
                <div className="relative">
                  <input
                    required
                    type="text"
                    value={newStaff.passcode}
                    onChange={(e) => setNewStaff({ ...newStaff, passcode: e.target.value.toUpperCase() })}
                    placeholder="e.g. WORKER_2026"
                    className="w-full bg-white/5 border border-white/10 rounded-md p-4 text-sm font-mono tracking-widest outline-none focus:border-violet/40 focus:bg-violet/5 transition-all"
                  />
                  <ShieldCheck className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-20" />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-violet/20 border border-violet/30 rounded-md text-[11px] font-black tracking-[0.2em] uppercase hover:bg-violet/30 transition-all mt-4 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Register Staff Member
              </button>
            </form>
          </div>
        </div>
      )}


      {selectedComplaint && (
        <ComplaintModal
          complaint={selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          staff={staff}
          userRole={user?.role}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color, subtitle, active }) {
  const themes = {
    aqua: 'from-aqua/20 to-transparent border-aqua/10 text-aqua shadow-[0_10px_30px_rgba(94,231,223,0.05)]',
    violet: 'from-violet/20 to-transparent border-violet/10 text-violet shadow-[0_10px_30px_rgba(180,144,245,0.05)]',
    amber: 'from-amber/20 to-transparent border-amber/10 text-amber shadow-[0_10px_30px_rgba(255,210,127,0.05)]',
    lime: 'from-lime/20 to-transparent border-lime/10 text-lime shadow-[0_10px_30px_rgba(168,240,138,0.05)]'
  };

  const activeBorders = {
    aqua: 'border-aqua/50 bg-aqua/10',
    violet: 'border-violet/50 bg-violet/10',
    amber: 'border-amber/50 bg-amber/10',
    lime: 'border-lime/50 bg-lime/10'
  };

  return (
    <div className={`professional-surface p-6 bg-gradient-to-br ${themes[color]} ${active ? activeBorders[color] : 'border-white/5'} flex flex-col justify-between hover:translate-y-[-4px] transition-all duration-500 rounded-md`}>
      <div className="flex justify-between items-center">
        <div className={active ? 'opacity-100 text-white' : 'opacity-40 text-blue-400'}>{cloneElement(icon, { size: 18 })}</div>
        <div className={`w-8 h-1 rounded-full ${active ? 'bg-white/20' : 'bg-white/5'}`}></div>
      </div>
      <div className="mt-8">
        <div className={`text-[10px] font-black tracking-[0.2em] uppercase mb-1 ${active ? 'opacity-60' : 'opacity-30'}`}>{subtitle}</div>
        <div className="text-4xl font-black tracking-tighter text-blue-400">{value}</div>
        <div className={`text-[11px] font-bold mt-2 ${active ? 'opacity-100' : 'opacity-60'}`}>{label}</div>
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
