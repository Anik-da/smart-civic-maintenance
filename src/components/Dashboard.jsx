import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Card } from './ui/Card';
import { MapPin, AlertCircle, Clock, CheckCircle, List, Map } from 'lucide-react';
import { DashboardMap } from './DashboardMap';
import { ComplaintModal } from './ComplaintModal';

export function Dashboard() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');

  useEffect(() => {
    const q = query(collection(db, 'complaints'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const issues = [];
      querySnapshot.forEach((doc) => issues.push({ id: doc.id, ...doc.data() }));
      setComplaints(issues);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredComplaints = useMemo(() => {
    return complaints.filter(c => {
      const catMatch = filterCategory === 'All' || (c.category && c.category.toLowerCase() === filterCategory.toLowerCase());
      const prioMatch = filterPriority === 'All' || c.priority === filterPriority;
      return catMatch && prioMatch;
    });
  }, [complaints, filterCategory, filterPriority]);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'text-red-300 bg-red-500/15 border-red-500/20';
      case 'Medium': return 'text-amber-300 bg-amber-500/15 border-amber-500/20';
      case 'Low': return 'text-blue-300 bg-blue-500/15 border-blue-500/20';
      default: return 'text-slate-300 bg-slate-500/15 border-slate-500/20';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Resolved': return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'In Progress': return <Clock className="w-4 h-4 text-amber-400" />;
      default: return <AlertCircle className="w-4 h-4 text-red-400" />;
    }
  };

  const selectClasses = "px-4 py-2.5 rounded-xl text-sm bg-white/5 border border-white/10 text-slate-200 outline-none focus:border-purple-500/50 transition-all cursor-pointer";

  return (
    <Card className="w-full max-w-7xl mx-auto" title="Operator Dashboard">
      
      {/* Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/5">
          <button 
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${viewMode === 'list' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/20' : 'text-slate-400 hover:text-white'}`}
          >
            <List className="w-4 h-4" /> List
          </button>
          <button 
            onClick={() => setViewMode('map')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${viewMode === 'map' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/20' : 'text-slate-400 hover:text-white'}`}
          >
            <Map className="w-4 h-4" /> Map
          </button>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className={selectClasses}>
            <option value="All">All Categories</option>
            <option value="road">Road</option>
            <option value="garbage">Garbage</option>
            <option value="electricity">Electricity</option>
            <option value="accident">Accident</option>
            <option value="other">Other</option>
          </select>
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className={selectClasses}>
            <option value="All">All Urgencies</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="overflow-x-auto rounded-2xl border border-white/5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3.5 text-left font-semibold text-slate-400 text-xs uppercase tracking-wider">Image</th>
                <th className="px-4 py-3.5 text-left font-semibold text-slate-400 text-xs uppercase tracking-wider">Description</th>
                <th className="px-4 py-3.5 text-left font-semibold text-slate-400 text-xs uppercase tracking-wider">Category</th>
                <th className="px-4 py-3.5 text-left font-semibold text-slate-400 text-xs uppercase tracking-wider">Priority</th>
                <th className="px-4 py-3.5 text-left font-semibold text-slate-400 text-xs uppercase tracking-wider">Status</th>
                <th className="px-4 py-3.5 text-left font-semibold text-slate-400 text-xs uppercase tracking-wider">Assignee</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="px-4 py-12 text-center text-slate-500">
                  <div className="flex items-center justify-center gap-3"><div className="w-5 h-5 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>Loading...</div>
                </td></tr>
              ) : filteredComplaints.length === 0 ? (
                <tr><td colSpan="6" className="px-4 py-12 text-center text-slate-500">No complaints match your filters.</td></tr>
              ) : (
                filteredComplaints.map(issue => (
                  <tr 
                    key={issue.id} 
                    onClick={() => setSelectedComplaint(issue)}
                    className="border-b border-white/5 hover:bg-white/[0.03] transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      {issue.imageUrl ? (
                        <img src={issue.imageUrl} alt="Issue" className="w-12 h-12 object-cover rounded-xl border border-white/10" />
                      ) : (
                        <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-xs text-slate-500">N/A</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-200 max-w-[200px] truncate" title={issue.description}>{issue.description}</td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/20 capitalize">{issue.category || 'Uncategorized'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(issue.priority)}`}>{issue.priority || 'Unclassified'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-slate-300 font-medium text-xs">
                        {getStatusIcon(issue.status)}
                        {issue.status}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-medium truncate max-w-[100px] text-xs">{issue.assignedTo || 'Unassigned'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <DashboardMap complaints={filteredComplaints} onComplaintClick={(complaint) => setSelectedComplaint(complaint)} />
      )}

      {selectedComplaint && (
        <ComplaintModal complaint={selectedComplaint} onClose={() => setSelectedComplaint(null)} />
      )}
    </Card>
  );
}
