import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { 
  Search, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  Filter, 
  RefreshCcw,
  MapPin,
  Calendar,
  Phone
} from 'lucide-react';

export function CitizenTracker({ user }) {
  const [complaints, setComplaints] = useState([]);
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'resolved'

  useEffect(() => {
    if (!user?.phoneNumber) return;

    setLoading(true);
    const dataReceived = { complaints: false, emergencies: false };

    // Query for Complaints
    const qComplaints = query(
      collection(db, 'complaints'),
      where('phone', '==', user.phoneNumber)
    );

    const unsubscribeComplaints = onSnapshot(qComplaints, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        collection: 'complaints',
        ...doc.data()
      }));
      setComplaints(docs);
      dataReceived.complaints = true;
      if (dataReceived.emergencies) setLoading(false);
    });

    // Query for Emergencies
    const qEmergencies = query(
      collection(db, 'emergencies'),
      where('phone', '==', user.phoneNumber)
    );

    const unsubscribeEmergencies = onSnapshot(qEmergencies, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        collection: 'emergencies',
        ...doc.data(),
        category: doc.data().type || 'Emergency SOS',
        description: doc.data().description || `Emergency SOS signal reported from this device.`
      }));
      setEmergencies(docs);
      dataReceived.emergencies = true;
      if (dataReceived.complaints) setLoading(false);
    });

    // Fallback if no data is received within a timeout
    const timeoutId = setTimeout(() => {
      setLoading(false);
    }, 5000);

    return () => {
      unsubscribeComplaints();
      unsubscribeEmergencies();
      clearTimeout(timeoutId);
    };
  }, [user]);

  const allIncidents = [...complaints, ...emergencies].sort((a, b) => {
    const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 
                  a.createdAt?.toDate ? a.createdAt.toDate().getTime() : Date.now();
    const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 
                  b.createdAt?.toDate ? b.createdAt.toDate().getTime() : Date.now();
    return timeB - timeA;
  });

  const filteredIncidents = allIncidents.filter(incident => {
    if (filter === 'all') return true;
    if (filter === 'pending') return incident.status?.toLowerCase() !== 'resolved';
    if (filter === 'resolved') return incident.status?.toLowerCase() === 'resolved';
    return true;
  });

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'resolved': return 'text-lime shadow-[0_0_10px_rgba(16,185,129,0.3)]';
      case 'in progress':
      case 'dispatched': return 'text-aqua shadow-[0_0_10px_rgba(96,165,250,0.3)]';
      case 'pending': return 'text-amber shadow-[0_0_10px_rgba(251,191,36,0.3)]';
      default: return 'text-slate-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'resolved': return <CheckCircle2 className="w-4 h-4" />;
      case 'in progress':
      case 'dispatched': return <Clock className="w-4 h-4" />;
      case 'pending': return <AlertCircle className="w-4 h-4" />;
      default: return <RefreshCcw className="w-4 h-4" />;
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-12 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-aqua mb-2">
            <div className="p-2 glass rounded-lg">
              <Search className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Neural Tracking System</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white">
            My <span className="text-aqua">Reports</span>
          </h1>
          <p className="text-slate-400 text-sm md:text-base font-medium max-w-lg">
            Monitor the real-time status and deployment progress of your reported incidents and emergencies.
          </p>
        </div>

        <div className="flex items-center gap-2 glass p-1 rounded-xl">
          <button 
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-[10px] font-black tracking-widest transition-all ${filter === 'all' ? 'bg-aqua text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            ALL
          </button>
          <button 
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg text-[10px] font-black tracking-widest transition-all ${filter === 'pending' ? 'bg-aqua text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            ACTIVE
          </button>
          <button 
            onClick={() => setFilter('resolved')}
            className={`px-4 py-2 rounded-lg text-[10px] font-black tracking-widest transition-all ${filter === 'resolved' ? 'bg-aqua text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            RESOLVED
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-aqua/20 border-t-aqua animate-spin"></div>
            <div className="absolute inset-0 bg-aqua/10 blur-xl rounded-full"></div>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-aqua animate-pulse">Syncing with Central Command...</p>
        </div>
      ) : filteredIncidents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredIncidents.map((incident, index) => (
            <Card 
              key={incident.id} 
              className="group hover:border-aqua/40 transition-all duration-500 overflow-hidden"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`glass-badge ${incident.collection === 'emergencies' ? 'bg-rose/20 text-rose border-rose/30' : 'bg-aqua/20 text-aqua border-aqua/30'}`}>
                      {incident.collection === 'emergencies' ? 'EMERGENCY SOS' : incident.category}
                    </span>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">#{incident.id.slice(-6)}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white group-hover:text-aqua transition-colors line-clamp-1 mt-1">
                    {incident.collection === 'emergencies' ? 'Emergency Assistance' : incident.category}
                  </h3>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full glass border-white/5 ${getStatusColor(incident.status)}`}>
                  {getStatusIcon(incident.status)}
                  <span className="text-[10px] font-black uppercase tracking-widest">{incident.status || 'Pending'}</span>
                </div>
              </div>

              <p className="text-sm text-slate-400 leading-relaxed mb-8 line-clamp-2 min-h-[2.8rem]">
                {incident.description}
              </p>

              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg glass flex items-center justify-center text-slate-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Reported</span>
                    <span className="text-[11px] text-white font-bold">
                      {incident.createdAt?.toDate ? incident.createdAt.toDate().toLocaleDateString() : 'Recent'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg glass flex items-center justify-center text-slate-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Location</span>
                    <span className="text-[11px] text-white font-bold truncate">
                      {incident.location?.lat ? `${incident.location.lat.toFixed(4)}, ${incident.location.lng.toFixed(4)}` : 'Digital Signal'}
                    </span>
                  </div>
                </div>
              </div>

              {incident.imageUrl && (
                <div className="mt-6 rounded-xl overflow-hidden aspect-video relative group/img">
                  <img src={incident.imageUrl} alt="Evidence" className="w-full h-full object-cover grayscale group-hover/img:grayscale-0 transition-all duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>
                  <div className="absolute bottom-4 left-4">
                    <span className="glass-badge bg-black/40 text-white/80 backdrop-blur-md">Evidence Logged</span>
                  </div>
                </div>
              )}

              {(incident.operatorFeedback || incident.assignedTo) && (
                <div className="mt-6 space-y-4">
                  {incident.assignedTo && (
                    <div className="flex items-center gap-3 glass-card p-3 border-white/5 bg-aqua/5">
                      <div className="w-8 h-8 rounded-full bg-aqua/10 flex items-center justify-center text-aqua">
                        <Phone className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black uppercase opacity-40">Assigned Personnel</span>
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">{incident.assignedTo}</span>
                      </div>
                    </div>
                  )}
                  {incident.operatorFeedback && (
                    <div className="glass-card p-4 border-white/5 bg-white/5 italic">
                      <div className="flex items-center gap-2 mb-2 opacity-30">
                        <RefreshCcw className="w-3 h-3" />
                        <span className="text-[8px] font-black uppercase tracking-[0.2em]">Operational Update</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed font-medium">
                        "{incident.operatorFeedback}"
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              <div className="mt-6 flex justify-end">
                <Button className="h-10 px-6 text-[10px] font-black tracking-[0.2em] group/btn">
                  VIEW TIMELINE <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="glass p-12 md:p-20 rounded-3xl text-center border-dashed border-2 border-white/10">
          <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mb-8 mx-auto border border-white/10">
            <RefreshCcw className="w-10 h-10 text-slate-600" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">No Records Found</h2>
          <p className="text-slate-400 max-w-sm mx-auto mb-10 leading-relaxed font-medium">
            We couldn't find any maintenance reports or emergency signals associated with the phone number <span className="text-aqua">{user?.phoneNumber}</span>.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="primary" className="h-14 px-10" onClick={() => window.location.href = '#/report'}>
              FILE NEW REPORT
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
